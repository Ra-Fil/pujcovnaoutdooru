import { pgTable, text, serial, integer, boolean, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const equipment = pgTable("equipment", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  dailyPrice: integer("daily_price").notNull(), // Legacy field - kept for compatibility
  price1to3Days: integer("price_1_to_3_days").notNull().default(0),
  price4to7Days: integer("price_4_to_7_days").notNull().default(0),
  price8PlusDays: integer("price_8_plus_days").notNull().default(0),
  deposit: integer("deposit").notNull(),
  stock: integer("stock").notNull(),
  imageUrl: text("image_url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  categories: text("categories").array().notNull().default(["general"]),
});

export const reservations = pgTable("reservations", {
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
  status: text("status", { enum: ["čekající", "vypůjčené", "vrácené", "zrušené"] }).notNull().default("čekající"),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const reservationItems = pgTable("reservation_items", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id").notNull(),
  equipmentId: integer("equipment_id").notNull(),
  dateFrom: date("date_from").notNull(),
  dateTo: date("date_to").notNull(),
  days: integer("days").notNull(),
  quantity: integer("quantity").notNull().default(1),
  dailyPrice: integer("daily_price").notNull(),
  totalPrice: integer("total_price").notNull(),
  deposit: integer("deposit").notNull(),
});

export const insertEquipmentSchema = createInsertSchema(equipment).extend({
  imageUrl: z.string().min(1, "Obrázek je povinný"),
  categories: z.array(z.string()).min(1, "Vyberte alespoň jednu kategorii"),
  price1to3Days: z.number().min(0, "Cena musí být kladné číslo"),
  price4to7Days: z.number().min(0, "Cena musí být kladné číslo"),
  price8PlusDays: z.number().min(0, "Cena musí být kladné číslo"),
});

export const updateEquipmentSchema = createInsertSchema(equipment).omit({ id: true }).extend({
  imageUrl: z.string().min(1, "Obrázek je povinný"),
  categories: z.array(z.string()).min(1, "Vyberte alespoň jednu kategorii"),
  price1to3Days: z.number().min(0, "Cena musí být kladné číslo"),
  price4to7Days: z.number().min(0, "Cena musí být kladné číslo"),
  price8PlusDays: z.number().min(0, "Cena musí být kladné číslo"),
});
export const insertReservationSchema = createInsertSchema(reservations).omit({
  id: true,
  orderNumber: true,
  status: true,
  createdAt: true,
});
export const insertReservationItemSchema = createInsertSchema(reservationItems).omit({
  id: true,
});

export type Equipment = typeof equipment.$inferSelect;
export type InsertEquipment = z.infer<typeof insertEquipmentSchema>;
export type UpdateEquipment = z.infer<typeof updateEquipmentSchema>;
export type Reservation = typeof reservations.$inferSelect;
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type ReservationItem = typeof reservationItems.$inferSelect;
export type InsertReservationItem = z.infer<typeof insertReservationItemSchema>;

// Cart item type for frontend
export const cartItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  dailyPrice: z.number(), // This will be the calculated price based on tier
  deposit: z.number(),
  dateFrom: z.string(),
  dateTo: z.string(),
  days: z.number(),
  quantity: z.number().min(1).default(1),
  totalPrice: z.number(),
});

export type CartItem = z.infer<typeof cartItemSchema>;

// Contact form schema
export const contactFormSchema = z.object({
  customerName: z.string().min(1, "Jméno je povinné"),
  customerEmail: z.string().email("Neplatný email"),
  customerPhone: z.string().min(1, "Telefon je povinný"),
  customerAddress: z.string().min(1, "Adresa je povinná"),
  customerNote: z.string().optional(),
  pickupLocation: z.enum(["brno", "bilovice", "olomouc"], {
    errorMap: () => ({ message: "Vyberte místo výdeje" })
  }),
});

export type ContactForm = z.infer<typeof contactFormSchema>;
