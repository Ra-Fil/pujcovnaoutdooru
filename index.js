var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express3 from "express";
import session from "express-session";

// server/routes.ts
import { createServer } from "http";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  cartItemSchema: () => cartItemSchema,
  contactFormSchema: () => contactFormSchema,
  equipment: () => equipment,
  insertEquipmentSchema: () => insertEquipmentSchema,
  insertReservationItemSchema: () => insertReservationItemSchema,
  insertReservationSchema: () => insertReservationSchema,
  reservationItems: () => reservationItems,
  reservations: () => reservations,
  updateEquipmentSchema: () => updateEquipmentSchema
});
import { pgTable, text, serial, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  dailyPrice: integer("daily_price").notNull(),
  // Legacy field - kept for compatibility
  price1to3Days: integer("price_1_to_3_days").notNull().default(0),
  price4to7Days: integer("price_4_to_7_days").notNull().default(0),
  price8PlusDays: integer("price_8_plus_days").notNull().default(0),
  deposit: integer("deposit").notNull(),
  stock: integer("stock").notNull(),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  categories: text("categories").array().notNull().default(["general"])
});
var reservations = pgTable("reservations", {
  id: serial("id").primaryKey(),
  equipmentId: integer("equipment_id").notNull(),
  dateFrom: date("date_from").notNull(),
  dateTo: date("date_to").notNull(),
  customerName: text("customer_name").notNull(),
  customerEmail: text("customer_email").notNull(),
  customerPhone: text("customer_phone").notNull(),
  customerAddress: text("customer_address").notNull(),
  customerNote: text("customer_note"),
  pickupLocation: text("pickup_location").notNull(),
  totalPrice: integer("total_price").notNull(),
  totalDeposit: integer("total_deposit").notNull(),
  orderNumber: text("order_number").notNull().unique(),
  invoiceNumber: text("invoice_number"),
  status: text("status", { enum: ["\u010Dekaj\xEDc\xED", "vyp\u016Fj\u010Den\xE9", "vr\xE1cen\xE9", "zru\u0161en\xE9"] }).notNull().default("\u010Dekaj\xEDc\xED"),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull()
});
var reservationItems = pgTable("reservation_items", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id").notNull(),
  equipmentId: integer("equipment_id").notNull(),
  dateFrom: date("date_from").notNull(),
  dateTo: date("date_to").notNull(),
  days: integer("days").notNull(),
  quantity: integer("quantity").notNull().default(1),
  dailyPrice: integer("daily_price").notNull(),
  totalPrice: integer("total_price").notNull(),
  deposit: integer("deposit").notNull()
});
var insertEquipmentSchema = createInsertSchema(equipment).extend({
  imageUrl: z.string().min(1, "Obr\xE1zek je povinn\xFD"),
  categories: z.array(z.string()).min(1, "Vyberte alespo\u0148 jednu kategorii"),
  price1to3Days: z.number().min(0, "Cena mus\xED b\xFDt kladn\xE9 \u010D\xEDslo"),
  price4to7Days: z.number().min(0, "Cena mus\xED b\xFDt kladn\xE9 \u010D\xEDslo"),
  price8PlusDays: z.number().min(0, "Cena mus\xED b\xFDt kladn\xE9 \u010D\xEDslo")
});
var updateEquipmentSchema = createInsertSchema(equipment).omit({ id: true }).extend({
  imageUrl: z.string().min(1, "Obr\xE1zek je povinn\xFD"),
  categories: z.array(z.string()).min(1, "Vyberte alespo\u0148 jednu kategorii"),
  price1to3Days: z.number().min(0, "Cena mus\xED b\xFDt kladn\xE9 \u010D\xEDslo"),
  price4to7Days: z.number().min(0, "Cena mus\xED b\xFDt kladn\xE9 \u010D\xEDslo"),
  price8PlusDays: z.number().min(0, "Cena mus\xED b\xFDt kladn\xE9 \u010D\xEDslo")
});
var insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
  orderNumber: true,
  status: true,
  createdAt: true
});
var insertReservationItemSchema = createInsertSchema(reservationItems).omit({
  id: true
});
var cartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  dailyPrice: z.number(),
  // This will be the calculated price based on tier
  deposit: z.number(),
  dateFrom: z.string(),
  dateTo: z.string(),
  days: z.number(),
  quantity: z.number().min(1).default(1),
  totalPrice: z.number()
});
var contactFormSchema = z.object({
  customerName: z.string().min(1, "Jm\xE9no je povinn\xE9"),
  customerEmail: z.string().email("Neplatn\xFD email"),
  customerPhone: z.string().min(1, "Telefon je povinn\xFD"),
  customerAddress: z.string().min(1, "Adresa je povinn\xE1"),
  customerNote: z.string().optional(),
  pickupLocation: z.enum(["brno", "bilovice", "olomouc"], {
    errorMap: () => ({ message: "Vyberte m\xEDsto v\xFDdeje" })
  })
});

// server/db.ts
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var sql = neon(process.env.DATABASE_URL);
var db = drizzle(sql, { schema: schema_exports });

// server/storage.ts
import { eq, asc, desc } from "drizzle-orm";

// shared/utils.ts
function calculateDays(dateFrom, dateTo) {
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  return Math.ceil(diffTime / (1e3 * 60 * 60 * 24)) + 1;
}
function calculateBillableDays(dateFrom, dateTo) {
  const days = calculateDays(dateFrom, dateTo);
  return days;
}
var orderCounter = 1;
function initializeOrderCounter(existingOrders) {
  const currentYear = (/* @__PURE__ */ new Date()).getFullYear();
  const yearPrefix = `P${currentYear}`;
  const currentYearOrders = existingOrders.filter((order) => order.startsWith(yearPrefix)).map((order) => parseInt(order.replace(yearPrefix, "")) || 0).filter((num) => !isNaN(num));
  if (currentYearOrders.length > 0) {
    orderCounter = Math.max(...currentYearOrders) + 1;
  }
}
function generateOrderNumber() {
  const year = (/* @__PURE__ */ new Date()).getFullYear();
  const number = orderCounter.toString().padStart(3, "0");
  orderCounter++;
  return `P${year}${number}`;
}

