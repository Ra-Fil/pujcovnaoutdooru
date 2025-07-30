export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('cs-CZ');
}

export function calculateDays(dateFrom: string, dateTo: string): number {
  const start = new Date(dateFrom);
  const end = new Date(dateTo);
  const diffTime = Math.abs(end.getTime() - start.getTime());
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
  return `${price} Kc`;
}

let orderCounter = 1;

// Initialize counter based on existing orders
export function initializeOrderCounter(existingOrders: string[]) {
  const currentYear = new Date().getFullYear();
  const yearPrefix = `P${currentYear}`;
  
  const currentYearOrders = existingOrders
    .filter(order => order.startsWith(yearPrefix))
    .map(order => parseInt(order.replace(yearPrefix, '')) || 0)
    .filter(num => !isNaN(num));
  
  if (currentYearOrders.length > 0) {
    orderCounter = Math.max(...currentYearOrders) + 1;
  }
}

export function generateOrderNumber(): string {
  const year = new Date().getFullYear();
  const number = orderCounter.toString().padStart(3, '0');
  orderCounter++;
  return `P${year}${number}`;
}