import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('cs-CZ');
}

export function calculateDays(dateFrom: string, dateTo: string): number {
  const from = new Date(dateFrom);
  const to = new Date(dateTo);
  const diffTime = Math.abs(to.getTime() - from.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
}

export function calculateBillableDays(dateFrom: string, dateTo: string): number {
  const days = calculateDays(dateFrom, dateTo);
  // New pricing: charge for all days (no free first day)
  return days;
}

export function getTieredPrice(days: number, price1to3Days: number, price4to7Days: number, price8PlusDays: number): number {
  if (days <= 3) {
    return price1to3Days;
  } else if (days <= 7) {
    return price4to7Days;
  } else {
    return price8PlusDays;
  }
}

export function calculateTotalPrice(days: number, quantity: number, price1to3Days: number, price4to7Days: number, price8PlusDays: number): number {
  const dailyRate = getTieredPrice(days, price1to3Days, price4to7Days, price8PlusDays);
  return dailyRate * quantity * days;
}

export function formatPrice(price: number): string {
  return `${price.toLocaleString('cs-CZ')} Kč`;
}

// Order number generation moved to shared utils to maintain consistency