// server/storage.ts
var DatabaseStorage = class {
  async getAllEquipment() {
    return await db.select().from(equipment).orderBy(asc(equipment.sortOrder), asc(equipment.id));
  }
  async getEquipment(id) {
    const [equipmentItem] = await db.select().from(equipment).where(eq(equipment.id, id));
    return equipmentItem || void 0;
  }
  async createEquipment(equipmentData) {
    const [newEquipment] = await db.insert(equipment).values(equipmentData).returning();
    return newEquipment;
  }
  async updateEquipment(id, equipmentData) {
    const [updatedEquipment] = await db.update(equipment).set(equipmentData).where(eq(equipment.id, id)).returning();
    return updatedEquipment || void 0;
  }
  async deleteEquipment(id) {
    const result = await db.delete(equipment).where(eq(equipment.id, id));
    return (result.rowCount || 0) > 0;
  }
  async updateEquipmentOrders(orders) {
    for (const order of orders) {
      await db.update(equipment).set({ sortOrder: order.sortOrder }).where(eq(equipment.id, order.id));
    }
  }
  async createReservation(reservation) {
    const orderNumber = generateOrderNumber();
    const [newReservation] = await db.insert(reservations).values({
      ...reservation,
      orderNumber,
      status: "\u010Dekaj\xEDc\xED",
      customerNote: reservation.customerNote || null
    }).returning();
    return newReservation;
  }
  async getReservation(id) {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation || void 0;
  }
  async getReservationByOrderNumber(orderNumber) {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.orderNumber, orderNumber));
    return reservation || void 0;
  }
  async getAllReservations() {
    const allReservations = await db.select().from(reservations).orderBy(desc(reservations.createdAt));
    const reservationsWithItems = await Promise.all(
      allReservations.map(async (reservation) => {
        const items = await this.getReservationItems(reservation.id);
        const currentDate = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
        const dateFrom = reservation.dateFrom;
        const dateTo = reservation.dateTo;
        let autoStatus = reservation.status;
        if (reservation.status === "\u010Dekaj\xEDc\xED" && currentDate >= dateFrom) {
          autoStatus = "vyp\u016Fj\u010Den\xE9";
        } else if ((reservation.status === "\u010Dekaj\xEDc\xED" || reservation.status === "vyp\u016Fj\u010Den\xE9") && currentDate > dateTo) {
          autoStatus = "vr\xE1cen\xE9";
        }
        if (autoStatus !== reservation.status) {
          await this.updateReservationStatus(reservation.id, autoStatus);
        }
        return {
          ...reservation,
          status: autoStatus,
          items
        };
      })
    );
    return reservationsWithItems;
  }
  async getReservationWithItems(reservationId) {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, reservationId));
    if (!reservation) return void 0;
    const items = await db.select().from(reservationItems).where(eq(reservationItems.reservationId, reservationId));
    return { reservation, items };
  }
  async updateReservationStatus(id, status) {
    const [updatedReservation] = await db.update(reservations).set({ status }).where(eq(reservations.id, id)).returning();
    return updatedReservation || void 0;
  }
  async updateReservation(id, data) {
    const [updated] = await db.update(reservations).set({
      dateFrom: data.dateFrom,
      dateTo: data.dateTo,
      quantity: data.quantity
    }).where(eq(reservations.id, id)).returning();
    return updated || void 0;
  }
  async deleteReservation(id) {
    await db.delete(reservationItems).where(eq(reservationItems.reservationId, id));
    const result = await db.delete(reservations).where(eq(reservations.id, id));
    return (result.rowCount || 0) > 0;
  }
  async createReservationItem(item) {
    const [newItem] = await db.insert(reservationItems).values(item).returning();
    return newItem;
  }
  async getReservationItems(reservationId) {
    return await db.select().from(reservationItems).where(eq(reservationItems.reservationId, reservationId));
  }
  async updateReservationItems(reservationId, items) {
    const reservation = await this.getReservation(reservationId);
    if (!reservation) return;
    await db.delete(reservationItems).where(eq(reservationItems.reservationId, reservationId));
    const dateFrom = new Date(reservation.dateFrom);
    const dateTo = new Date(reservation.dateTo);
    const days = Math.max(1, Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1e3 * 60 * 60 * 24)));
    for (const item of items) {
      const totalPrice = item.dailyPrice * days * item.quantity + item.deposit;
      await this.createReservationItem({
        reservationId,
        equipmentId: parseInt(item.equipmentId),
        dateFrom: reservation.dateFrom,
        dateTo: reservation.dateTo,
        days,
        quantity: item.quantity,
        dailyPrice: item.dailyPrice,
        totalPrice,
        deposit: item.deposit
      });
    }
  }
  async checkEquipmentAvailability(equipmentId, dateFrom, dateTo) {
    const availableQuantity = await this.getAvailableQuantity(equipmentId, dateFrom, dateTo);
    return availableQuantity > 0;
  }
  async getAvailableQuantity(equipmentId, dateFrom, dateTo) {
    const equipmentItem = await this.getEquipment(equipmentId);
    if (!equipmentItem) return 0;
    const existingReservations = await this.getReservationsForEquipment(equipmentId);
    const overlappingReservations = existingReservations.filter((reservation) => {
      const resFrom = new Date(reservation.dateFrom);
      const resTo = new Date(reservation.dateTo);
      const reqFrom = new Date(dateFrom);
      const reqTo = new Date(dateTo);
      return reqFrom <= resTo && resFrom <= reqTo;
    });
    const reservedQuantity = overlappingReservations.reduce((sum, reservation) => {
      return sum + (reservation.quantity || 1);
    }, 0);
    const availableQuantity = Math.max(0, equipmentItem.stock - reservedQuantity);
    return availableQuantity;
  }
  async getReservationsForEquipment(equipmentId) {
    return await db.select().from(reservationItems).where(eq(reservationItems.equipmentId, equipmentId));
  }
};
var storage = new DatabaseStorage();

// server/routes.ts
import { z as z2 } from "zod";
import QRCode2 from "qrcode";

