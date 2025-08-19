import { 
  equipment, 
  reservations, 
  reservationItems,
  type Equipment, 
  type InsertEquipment,
  type UpdateEquipment,
  type Reservation,
  type InsertReservation,
  type ReservationItem,
  type InsertReservationItem
} from "@shared/schema";
import { db } from "./db";
import { eq, asc, desc, and, gte, lte, sql } from "drizzle-orm";
import { generateOrderNumber } from "../shared/utils.js";

export interface IStorage {
  // Equipment methods
  getAllEquipment(): Promise<Equipment[]>;
  getEquipment(id: number): Promise<Equipment | undefined>;
  createEquipment(equipment: InsertEquipment): Promise<Equipment>;
  updateEquipment(id: number, equipment: UpdateEquipment): Promise<Equipment | undefined>;
  deleteEquipment(id: number): Promise<boolean>;
  updateEquipmentOrders(orders: { id: number; sortOrder: number }[]): Promise<void>;
  
  // Reservation methods
  createReservation(reservation: InsertReservation): Promise<Reservation>;
  getReservation(id: number): Promise<Reservation | undefined>;
  getReservationByOrderNumber(orderNumber: string): Promise<Reservation | undefined>;
  getAllReservations(): Promise<Reservation[]>;
  updateReservation(id: number, data: { dateFrom: string; dateTo: string; quantity: number }): Promise<Reservation | undefined>;
  updateReservationStatus(id: number, status: string): Promise<Reservation | undefined>;
  deleteReservation(id: number): Promise<boolean>;
  
  // Reservation items methods
  createReservationItem(item: InsertReservationItem): Promise<ReservationItem>;
  getReservationItems(reservationId: number): Promise<ReservationItem[]>;
  updateReservationItems(reservationId: number, items: Array<{equipmentId: string; quantity: number; dailyPrice: number; deposit: number}>): Promise<void>;
  
  // Availability check
  checkEquipmentAvailability(equipmentId: number, dateFrom: string, dateTo: string): Promise<boolean>;
  getAvailableQuantity(equipmentId: number, dateFrom: string, dateTo: string): Promise<number>;
  getReservationsForEquipment(equipmentId: number): Promise<ReservationItem[]>;
}

export class DatabaseStorage implements IStorage {
  async getAllEquipment(): Promise<Equipment[]> {
    return await db.select().from(equipment).orderBy(asc(equipment.sortOrder), asc(equipment.id));
  }

  async getEquipment(id: number): Promise<Equipment | undefined> {
    const [equipmentItem] = await db.select().from(equipment).where(eq(equipment.id, id));
    return equipmentItem || undefined;
  }

  async createEquipment(equipmentData: InsertEquipment): Promise<Equipment> {
    console.log("🛠️ Equipment payload:", equipmentData);
    const [newEquipment] = await db
      .insert(equipment)
      .values({
      ...equipmentData,
      categories: equipmentData.categories,
    })
    .returning();
  return newEquipment;
}

  async updateEquipment(id: number, equipmentData: UpdateEquipment): Promise<Equipment | undefined> {
    console.log("➡️ Update payload:", equipmentData);
    const [updatedEquipment] = await db
      .update(equipment)
      .set(equipmentData)
      .where(eq(equipment.id, id))
      .returning();
      console.log("Equipment update:", { id, equipmentData });
    return updatedEquipment || undefined;
  }

  async deleteEquipment(id: number): Promise<boolean> {
    const result = await db
      .delete(equipment)
      .where(eq(equipment.id, id));
    return (result.rowCount || 0) > 0;
  }

  async updateEquipmentOrders(orders: { id: number; sortOrder: number }[]): Promise<void> {
    for (const order of orders) {
      await db
        .update(equipment)
        .set({ sortOrder: order.sortOrder })
        .where(eq(equipment.id, order.id));
    }
  }

  async createReservation(reservation: InsertReservation): Promise<Reservation> {
    const orderNumber = generateOrderNumber();
    const [newReservation] = await db
      .insert(reservations)
      .values({
        ...reservation,
        orderNumber,
        status: "čekající",
        customerNote: reservation.customerNote || null,
      })
      .returning();
    return newReservation;
  }

