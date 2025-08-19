import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage as dbStorage } from "./storage";
import {
  insertReservationSchema,
  contactFormSchema,
  cartItemSchema,
  insertEquipmentSchema,
  updateEquipmentSchema,
} from "@shared/schema";
import { z } from "zod";
import QRCode from "qrcode";
import { generateInvoicePDF } from "./invoice";
import { sendContractEmails } from "./emailService";
import { initializeOrderCounter } from "../shared/utils";
import multer from "multer";
import path from "path";
import fs from "fs/promises";
import express from "express";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize order counter based on existing orders
  try {
    const existingReservations = await dbStorage.getAllReservations();
    const existingOrderNumbers = existingReservations.map((r) => r.orderNumber);
    initializeOrderCounter(existingOrderNumbers);
  } catch (error) {
    // Order counter will start from 1 if initialization fails
  }

  // Authentication middleware
  const requireAuth = (req: any, res: any, next: any) => {
    if ((req.session as any)?.authenticated) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // Authentication routes
  app.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;

    if (username === "Honza" && password === "Rada1+Honza") {
      (req.session as any).authenticated = true;
      (req.session as any).username = username;

      // Explicitly save the session before responding
      req.session.save((err: any) => {
        if (err) {
          return res.status(500).json({ message: "Session save failed" });
        }
        res.json({ success: true, message: "Login successful" });
      });
    } else {
      res.status(401).json({ message: "Nesprávné přihlašovací údaje" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ success: true, message: "Logout successful" });
    });
  });

  app.get("/api/auth/status", (req, res) => {
    if ((req.session as any)?.authenticated) {
      res.json({
        authenticated: true,
        username: (req.session as any).username,
      });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });

  // Configure multer for image uploads
  const uploadDir = path.join(process.cwd(), "client", "public", "uploads");

  // Ensure upload directory exists
  try {
    await fs.mkdir(uploadDir, { recursive: true });
  } catch (error) {
    // Upload directory already exists or could not be created
  }

  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      // Keep original filename without changes
      cb(null, file.originalname);
    },
  });

  const upload = multer({
    storage: multerStorage,
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|webp/;
      const extname = allowedTypes.test(
        path.extname(file.originalname).toLowerCase(),
      );
      const mimetype = allowedTypes.test(file.mimetype);

      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error("Only .png, .jpg, .jpeg and .webp images are allowed!"));
      }
    },
  });

  // Image upload endpoint (protected)
  app.post(
    "/api/upload-image",
    requireAuth,
    upload.single("image"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ message: "No file uploaded" });
        }

        const imageUrl = `/uploads/${req.file.filename}`;
        res.json({ imageUrl });
      } catch (error) {
        res.status(500).json({ message: "Failed to upload image" });
      }
    },
  );

  // Serve uploaded images
  app.use(
    "/uploads",
    express.static(path.join(process.cwd(), "client", "public", "uploads")),
  );

  // Get all equipment
  app.get("/api/equipment", async (req, res) => {
    try {
      const equipment = await dbStorage.getAllEquipment();
      res.json(equipment);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ message: "Failed to fetch equipment" });
    }
  });

  // Add new equipment (protected)
  app.post("/api/equipment", requireAuth, async (req, res) => {
    try {
      const validatedData = insertEquipmentSchema.parse(req.body);
      const equipment = await dbStorage.createEquipment(validatedData);
      res.status(201).json(equipment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }

      console.error("Chyba při vytváření vybavení:", error);

      res.status(500).json({ message: "Failed to create equipment" });
    }
  });

  // Update equipment (protected)
  app.put("/api/equipment/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid equipment ID" });
      }
      const validatedData = updateEquipmentSchema.parse(req.body);
      const equipment = await dbStorage.updateEquipment(id, validatedData);
      if (!equipment) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      res.json(equipment);
    } catch (error) {
      console.error("❌ PUT /api/equipment/:id failed:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update equipment" });
    }
  });

  // Delete equipment (protected)
  app.delete("/api/equipment/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await dbStorage.deleteEquipment(Number(id));
      if (!success) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      res.json({ message: "Equipment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete equipment" });
    }
  });

  // Update equipment order (protected)
  app.post("/api/equipment/reorder", requireAuth, async (req, res) => {
    try {
      const { equipmentOrders } = req.body;
      if (!Array.isArray(equipmentOrders)) {
        return res
          .status(400)
          .json({ message: "equipmentOrders must be an array" });
      }

      await dbStorage.updateEquipmentOrders(equipmentOrders);
      res.json({ message: "Equipment order updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update equipment order" });
    }
  });

  // Check equipment availability
  app.post("/api/equipment/:id/availability", async (req, res) => {
    try {
      const { id } = req.params;
      const { dateFrom, dateTo } = req.body;

      if (!dateFrom || !dateTo) {
        return res
          .status(400)
          .json({ message: "dateFrom and dateTo are required" });
      }

      const isAvailable = await dbStorage.checkEquipmentAvailability(
        Number(id),
        dateFrom,
        dateTo,
      );
      const availableQuantity = await dbStorage.getAvailableQuantity(
        Number(id),
        dateFrom,
        dateTo,
      );
      res.json({ available: isAvailable, availableQuantity });
    } catch (error) {
      res.status(500).json({ message: "Failed to check availability" });
    }
  });

  // Create reservation
  app.post("/api/reservations", async (req, res) => {
    try {
      // Validate the main reservation data
      const contactSchema = contactFormSchema.extend({
        cartItems: z.array(cartItemSchema).min(1, "Cart cannot be empty"),
      });

      const validatedData = contactSchema.parse(req.body);
      const { cartItems, ...contactData } = validatedData;

      // Calculate totals
      let totalPrice = 0;
      let totalDeposit = 0;

      // Verify availability for all items
      for (const item of cartItems) {
        const isAvailable = await dbStorage.checkEquipmentAvailability(
          parseInt(item.id),
          item.dateFrom,
          item.dateTo,
        );

        if (!isAvailable) {
          return res.status(400).json({
            message: `Equipment ${item.name} is not available for the selected dates`,
          });
        }

        totalPrice += item.totalPrice;
        totalDeposit += item.deposit;
      }

      // Create the main reservation
      const reservationData = {
        ...contactData,
        equipmentId: parseInt(cartItems[0].id),
        dateFrom: cartItems[0].dateFrom,
        dateTo: cartItems[0].dateTo,
        totalPrice,
        totalDeposit,
        quantity: cartItems.reduce((sum, item) => sum + item.quantity, 0),
      };

      const reservation = await dbStorage.createReservation(reservationData);

      // Verify availability before creating reservation items
      for (const item of cartItems) {
        const availableQuantity = await dbStorage.getAvailableQuantity(
          parseInt(item.id),
          item.dateFrom,
          item.dateTo,
        );
        if (availableQuantity < item.quantity) {
          return res.status(400).json({
            error: `Nedostatek kusů pro ${item.name}. Dostupné: ${availableQuantity}, požadované: ${item.quantity}`,
          });
        }
      }

      // Create reservation items
      const reservationItems = [];
      for (const item of cartItems) {
        const reservationItem = await dbStorage.createReservationItem({
          reservationId: reservation.id,
          equipmentId: parseInt(item.id),
          dateFrom: item.dateFrom,
          dateTo: item.dateTo,
          days: item.days,
          quantity: item.quantity,
          dailyPrice: item.dailyPrice, 
          totalPrice: item.totalPrice,
          deposit: item.deposit,
        });
        reservationItems.push(reservationItem);
      }

      // Generate QR code for payment
      const paymentUrl = `/payment/${reservation.orderNumber}`;
      const qrCodeDataUrl = await QRCode.toDataURL(paymentUrl);

      // Generate PDF contract and send emails
      try {
        // Prepare data for PDF generation
        const invoiceData = {
          invoiceNumber: reservation.orderNumber,
          orderNumber: reservation.orderNumber,
          customerName: reservation.customerName,
          customerEmail: reservation.customerEmail,
          customerPhone: reservation.customerPhone,
          customerAddress: reservation.customerAddress,
          customerIdNumber: "", // Field doesn't exist in schema, using empty string
          pickupLocation: reservation.pickupLocation,
          dateFrom: cartItems[0].dateFrom,
          dateTo: cartItems[0].dateTo,
          totalPrice: totalPrice,
          totalDeposit: totalDeposit,
          items: cartItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            dailyPrice: item.dailyPrice,
            deposit: item.deposit,
            totalPrice: item.totalPrice,
          })),
        };

        // Generate PDF contract
        const pdfBuffer = await generateInvoicePDF(invoiceData);

        // Send emails to customer and business owner
        const emailResults = await sendContractEmails(
          reservation.customerEmail,
          reservation.customerName,
          reservation.orderNumber,
          pdfBuffer,
        );

      } catch (emailError) {
        // Email sending failed, but don't fail the reservation creation
      }

      res.status(201).json({
        reservation,
        reservationItems,
        qrCode: qrCodeDataUrl,
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors,
        });
      }
      res.status(500).json({ message: "Failed to create reservation" });
    }
  });

  // Get all reservations for admin with their items
  app.get("/api/reservations", requireAuth, async (req, res) => {
    try {
      const reservations = await dbStorage.getAllReservations();
      res.json(reservations);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });

  // Update reservation (protected)
  app.put("/api/reservations/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { dateFrom, dateTo, quantity, items } = req.body;

      if (!dateFrom || !dateTo || !quantity) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      const updated = await dbStorage.updateReservation(parseInt(id), {
        dateFrom,
        dateTo,
        quantity,
      });
      if (!updated) {
        return res.status(404).json({ message: "Reservation not found" });
      }

      // If items are provided, update reservation items with new prices
      if (items && Array.isArray(items)) {
        await dbStorage.updateReservationItems(parseInt(id), items);
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update reservation" });
    }
  });

  // Get reservation items
  app.get("/api/reservations/:id/items", async (req, res) => {
    try {
      const { id } = req.params;
      const reservationItems = await dbStorage.getReservationItems(
        parseInt(id),
      );
      res.json(reservationItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reservation items" });
    }
  });

  // Update reservation items (protected)
  app.put("/api/reservations/:id/items", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { items } = req.body;

      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ message: "Items array is required" });
      }

      await dbStorage.updateReservationItems(parseInt(id), items);

      res.json({ message: "Reservation items updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update reservation items" });
    }
  });

  // Delete reservation (protected)
  app.delete("/api/reservations/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await dbStorage.deleteReservation(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      res.json({ message: "Reservation deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reservation" });
    }
  });

  // Get reservation by order number
  app.get("/api/reservations/:orderNumber", async (req, res) => {
    try {
      const { orderNumber } = req.params;
      const reservation =
        await dbStorage.getReservationByOrderNumber(orderNumber);

      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }

      const reservationItems = await dbStorage.getReservationItems(
        reservation.id,
      );

      res.json({
        reservation,
        reservationItems,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reservation" });
    }
  });

  // Get reservations for equipment (for calendar)
  app.get("/api/equipment/:id/reservations", async (req, res) => {
    try {
      const { id } = req.params;

      const reservationItems = await dbStorage.getReservationsForEquipment(
        Number(id),
      );

      res.json({
        reservations: reservationItems,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Failed to fetch equipment reservations" });
    }
  });

  // Generate invoice for reservation (protected)
  app.post("/api/reservations/:id/invoice", requireAuth, async (req, res) => {
    try {
      const reservationId = parseInt(req.params.id);

      // Get reservation with items
      const reservation = await dbStorage.getReservation(reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }

      // Invoice number is the same as order number
      const invoiceNumber = reservation.orderNumber;

      // Get reservation items
      const items = await dbStorage.getReservationItems(reservationId);
      const equipment = await dbStorage.getAllEquipment();

      if (!items || items.length === 0) {
        throw new Error("No items found for this reservation");
      }

      // Prepare invoice data
      const invoiceItems = items.map((item) => {
        const equipmentInfo = equipment.find(
          (eq) => eq.id === item.equipmentId,
        );
        return {
          name: equipmentInfo?.name || `Equipment ${item.equipmentId}`,
          quantity: item.quantity,
          dailyPrice: item.dailyPrice,
          deposit: item.deposit,
          totalPrice: item.totalPrice,
        };
      });

      // Calculate actual totals from items
      const actualTotalPrice = items.reduce(
        (sum, item) => sum + item.totalPrice,
        0,
      );
      const actualTotalDeposit = items.reduce(
        (sum, item) => sum + item.deposit * item.quantity,
        0,
      );

      const invoiceData = {
        invoiceNumber,
        orderNumber: reservation.orderNumber,
        customerName: reservation.customerName,
        customerEmail: reservation.customerEmail,
        customerPhone: reservation.customerPhone,
        customerAddress: reservation.customerAddress,
        customerIdNumber: undefined,
        pickupLocation: reservation.pickupLocation,
        dateFrom: reservation.dateFrom,
        dateTo: reservation.dateTo,
        totalPrice: actualTotalPrice,
        totalDeposit: actualTotalDeposit,
        items: invoiceItems,
      };

      // Generate PDF
      const pdfBuffer = await generateInvoicePDF(invoiceData);

      // Save PDF to file for testing
      const testFilePath = path.join(
        process.cwd(),
        "test_opensans_preload.pdf",
      );
      await fs.writeFile(testFilePath, pdfBuffer);

      // Set response headers for PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="smlouva-${invoiceNumber}.pdf"`,
      );
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  });

  // Update reservation status (protected)
  app.patch("/api/reservations/:id/status", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (
        !status ||
        !["čekající", "vypůjčené", "vrácené", "zrušené"].includes(status)
      ) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const updatedReservation = await dbStorage.updateReservationStatus(
        id,
        status,
      );

      if (updatedReservation) {
        res.json(updatedReservation);
      } else {
        res.status(404).json({ error: "Reservation not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Delete reservation
  app.delete("/api/reservations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await dbStorage.deleteReservation(id);

      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Reservation not found" });
      }
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


app.get("/api/items", async (req, res) => {
  try {
    const items = await dbStorage.getAllEquipment(); // nebo getItems(), pokud to máš jinak
    res.json(items);
  } catch (error) {
    console.error("Chyba při načítání items:", error);
    res.status(500).json({ message: "Nepodařilo se načíst položky" });
  }
});


  const httpServer = createServer(app);
  return httpServer;
}