// server/invoice.ts
import { jsPDF } from "jspdf";
import QRCode from "qrcode";
import fs from "fs";
import path from "path";
var PDF_MARGINS = { left: 15, right: 15, top: 15, bottom: 15 };
var PDF_WIDTH = 210;
var PDF_HEIGHT = 297;
var CONTENT_WIDTH = PDF_WIDTH - PDF_MARGINS.left - PDF_MARGINS.right;
var MAX_Y_POSITION = PDF_HEIGHT - PDF_MARGINS.bottom;
var COLORS = {
  primary: "#2D5A27",
  // Dark green
  secondary: "#4A7C59",
  // Medium green
  accent: "#6B9C6B",
  // Light green
  text: "#2C3E50",
  // Dark gray
  light: "#ECF0F1"
  // Light gray
};
function formatDate(dateString) {
  const date2 = new Date(dateString);
  return date2.toLocaleDateString("cs-CZ");
}
function formatPrice(priceInCents) {
  return `${(priceInCents / 1).toFixed(2)} K\u010D`;
}
async function checkPageBreak(doc, yPos, requiredSpace = 20) {
  if (yPos + requiredSpace > MAX_Y_POSITION) {
    doc.addPage();
    await addLogo(doc, PDF_MARGINS.left, PDF_MARGINS.top);
    let newYPos = PDF_MARGINS.top + 28;
    doc.setDrawColor(COLORS.text);
    doc.setLineWidth(0.5);
    doc.line(PDF_MARGINS.left, newYPos, PDF_WIDTH - PDF_MARGINS.right, newYPos);
    return newYPos + 8;
  }
  return yPos;
}
function renderCzechText(doc, text2, x, y) {
  try {
    const textString = String(text2);
    const xPos = Number(x);
    const yPos = Number(y);
    doc.text(textString, xPos, yPos);
  } catch (error) {
    try {
      doc.text(String(text2), Number(x), Number(y));
    } catch (fallbackError) {
      doc.text("Error rendering text", Number(x), Number(y));
    }
  }
}
async function addLogo(doc, x, y) {
  try {
    const logoPath = path.join(
      process.cwd(),
      "public",
      "uploads",
      "logo-pujcovnaoutdooru-cz.png"
    );
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      const logoBase64 = logoBuffer.toString("base64");
      const logoDataUrl = `data:image/png;base64,${logoBase64}`;
      doc.addImage(logoDataUrl, "PNG", x, y, 18, 18);
      doc.setFontSize(20);
      doc.setFont("OpenSans", "bold");
      doc.setTextColor(COLORS.text);
      renderCzechText(doc, "PUJCOVNAOUTDOORU.CZ", x + 21, y + 17);
    } else {
      doc.setFontSize(20);
      doc.setFont("OpenSans", "normal");
      doc.setTextColor(COLORS.text);
      renderCzechText(doc, "PUJCOVNAOUTDOORU.CZ", x, y + 18);
    }
  } catch (error) {
    doc.setFontSize(20);
    doc.setFont("OpenSans", "normal");
    doc.setTextColor(COLORS.text);
    renderCzechText(doc, "PUJCOVNAOUTDOORU.CZ", x, y + 18);
  }
}
async function addHeader(doc, data, yPos) {
  await addLogo(doc, PDF_MARGINS.left, yPos);
  yPos += 28;
  doc.setFontSize(14);
  doc.setFont("OpenSans", "bold");
  doc.setTextColor(COLORS.text);
  renderCzechText(doc, "Smlouva o vyp\u016Fj\u010Den\xED vybaven\xED", PDF_MARGINS.left, yPos);
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont("OpenSans", "bold");
  renderCzechText(
    doc,
    `\u010C\xEDslo smlouvy: ${data.orderNumber}`,
    PDF_MARGINS.left,
    yPos
  );
  yPos += 7;
  doc.setDrawColor(COLORS.text);
  doc.setLineWidth(0.5);
  doc.line(PDF_MARGINS.left, yPos, PDF_WIDTH - PDF_MARGINS.right, yPos);
  return yPos + 8;
}
function addPartyInfo(doc, data, yPos) {
  const midPoint = PDF_MARGINS.left + CONTENT_WIDTH / 2;
  doc.setFontSize(10);
  doc.setFont("OpenSans", "bold");
  doc.setTextColor(COLORS.text);
  renderCzechText(doc, "PRONAJ\xCDMATEL:", PDF_MARGINS.left, yPos);
  renderCzechText(doc, "N\xC1JEMCE:", midPoint, yPos);
  yPos += 6;
  doc.setFont("OpenSans", "normal");
  doc.setTextColor(COLORS.text);
  const companyInfo = [
    "Jan R\xFCcker",
    "17. listopadu 1215/2b",
    "779 00 Olomouc",
    "I\u010C: 02938316",
    "Tel.: 606 476 399",
    "Nejsem platce DPH"
  ];
  const customerInfo = [
    data.customerName,
    data.customerAddress || "",
    data.customerPhone,
    data.customerEmail,
    "\u010C\xEDslo OP:"
  ];
  for (let i = 0; i < Math.max(companyInfo.length, customerInfo.length); i++) {
    if (companyInfo[i])
      renderCzechText(doc, companyInfo[i], PDF_MARGINS.left, yPos);
    if (customerInfo[i]) renderCzechText(doc, customerInfo[i], midPoint, yPos);
    yPos += 5;
  }
  return yPos + 8;
}
function addRentalPeriod(doc, data, yPos) {
  doc.setFontSize(10);
  doc.setFont("OpenSans", "bold");
  doc.setTextColor(COLORS.text);
  renderCzechText(doc, "DOBA N\xC1JMU:", PDF_MARGINS.left, yPos);
  yPos += 5;
  doc.setFont("OpenSans", "normal");
  doc.setTextColor(COLORS.text);
  renderCzechText(
    doc,
    `Smlouva se uzav\xEDr\xE1 na dobu ur\u010Ditou od: ${formatDate(data.dateFrom)} do: ${formatDate(data.dateTo)}`,
    PDF_MARGINS.left,
    yPos
  );
  return yPos + 10;
}
async function addItemsTable(doc, data, yPos) {
  const days = calculateBillableDays(data.dateFrom, data.dateTo);
  doc.setFontSize(10);
  doc.setFont("OpenSans", "bold");
  doc.setTextColor(COLORS.text);
  renderCzechText(doc, "P\u0158EDM\u011AT SMLOUVY:", PDF_MARGINS.left, yPos);
  yPos += 3;
  doc.setFillColor(240, 240, 240);
  doc.rect(PDF_MARGINS.left, yPos, CONTENT_WIDTH, 8, "F");
  doc.setFontSize(9);
  doc.setFont("OpenSans", "bold");
  doc.setTextColor(COLORS.text);
  const headers = ["Vybaven\xED", "Ks", "Cena/den", "Dn\u016F", "P\u016Fj\u010Dovn\xE9", "Z\xE1loha"];
  const colWidths = [70, 12, 25, 12, 25, 25];
  let xPos = PDF_MARGINS.left + 2;
  headers.forEach((header, i) => {
    renderCzechText(doc, header, xPos, yPos + 5);
    xPos += colWidths[i];
  });
  yPos += 8;
  doc.setTextColor(COLORS.text);
  doc.setFont("OpenSans", "normal");
  let totalRental = 0;
  let totalDeposit = 0;
  for (let index = 0; index < data.items.length; index++) {
    const item = data.items[index];
    yPos = await checkPageBreak(doc, yPos, 10);
    const rentalPrice = item.dailyPrice * item.quantity * days;
    const depositTotal = item.deposit * item.quantity;
    totalRental += rentalPrice;
    totalDeposit += depositTotal;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.1);
    doc.rect(PDF_MARGINS.left, yPos, CONTENT_WIDTH, 6, "S");
    xPos = PDF_MARGINS.left + 2;
    const rowData = [
      item.name.substring(0, 30),
      item.quantity.toString(),
      formatPrice(item.dailyPrice),
      days.toString(),
      formatPrice(rentalPrice),
      formatPrice(depositTotal)
    ];
    rowData.forEach((data2, i) => {
      renderCzechText(doc, data2, xPos, yPos + 4);
      xPos += colWidths[i];
    });
    yPos += 6;
  }
  yPos += 8;
  yPos = await checkPageBreak(doc, yPos, 25);
  doc.setFontSize(10);
  doc.setFont("OpenSans", "bold");
  doc.setTextColor(COLORS.text);
  renderCzechText(
    doc,
    `Celkem p\u016Fj\u010Dovn\xE9: ${formatPrice(totalRental)}`,
    PDF_MARGINS.left,
    yPos
  );
  yPos += 6;
  renderCzechText(
    doc,
    `Celkem z\xE1loha: ${formatPrice(totalDeposit)}`,
    PDF_MARGINS.left,
    yPos
  );
  yPos += 8;
  doc.setFont("OpenSans", "bold");
  doc.setFontSize(12);
  renderCzechText(
    doc,
    `CELKEM K \xDAHRAD\u011A: ${formatPrice(totalRental + totalDeposit)}  - placeno p\u0159evodem / hotov\u011B`,
    PDF_MARGINS.left,
    yPos
  );
  return yPos + 10;
}
function addQRCode(doc, qrCodeDataURL, yPos) {
  if (qrCodeDataURL && typeof qrCodeDataURL === "string" && qrCodeDataURL.length > 0) {
    try {
      const qrSize = 40;
      const qrX = PDF_WIDTH - PDF_MARGINS.right - qrSize;
      const qrY = Math.max(yPos - 25, PDF_MARGINS.top);
      if (qrX > 0 && qrY > 0 && qrX + qrSize <= PDF_WIDTH && qrY + qrSize <= PDF_HEIGHT) {
        doc.addImage(qrCodeDataURL, "PNG", qrX, qrY, qrSize, qrSize);
      }
    } catch (error) {
    }
  }
  return yPos;
}
async function addSignatures(doc, yPos) {
  yPos = await checkPageBreak(doc, yPos, 50);
  doc.setFontSize(10);
  doc.setFont("OpenSans", "normal");
  doc.setTextColor(COLORS.text);
  renderCzechText(
    doc,
    "N\xE1jemce se zavazuje uhradit \u010D\xE1stku za n\xE1jem zbo\u017E\xED a slo\u017Eit z\xE1lohu. Z\xE1rove\u0148 se",
    PDF_MARGINS.left,
    yPos
  );
  yPos += 5;
  renderCzechText(
    doc,
    "zavazuje vr\xE1tit zbo\u017E\xED nepo\u0161kozen\u011B v tom stavu, v jak\xE9m zbo\u017E\xED p\u0159evzal. Sv\xFDm",
    PDF_MARGINS.left,
    yPos
  );
  yPos += 5;
  renderCzechText(
    doc,
    "podpisem stvrzuje, \u017Ee se sezn\xE1mil se smluvn\xEDmi podm\xEDnkami a souhlas\xED s nimi.",
    PDF_MARGINS.left,
    yPos
  );
  yPos += 20;
  const signatureWidth = 60;
  const spacing = 15;
  doc.setDrawColor(COLORS.text);
  doc.setLineWidth(0.3);
  doc.line(PDF_MARGINS.left, yPos, PDF_MARGINS.left + signatureWidth, yPos);
  const dateX = PDF_MARGINS.left + signatureWidth + spacing;
  doc.line(dateX, yPos, dateX + 35, yPos);
  const rightLineX = dateX + 40;
  doc.line(rightLineX, yPos, rightLineX + signatureWidth, yPos);
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont("OpenSans", "normal");
  doc.setTextColor(COLORS.text);
  renderCzechText(doc, "P\u0159edal za P\u016EJ\u010COVNAOUTDOORU.CZ", PDF_MARGINS.left, yPos);
  renderCzechText(doc, "Datum", dateX, yPos);
  renderCzechText(doc, "P\u0159evzal - podpis n\xE1jemce", rightLineX, yPos);
  yPos += 10;
  doc.setDrawColor(COLORS.text);
  doc.setLineWidth(0.3);
  doc.line(PDF_MARGINS.left, yPos, PDF_WIDTH - PDF_MARGINS.right, yPos);
  yPos += 10;
  doc.setFontSize(10);
  doc.setFont("OpenSans", "bold");
  doc.setTextColor(COLORS.text);
  renderCzechText(doc, "VR\xC1CEN\xCD:", PDF_MARGINS.left, yPos);
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont("OpenSans", "normal");
  doc.setTextColor(COLORS.text);
  renderCzechText(
    doc,
    "V\u011Bc vr\xE1cena pronaj\xEDmateli ve stavu: nepo\u0161kozen\xE1 / po\u0161kozen\xE1",
    PDF_MARGINS.left,
    yPos
  );
  yPos += 6;
  renderCzechText(
    doc,
    "Z\xE1loha vr\xE1cena ve v\xFD\u0161i: \u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026\u2026 ",
    PDF_MARGINS.left,
    yPos
  );
  yPos += 10;
  const returnSignatureWidth = 60;
  const returnSpacing = 15;
  doc.setDrawColor(COLORS.text);
  doc.setLineWidth(0.3);
  doc.line(
    PDF_MARGINS.left,
    yPos,
    PDF_MARGINS.left + returnSignatureWidth,
    yPos
  );
  const returnDateX = PDF_MARGINS.left + returnSignatureWidth + returnSpacing;
  doc.line(returnDateX, yPos, returnDateX + 35, yPos);
  const returnRightLineX = returnDateX + 40;
  doc.line(
    returnRightLineX,
    yPos,
    returnRightLineX + returnSignatureWidth,
    yPos
  );
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont("OpenSans", "normal");
  doc.setTextColor(COLORS.text);
  renderCzechText(
    doc,
    "P\u0159evzal za P\u016EJ\u010COVNAOUTDOORU.CZ",
    PDF_MARGINS.left,
    yPos
  );
  renderCzechText(doc, "Datum", returnDateX, yPos);
  renderCzechText(doc, "Vr\xE1til - podpis n\xE1jemce", returnRightLineX, yPos);
  return yPos + 10;
}
async function addBusinessTerms(doc, yPos) {
  yPos = await checkPageBreak(doc, yPos, 50);
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont("OpenSans", "bold");
  doc.setTextColor(COLORS.text);
  renderCzechText(doc, "Obchodn\xED podm\xEDnky", PDF_MARGINS.left, yPos);
  yPos += 10;
  const terms = [
    "a) Pronaj\xEDmatel pronaj\xEDm\xE1 n\xE1jemci v\u011Bci uveden\xE9 v t\xE9to smlouv\u011B a n\xE1jemce se zavazuje v\u011Bc u\u017E\xEDvat za \xFA\u010Delem a zp\u016Fsobem, kter\xFDm se v\u011Bc obvykle u\u017E\xEDv\xE1 vzhledem ke sv\xE9 povaze a ur\u010Den\xED. Ob\u011B smluvn\xED strany prohla\u0161uj\xED, \u017Ee v\u011Bc je p\u0159ed\xE1v\xE1na a p\u0159eb\xEDr\xE1na ve stavu zp\u016Fsobil\xE9m k obvykl\xE9mu u\u017E\xEDv\xE1n\xED.",
    "",
    "b) N\xE1jemn\xED smlouva se uzav\xEDr\xE1 na dobu ur\u010Ditou, uvedenou v t\xE9to smlouv\u011B. N\xE1jemce se zavazuje uhradit \u010D\xE1stku za n\xE1jem v\u011Bci uvedenou v t\xE9to smlouv\u011B. N\xE1jemn\xE9 je splatn\xE9 p\u0159edem v den uzav\u0159en\xED t\xE9to smlouvy nebo p\u0159i vr\xE1cen\xED zbo\u017E\xED.",
    "",
    "c) Z\xE1nik smlouvy:",
    "   1) Po navr\xE1cen\xED zbo\u017E\xED.",
    "   2) P\xEDsemn\u011B, dohodou obou smluvn\xEDch stran.",
    "   3) Uplynut\xEDm v\xFDpov\u011Bdn\xED lh\u016Fty na z\xE1klad\u011B p\xEDsemn\xE9 v\xFDpov\u011Bdi z jak\xE9hokoliv d\u016Fvodu.",
    "V\xFDpov\u011Bdn\xED lh\u016Fta se sjedn\xE1v\xE1 desetidenn\xED a za\u010D\xEDn\xE1 b\u011B\u017Eet od n\xE1sleduj\xEDc\xEDho dne po doru\u010Den\xED v\xFDpov\u011Bdi druh\xE9 smluvn\xED stran\u011B. Ustanoven\xED dle \xA7676, odstavce 2, Ob\u010Dansk\xE9ho z\xE1kon\xEDku se neu\u017Eije.",
    "",
    "d) N\xE1jemce nesm\xED d\xE1t zbo\u017E\xED do n\xE1jmu t\u0159et\xED osob\u011B a nen\xED opr\xE1vn\u011Bn na n\u011Bm prov\xE1d\u011Bt \u017E\xE1dn\xE9 zm\u011Bny.",
    "",
    "e) N\xE1jemce se zavazuje, \u017Ee se bude o p\u0159edm\u011Bt n\xE1jemn\xED smlouvy (v\u011Bci) \u0159\xE1dn\u011B starat a u\u017E\xEDvat jej tak, aby nedo\u0161lo k jeho po\u0161kozen\xED, zni\u010Den\xED, ztr\xE1t\u011B nebo k nep\u0159im\u011B\u0159en\xE9mu opot\u0159eben\xED.",
    "",
    "f) V p\u0159\xEDpad\u011B jak\xE9koliv ztr\xE1ty nebo \xFApln\xE9ho zni\u010Den\xED v\u011Bci v dob\u011B n\xE1jmu se n\xE1jemce zavazuje uhradit pronaj\xEDmateli hodnotu v\u011Bci dle t\xE9to smlouvy.",
    "",
    "g) V p\u0159\xEDpad\u011B po\u0161kozen\xED v\u011Bci se n\xE1jemce p\u0159i vr\xE1cen\xED v\u011Bci zavazuje uhradit pronaj\xEDmateli pom\u011Brnou \u010D\xE1st hodnoty v\u011Bci, kter\xE1 odpov\xEDd\xE1 m\xED\u0159e po\u0161kozen\xED. Konkr\xE9tn\xED \u010D\xE1stka bude stanovena p\u0159i p\u0159evzet\xED v\u011Bci pronaj\xEDmatelem.",
    "",
    "h) Vr\xE1t\xED-li n\xE1jemce zbo\u017E\xED po dob\u011B dohodnut\xE9 v n\xE1jemn\xED smlouv\u011B, pop\u0159\xEDpad\u011B po uplynut\xED v\xFDpov\u011Bdn\xED lh\u016Fty, je povinen hradit n\xE1jemn\xE9 a\u017E do vr\xE1cen\xED zbo\u017E\xED a nav\xEDc uhradit poplatek z prodlen\xED ve v\xFD\u0161i denn\xED sazby n\xE1jemn\xE9ho za ka\u017Ed\xFD den prodlen\xED. V p\u0159\xEDpad\u011B ztr\xE1ty nebo zni\u010Den\xED zbo\u017E\xED tyto povinnosti n\xE1jemce trvaj\xED a\u017E do doby, kdy zni\u010Den\xED nebo ztr\xE1tu zbo\u017E\xED pronaj\xEDmateli p\xEDsemn\u011B nahl\xE1s\xED.",
    "",
    "i) P\u0159i vr\xE1cen\xED v\u011Bci pronaj\xEDmateli je n\xE1jemce povinen p\u0159edlo\u017Eit pronaj\xEDmateli stejnopis n\xE1jemn\xED smlouvy, na kter\xE9m bude potvrzeno vr\xE1cen\xED zbo\u017E\xED a jeho stav.",
    "",
    "j) P\u0159i vr\xE1cen\xED zbo\u017E\xED p\u0159ed dohodnut\xFDm term\xEDnem se n\xE1jemn\xE9 nevrac\xED.",
    "",
    "k) Tato smlouva nab\xFDv\xE1 platnosti dnem p\u0159evzet\xED v\u011Bci n\xE1jemcem. Tato smlouva je vypracov\xE1na ve dvou stejnopisech, z nich\u017E pronaj\xEDmatel i n\xE1jemce obdr\u017E\xED ka\u017Ed\xFD po jednom stejnopise."
  ];
  doc.setFontSize(10);
  doc.setFont("OpenSans", "normal");
  doc.setTextColor(COLORS.text);
  for (let index = 0; index < terms.length; index++) {
    const term = terms[index];
    doc.setFont("OpenSans", "normal");
    doc.setTextColor(COLORS.text);
    if (term.trim()) {
      const lines = doc.splitTextToSize(term, CONTENT_WIDTH);
      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex];
        yPos = await checkPageBreak(doc, yPos, 8);
        renderCzechText(doc, line, PDF_MARGINS.left, yPos);
        yPos += 4;
      }
    } else {
      yPos += 4;
    }
  }
  return yPos + 10;
}
async function generateInvoicePDF(data) {
  try {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    try {
      const regularFontPath = path.join(
        process.cwd(),
        "server",
        "OpenSans-Regular.ttf"
      );
      const regularFontBuffer = fs.readFileSync(regularFontPath);
      const regularFontBase64 = regularFontBuffer.toString("base64");
      const boldFontPath = path.join(
        process.cwd(),
        "server",
        "OpenSans-Bold.ttf"
      );
      const boldFontBuffer = fs.readFileSync(boldFontPath);
      const boldFontBase64 = boldFontBuffer.toString("base64");
      doc.addFileToVFS("OpenSans-Regular.ttf", regularFontBase64);
      doc.addFont("OpenSans-Regular.ttf", "OpenSans", "normal");
      doc.addFileToVFS("OpenSans-Bold.ttf", boldFontBase64);
      doc.addFont("OpenSans-Bold.ttf", "OpenSans", "bold");
      doc.setFont("OpenSans", "normal");
    } catch (fontError) {
      doc.setFont("Helvetica", "normal");
    }
    try {
      doc.setLanguage("cs");
      doc.setCharSpace(0);
    } catch (e) {
    }
    const days = calculateBillableDays(data.dateFrom, data.dateTo);
    let totalRental = 0;
    let totalDeposit = 0;
    data.items.forEach((item) => {
      const rentalPrice = item.dailyPrice * item.quantity * days;
      const depositTotal = item.deposit * item.quantity;
      totalRental += rentalPrice;
      totalDeposit += depositTotal;
    });
    const totalAmount = totalRental + totalDeposit;
    let qrCodeDataURL = "";
    try {
      const numberForQR = data.invoiceNumber || data.orderNumber || "000";
      const invoiceNumber = numberForQR.replace(/\D/g, "").slice(0, 10) || "000";
      const qrCodeData = `SPD*1.0*ACC:CZ3955000000000857593001*AM:${totalAmount.toFixed(2)}*CC:CZK*X-VS:${invoiceNumber}*MSG:Pujcovnaoutdooru.cz  ${invoiceNumber}`;
      qrCodeDataURL = await QRCode.toDataURL(qrCodeData, { width: 90 });
    } catch (error) {
      qrCodeDataURL = "";
    }
    let yPos = PDF_MARGINS.top;
    yPos = await addHeader(doc, data, yPos);
    yPos = addPartyInfo(doc, data, yPos);
    yPos = addRentalPeriod(doc, data, yPos);
    yPos = await addItemsTable(doc, data, yPos);
    yPos = addQRCode(doc, qrCodeDataURL, yPos);
    yPos = await addSignatures(doc, yPos);
    yPos = await addBusinessTerms(doc, yPos);
    return Buffer.from(doc.output("arraybuffer"));
  } catch (error) {
    console.error("Error generating PDF:", error);
    throw new Error(
      `Failed to generate PDF: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// server/emailService.ts
import nodemailer from "nodemailer";
var smtpConfig = {
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  },
  tls: {
    rejectUnauthorized: false,
    servername: process.env.SMTP_HOST
  }
};
var transporter = nodemailer.createTransport(smtpConfig);
async function sendEmail(params) {
  try {
    const attachments = params.attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      encoding: "base64",
      contentType: att.type
    }));
    await transporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
      attachments
    });
    return true;
  } catch (error) {
    console.error("SMTP email error:", error.message);
    return false;
  }
}
async function sendContractEmails(customerEmail, customerName, orderNumber, pdfBuffer) {
  const pdfBase64 = pdfBuffer.toString("base64");
  const customerEmailParams = {
    to: customerEmail,
    from: process.env.SMTP_USER || "honza@pujcovnaoutdooru.cz",
    subject: `Potvrzen\xED rezervace outdoorov\xE9ho vybaven\xED - ${orderNumber}`,
    html: `
      <p>Ahoj!</p>
      <p>D\u011Bkuji za objedn\xE1vku! Rezervace vybaven\xED \u010D\xEDslo <strong>${orderNumber}</strong> byla \xFAsp\u011B\u0161n\u011B vytvo\u0159ena.</p>
      <p>V p\u0159\xEDloze najde\u0161 smlouvu o vyp\u016Fj\u010Den\xED vybaven\xED, kterou podep\xED\u0161eme p\u0159i p\u0159ed\xE1n\xED.</p>
      <h3>D\u016Fle\u017Eit\xE9 informace:</h3>
      <ul>
        <li>Kontaktujte m\u011B pros\xEDm pro up\u0159esn\u011Bn\xED m\xEDsta a \u010Dasu p\u0159ed\xE1n\xED.</li>
      </ul>
      <p>Kontakt: +420 734 415 950 nebo honza@pujcovnaoutdooru.cz</p>
      <p> </p>
      <p>Honza</p>
      <p>www.pujcovnaoutdooru.cz</p>
    `,
    text: `D\u011Bkuji za objedn\xE1vku!

Rezervace vybaven\xED \u010D\xEDslo ${orderNumber} byla \xFAsp\u011B\u0161n\u011B vytvo\u0159ena.
V p\u0159\xEDloze najde\u0161 smlouvu o vyp\u016Fj\u010Den\xED vybaven\xED, kterou podep\xED\u0161eme p\u0159i p\u0159ed\xE1n\xED.

Kontakt: +420 734 415 950 nebo honza@pujcovnaoutdooru.cz

Honza
www.pujcovnaoutdooru.cz`,
    attachments: [
      {
        content: pdfBase64,
        filename: `smlouva-${orderNumber}.pdf`,
        type: "application/pdf",
        disposition: "attachment"
      }
    ]
  };
  const ownerEmailParams = {
    to: "honza@pujcovnaoutdooru.cz",
    from: process.env.SMTP_USER || "honza@pujcovnaoutdooru.cz",
    subject: `Nov\xE1 rezervace - ${orderNumber}`,
    html: `
      <h2>Nov\xE1 objedn\xE1vka byla vytvo\u0159ena</h2>
      <p><strong>\u010C\xEDslo objedn\xE1vky:</strong> ${orderNumber}</p>
      <p><strong>Z\xE1kazn\xEDk:</strong> ${customerName}</p>
      <p><strong>Email z\xE1kazn\xEDka:</strong> ${customerEmail}</p>
    `,
    text: `\u010C\xEDslo objedn\xE1vky: ${orderNumber}
Z\xE1kazn\xEDk: ${customerName}
Email z\xE1kazn\xEDka: ${customerEmail}

V p\u0159\xEDloze najdete smlouvu o vyp\u016Fj\u010Den\xED vybaven\xED.`,
    attachments: [
      {
        content: pdfBase64,
        filename: `smlouva-${orderNumber}.pdf`,
        type: "application/pdf",
        disposition: "attachment"
      }
    ]
  };
  const customerSent = await sendEmail(customerEmailParams);
  const ownerSent = await sendEmail(ownerEmailParams);
  return { customerSent, ownerSent };
}

// server/routes.ts
import multer from "multer";
import path2 from "path";
import fs2 from "fs/promises";
import express from "express";
async function registerRoutes(app2) {
  try {
    const existingReservations = await storage.getAllReservations();
    const existingOrderNumbers = existingReservations.map((r) => r.orderNumber);
    initializeOrderCounter(existingOrderNumbers);
  } catch (error) {
  }
  const requireAuth = (req, res, next) => {
    if (req.session?.authenticated) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };
  app2.post("/api/auth/login", (req, res) => {
    const { username, password } = req.body;
    if (username === "pujcovna" && password === "Rada1+honza") {
      req.session.authenticated = true;
      req.session.username = username;
      req.session.save((err) => {
        if (err) {
          return res.status(500).json({ message: "Session save failed" });
        }
        res.json({ success: true, message: "Login successful" });
      });
    } else {
      res.status(401).json({ message: "Nespr\xE1vn\xE9 p\u0159ihla\u0161ovac\xED \xFAdaje" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Error logging out" });
      }
      res.json({ success: true, message: "Logout successful" });
    });
  });
  app2.get("/api/auth/status", (req, res) => {
    if (req.session?.authenticated) {
      res.json({
        authenticated: true,
        username: req.session.username
      });
    } else {
      res.status(401).json({ authenticated: false });
    }
  });
  const uploadDir = path2.join(process.cwd(), "public", "uploads");
  try {
    await fs2.mkdir(uploadDir, { recursive: true });
  } catch (error) {
  }
  const multerStorage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    }
  });
  const upload = multer({
    storage: multerStorage,
    limits: {
      fileSize: 5 * 1024 * 1024
      // 5MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|webp/;
      const extname = allowedTypes.test(
        path2.extname(file.originalname).toLowerCase()
      );
      const mimetype = allowedTypes.test(file.mimetype);
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error("Only .png, .jpg, .jpeg and .webp images are allowed!"));
      }
    }
  });
  app2.post(
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
    }
  );
  app2.use(
    "/uploads",
    express.static(path2.join(process.cwd(), "public", "uploads"))
  );
  app2.get("/api/equipment", async (req, res) => {
    try {
      const equipment2 = await storage.getAllEquipment();
      res.json(equipment2);
    } catch (error) {
      console.error("Error fetching equipment:", error);
      res.status(500).json({ message: "Failed to fetch equipment" });
    }
  });
  app2.post("/api/equipment", requireAuth, async (req, res) => {
    try {
      const validatedData = insertEquipmentSchema.parse(req.body);
      const equipment2 = await storage.createEquipment(validatedData);
      res.status(201).json(equipment2);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create equipment" });
    }
  });
  app2.put("/api/equipment/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid equipment ID" });
      }
      const validatedData = updateEquipmentSchema.parse(req.body);
      const equipment2 = await storage.updateEquipment(id, validatedData);
      if (!equipment2) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      res.json(equipment2);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update equipment" });
    }
  });
  app2.delete("/api/equipment/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteEquipment(Number(id));
      if (!success) {
        return res.status(404).json({ message: "Equipment not found" });
      }
      res.json({ message: "Equipment deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete equipment" });
    }
  });
  app2.post("/api/equipment/reorder", requireAuth, async (req, res) => {
    try {
      const { equipmentOrders } = req.body;
      if (!Array.isArray(equipmentOrders)) {
        return res.status(400).json({ message: "equipmentOrders must be an array" });
      }
      await storage.updateEquipmentOrders(equipmentOrders);
      res.json({ message: "Equipment order updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update equipment order" });
    }
  });
  app2.post("/api/equipment/:id/availability", async (req, res) => {
    try {
      const { id } = req.params;
      const { dateFrom, dateTo } = req.body;
      if (!dateFrom || !dateTo) {
        return res.status(400).json({ message: "dateFrom and dateTo are required" });
      }
      const isAvailable = await storage.checkEquipmentAvailability(
        Number(id),
        dateFrom,
        dateTo
      );
      const availableQuantity = await storage.getAvailableQuantity(
        Number(id),
        dateFrom,
        dateTo
      );
      res.json({ available: isAvailable, availableQuantity });
    } catch (error) {
      res.status(500).json({ message: "Failed to check availability" });
    }
  });
  app2.post("/api/reservations", async (req, res) => {
    try {
      const contactSchema = contactFormSchema.extend({
        cartItems: z2.array(cartItemSchema).min(1, "Cart cannot be empty")
      });
      const validatedData = contactSchema.parse(req.body);
      const { cartItems, ...contactData } = validatedData;
      let totalPrice = 0;
      let totalDeposit = 0;
      for (const item of cartItems) {
        const isAvailable = await storage.checkEquipmentAvailability(
          parseInt(item.id),
          item.dateFrom,
          item.dateTo
        );
        if (!isAvailable) {
          return res.status(400).json({
            message: `Equipment ${item.name} is not available for the selected dates`
          });
        }
        totalPrice += item.totalPrice;
        totalDeposit += item.deposit;
      }
      const reservationData = {
        ...contactData,
        equipmentId: parseInt(cartItems[0].id),
        dateFrom: cartItems[0].dateFrom,
        dateTo: cartItems[0].dateTo,
        totalPrice,
        totalDeposit
      };
      const reservation = await storage.createReservation(reservationData);
      for (const item of cartItems) {
        const availableQuantity = await storage.getAvailableQuantity(
          parseInt(item.id),
          item.dateFrom,
          item.dateTo
        );
        if (availableQuantity < item.quantity) {
          return res.status(400).json({
            error: `Nedostatek kus\u016F pro ${item.name}. Dostupn\xE9: ${availableQuantity}, po\u017Eadovan\xE9: ${item.quantity}`
          });
        }
      }
      const reservationItems2 = [];
      for (const item of cartItems) {
        const reservationItem = await storage.createReservationItem({
          reservationId: reservation.id,
          equipmentId: parseInt(item.id),
          dateFrom: item.dateFrom,
          dateTo: item.dateTo,
          days: item.days,
          quantity: item.quantity,
          dailyPrice: item.dailyPrice,
          // This is already the correct tiered price from frontend
          totalPrice: item.totalPrice,
          // This is already calculated with tiered pricing
          deposit: item.deposit
        });
        reservationItems2.push(reservationItem);
      }
      const paymentUrl = `/payment/${reservation.orderNumber}`;
      const qrCodeDataUrl = await QRCode2.toDataURL(paymentUrl);
      try {
        const invoiceData = {
          invoiceNumber: reservation.orderNumber,
          orderNumber: reservation.orderNumber,
          customerName: reservation.customerName,
          customerEmail: reservation.customerEmail,
          customerPhone: reservation.customerPhone,
          customerAddress: reservation.customerAddress,
          customerIdNumber: "",
          // Field doesn't exist in schema, using empty string
          pickupLocation: reservation.pickupLocation,
          dateFrom: cartItems[0].dateFrom,
          dateTo: cartItems[0].dateTo,
          totalPrice,
          totalDeposit,
          items: cartItems.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            dailyPrice: item.dailyPrice,
            deposit: item.deposit,
            totalPrice: item.totalPrice
          }))
        };
        const pdfBuffer = await generateInvoicePDF(invoiceData);
        const emailResults = await sendContractEmails(
          reservation.customerEmail,
          reservation.customerName,
          reservation.orderNumber,
          pdfBuffer
        );
      } catch (emailError) {
      }
      res.status(201).json({
        reservation,
        reservationItems: reservationItems2,
        qrCode: qrCodeDataUrl
      });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({
          message: "Validation failed",
          errors: error.errors
        });
      }
      res.status(500).json({ message: "Failed to create reservation" });
    }
  });
  app2.get("/api/reservations", requireAuth, async (req, res) => {
    try {
      const reservations2 = await storage.getAllReservations();
      res.json(reservations2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reservations" });
    }
  });
  app2.put("/api/reservations/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { dateFrom, dateTo, quantity, items } = req.body;
      if (!dateFrom || !dateTo || !quantity) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      const updated = await storage.updateReservation(parseInt(id), {
        dateFrom,
        dateTo,
        quantity
      });
      if (!updated) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      if (items && Array.isArray(items)) {
        await storage.updateReservationItems(parseInt(id), items);
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ message: "Failed to update reservation" });
    }
  });
  app2.get("/api/reservations/:id/items", async (req, res) => {
    try {
      const { id } = req.params;
      const reservationItems2 = await storage.getReservationItems(
        parseInt(id)
      );
      res.json(reservationItems2);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reservation items" });
    }
  });
  app2.put("/api/reservations/:id/items", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { items } = req.body;
      if (!items || !Array.isArray(items)) {
        return res.status(400).json({ message: "Items array is required" });
      }
      await storage.updateReservationItems(parseInt(id), items);
      res.json({ message: "Reservation items updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to update reservation items" });
    }
  });
  app2.delete("/api/reservations/:id", requireAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const success = await storage.deleteReservation(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      res.json({ message: "Reservation deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete reservation" });
    }
  });
  app2.get("/api/reservations/:orderNumber", async (req, res) => {
    try {
      const { orderNumber } = req.params;
      const reservation = await storage.getReservationByOrderNumber(orderNumber);
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      const reservationItems2 = await storage.getReservationItems(
        reservation.id
      );
      res.json({
        reservation,
        reservationItems: reservationItems2
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch reservation" });
    }
  });
  app2.get("/api/equipment/:id/reservations", async (req, res) => {
    try {
      const { id } = req.params;
      const reservationItems2 = await storage.getReservationsForEquipment(
        Number(id)
      );
      res.json({
        reservations: reservationItems2
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch equipment reservations" });
    }
  });
  app2.post("/api/reservations/:id/invoice", requireAuth, async (req, res) => {
    try {
      const reservationId = parseInt(req.params.id);
      const reservation = await storage.getReservation(reservationId);
      if (!reservation) {
        return res.status(404).json({ error: "Reservation not found" });
      }
      const invoiceNumber = reservation.orderNumber;
      const items = await storage.getReservationItems(reservationId);
      const equipment2 = await storage.getAllEquipment();
      if (!items || items.length === 0) {
        throw new Error("No items found for this reservation");
      }
      const invoiceItems = items.map((item) => {
        const equipmentInfo = equipment2.find(
          (eq2) => eq2.id === item.equipmentId
        );
        return {
          name: equipmentInfo?.name || `Equipment ${item.equipmentId}`,
          quantity: item.quantity,
          dailyPrice: item.dailyPrice,
          deposit: item.deposit,
          totalPrice: item.totalPrice
        };
      });
      const actualTotalPrice = items.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );
      const actualTotalDeposit = items.reduce(
        (sum, item) => sum + item.deposit * item.quantity,
        0
      );
      const invoiceData = {
        invoiceNumber,
        orderNumber: reservation.orderNumber,
        customerName: reservation.customerName,
        customerEmail: reservation.customerEmail,
        customerPhone: reservation.customerPhone,
        customerAddress: reservation.customerAddress,
        customerIdNumber: void 0,
        pickupLocation: reservation.pickupLocation,
        dateFrom: reservation.dateFrom,
        dateTo: reservation.dateTo,
        totalPrice: actualTotalPrice,
        totalDeposit: actualTotalDeposit,
        items: invoiceItems
      };
      const pdfBuffer = await generateInvoicePDF(invoiceData);
      const testFilePath = path2.join(
        process.cwd(),
        "test_opensans_preload.pdf"
      );
      await fs2.writeFile(testFilePath, pdfBuffer);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="smlouva-${invoiceNumber}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ error: "Failed to generate invoice" });
    }
  });
  app2.patch("/api/reservations/:id/status", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      if (!status || !["\u010Dekaj\xEDc\xED", "vyp\u016Fj\u010Den\xE9", "vr\xE1cen\xE9", "zru\u0161en\xE9"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const updatedReservation = await storage.updateReservationStatus(
        id,
        status
      );
      if (updatedReservation) {
        res.json(updatedReservation);
      } else {
        res.status(404).json({ error: "Reservation not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app2.delete("/api/reservations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteReservation(id);
      if (success) {
        res.json({ success: true });
      } else {
        res.status(404).json({ error: "Reservation not found" });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  const httpServer = createServer(app2);
  return httpServer;
}

// server/vite.ts
import express2 from "express";
import fs3 from "fs";
import path4 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path3 from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  base: "/pujcovnaoutdooru/",
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path3.resolve(import.meta.dirname, "client", "src"),
      "@shared": path3.resolve(import.meta.dirname, "shared"),
      "@assets": path3.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path3.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path3.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path4.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs3.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path4.resolve(import.meta.dirname, "public");
  if (!fs3.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express2.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path4.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express3();
app.use(express3.json());
app.use(express3.urlencoded({ extended: false }));
app.use(session({
  secret: process.env.SESSION_SECRET || "your-secret-key-change-in-production",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1e3
    // 24 hours
  }
}));
app.use((req, res, next) => {
  const start = Date.now();
  const path5 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path5.startsWith("/api")) {
      let logLine = `${req.method} ${path5} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = parseInt(process.env.PORT || "8080");
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();