  async getReservation(id: number): Promise<Reservation | undefined> {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, id));
    return reservation || undefined;
  }

  async getReservationByOrderNumber(orderNumber: string): Promise<Reservation | undefined> {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.orderNumber, orderNumber));
    return reservation || undefined;
  }

  async getAllReservations(): Promise<Reservation[]> {
    const allReservations = await db.select().from(reservations).orderBy(desc(reservations.createdAt));
    
    // Get reservation items for each reservation and update status based on dates
    const reservationsWithItems = await Promise.all(
      allReservations.map(async (reservation) => {
        const items = await this.getReservationItems(reservation.id);
        
        // Auto-update status based on dates
        const currentDate = new Date().toISOString().split('T')[0];
        const dateFrom = reservation.dateFrom;
        const dateTo = reservation.dateTo;
        
        let autoStatus = reservation.status;
        if (reservation.status === "čekající" && currentDate >= dateFrom) {
          autoStatus = "vypůjčené";
        } else if ((reservation.status === "čekající" || reservation.status === "vypůjčené") && currentDate > dateTo) {
          autoStatus = "vrácené";
        }
        
        // Update status in database if it changed
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

  async getReservationWithItems(reservationId: number): Promise<{ reservation: Reservation; items: ReservationItem[] } | undefined> {
    const [reservation] = await db.select().from(reservations).where(eq(reservations.id, reservationId));
    if (!reservation) return undefined;
    
    const items = await db.select().from(reservationItems).where(eq(reservationItems.reservationId, reservationId));
    return { reservation, items };
  }

  async updateReservationStatus(id: number, status: "čekající" | "vypůjčené" | "vrácené" | "zrušené"): Promise<Reservation | undefined> {
    const [updatedReservation] = await db
      .update(reservations)
      .set({ status })
      .where(eq(reservations.id, id))
      .returning();
    return updatedReservation || undefined;
  }

  async updateReservation(id: number, data: { dateFrom: string; dateTo: string; quantity: number }): Promise<Reservation | undefined> {
    const [updated] = await db
      .update(reservations)
      .set({
        dateFrom: data.dateFrom,
        dateTo: data.dateTo,
        quantity: data.quantity
      })
      .where(eq(reservations.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteReservation(id: number): Promise<boolean> {
    // First delete related reservation items
    await db.delete(reservationItems).where(eq(reservationItems.reservationId, id));
    
    // Then delete the reservation
    const result = await db
      .delete(reservations)
      .where(eq(reservations.id, id));
    return (result.rowCount || 0) > 0;
  }

  async createReservationItem(item: InsertReservationItem): Promise<ReservationItem> {
    const [newItem] = await db
      .insert(reservationItems)
      .values(item)
      .returning();
    return newItem;
  }

  async getReservationItems(reservationId: number): Promise<ReservationItem[]> {
    return await db.select().from(reservationItems).where(eq(reservationItems.reservationId, reservationId));
  }

  async updateReservationItems(reservationId: number, items: Array<{equipmentId: string; quantity: number; dailyPrice: number; deposit: number}>): Promise<void> {
    // Get the main reservation to get dates
    const reservation = await this.getReservation(reservationId);
    if (!reservation) return;
    
    // First, delete existing reservation items
    await db.delete(reservationItems).where(eq(reservationItems.reservationId, reservationId));
    
    // Calculate days
    const dateFrom = new Date(reservation.dateFrom);
    const dateTo = new Date(reservation.dateTo);
    const days = Math.max(1, Math.ceil((dateTo.getTime() - dateFrom.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Then create new ones with updated prices
    for (const item of items) {
      const totalPrice = item.dailyPrice * days * item.quantity + item.deposit;
      await this.createReservationItem({
        reservationId,
        equipmentId: parseInt(item.equipmentId),
        dateFrom: reservation.dateFrom,
        dateTo: reservation.dateTo,
        days: days,
        quantity: item.quantity,
        dailyPrice: item.dailyPrice,
        totalPrice: totalPrice,
        deposit: item.deposit
      });
    }
  }

  async checkEquipmentAvailability(equipmentId: number, dateFrom: string, dateTo: string): Promise<boolean> {
    const availableQuantity = await this.getAvailableQuantity(equipmentId, dateFrom, dateTo);
    return availableQuantity > 0;
  }

  async getAvailableQuantity(equipmentId: number, dateFrom: string, dateTo: string): Promise<number> {
    const equipmentItem = await this.getEquipment(equipmentId);
    if (!equipmentItem) return 0;

    const existingReservations = await this.getReservationsForEquipment(equipmentId);
    
    // Check how many items are reserved for the requested period
    const overlappingReservations = existingReservations.filter(reservation => {
      const resFrom = new Date(reservation.dateFrom);
      const resTo = new Date(reservation.dateTo);
      const reqFrom = new Date(dateFrom);
      const reqTo = new Date(dateTo);
      
      // Check if dates overlap - dates overlap if start1 <= end2 && start2 <= end1
      return reqFrom <= resTo && resFrom <= reqTo;
    });

    // Calculate total reserved quantity for overlapping period
    const reservedQuantity = overlappingReservations.reduce((sum, reservation) => {
      return sum + (reservation.quantity || 1);
    }, 0);
    
    const availableQuantity = Math.max(0, equipmentItem.stock - reservedQuantity);
    
    return availableQuantity;
  }

  async getReservationsForEquipment(equipmentId: number): Promise<ReservationItem[]> {
    return await db.select().from(reservationItems).where(eq(reservationItems.equipmentId, equipmentId));
  }
}

export const storage = new DatabaseStorage();