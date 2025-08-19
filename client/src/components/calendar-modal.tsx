import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format, addDays, isBefore, isAfter } from "date-fns";
import { cs } from "date-fns/locale";
import { formatDate, formatPrice, calculateDays, calculateBillableDays, getTieredPrice, calculateTotalPrice } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: (dateFrom: string, dateTo: string, quantity: number) => void;
  onAddToCart: (dateFrom: string, dateTo: string, quantity: number) => void;
  equipmentName?: string;
  equipmentId?: string;
  equipment?: {
    id?: string;
    name?: string;
    dailyPrice?: number;
    price1to3Days?: number;
    price4to7Days?: number;
    price8PlusDays?: number;
    deposit: number;
  };
  initialDateFrom?: string;
  initialDateTo?: string;
  initialQuantity?: number;
}

// Zobrazuje kalendář pro výběr termínu rezervace vybavení
export default function CalendarModal({
  isOpen,
  onClose,
  onConfirm,
  onAddToCart,
  equipmentName,
  equipmentId,
  equipment,
  initialDateFrom,
  initialDateTo,
  initialQuantity = 1,
}: CalendarModalProps) {
  // Stav pro vybraný rozsah dat
  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>(() => {
    if (initialDateFrom && initialDateTo) {
      return {
        from: new Date(initialDateFrom),
        to: new Date(initialDateTo),
      };
    }
    return undefined;
  });
  // Stav pro počet kusů
  const [quantity, setQuantity] = useState(initialQuantity || 1);
  // Blokované dny (rezervované)
  const [unavailableDates, setUnavailableDates] = useState<Date[]>([]);
  // Dostupné kusy pro zvolený termín
  const [availableQuantity, setAvailableQuantity] = useState(0);
  // Maximální možný počet kusů k výběru (podle skutečné dostupnosti)
  const [maxQuantity, setMaxQuantity] = useState(0);
  // Hook pro zobrazování notifikací
  const { toast } = useToast();

  // Načítání rezervací - nyní pouze pro účely zobrazení, ne blokování dat
  const fetchReservationsMutation = useMutation({
    mutationFn: async (equipmentId: string) => {
      const response = await apiRequest(
        "GET",
        `/api/equipment/${equipmentId}/reservations`,
      );
      return response.json();
    },
    onSuccess: (data) => {
      // Neblokuje žádné dny - dostupnost se kontroluje na základě množství
      setUnavailableDates([]);
    },
  });

  //Při otevření modálu se stáhnou rezervace daného vybavení.
  useEffect(() => {
    if (isOpen && equipmentId) {
      fetchReservationsMutation.mutate(equipmentId);
    }
  }, [isOpen, equipmentId]);

  // Funkce pro kontrolu, zda je daný den dostupný - pouze minulé dny jsou nedostupné
  const isDateUnavailable = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return isBefore(date, today) || isDateUnavailable(date);
  };

  // Zpracování výběru termínu z kalendáře
  // Kontroluje, zda jsou vybrané dny dostupné a aktualizuje stav dostupného množství
  const handleDateSelect = (range: DateRange | undefined) => {
    if (!range) {
      setSelectedRange(undefined);
      return;
    }

    // Kontrolujeme pouze minulé dny
    if (range.from && range.to) {
      const start = new Date(range.from);
      const end = new Date(range.to);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        if (isDateUnavailable(d)) {
          toast({
            title: "Nedostupný termín",
            description: "Nelze vybrat minulé dny.",
            variant: "destructive",
          });
          return;
        }
      }
    }

    setSelectedRange(range);

    // Pokud je vybrán celý rozsah, zkontroluje dostupnost
    if (range.from && range.to) {
      checkAvailableQuantity(range.from, range.to);
    }
  };

  const checkAvailableQuantity = async (from: Date, to: Date) => {
    if (!equipmentId) return;

    try {
      const response = await apiRequest(
        "POST",
        `/api/equipment/${equipmentId}/availability`,
        {
          dateFrom: format(from, "yyyy-MM-dd"),
          dateTo: format(to, "yyyy-MM-dd"),
        },
      );

      const result = await response.json();

      setAvailableQuantity(result.availableQuantity || 0);
      setMaxQuantity(result.availableQuantity || 0);

      // Pokud aktuálně zvolený počet překračuje dostupnost, resetuje ho
      if (quantity > (result.availableQuantity || 0)) {
        setQuantity(Math.max(1, Math.min(1, result.availableQuantity || 0)));
      } else if (quantity === 0 && result.availableQuantity > 0) {
        // Pokud je quantity 0 (např. při prvním výběru), nastav na 1
        setQuantity(1);
      }
    } catch (error) {
      setAvailableQuantity(0);
      setMaxQuantity(0);
    }
  };

  // Potvrzení výběru a odeslání dat dál
  const handleConfirm = () => {
    if (!selectedRange || !selectedRange.from || !selectedRange.to) {
      toast({
        title: "Chyba",
        description: "Prosím vyberte termín od a do",
        variant: "destructive",
      });
      return;
    }

    const dateFrom = format(selectedRange.from, "yyyy-MM-dd");
    const dateTo = format(selectedRange.to, "yyyy-MM-dd");

    onConfirm?.(dateFrom, dateTo, quantity);
    setSelectedRange(undefined);
  };

  const handleClose = () => {
    setSelectedRange(undefined);
    setQuantity(1);
    setAvailableQuantity(0);
    setMaxQuantity(0);
    onClose();
  };

  const modifiers = {
    unavailable: unavailableDates,
    today: new Date(),
  };

  // Stylování vybraných typů dní v kalendáři
  const modifiersStyles = {
    unavailable: {
      backgroundColor: "#fecaca",
      color: "#dc2626",
      fontWeight: "bold",
      textDecoration: "line-through",
      border: "2px solid #dc2626",
    },
    today: {
      backgroundColor: "#f3f4f6",
      color: "#6b7280",
      fontWeight: "normal",
      border: "1px solid #d1d5db",
    },
  };

  // Výstupní JSX – co se zobrazí uživateli
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" aria-describedby="calendar-dialog-description">
        <DialogHeader>
          <DialogTitle>Vyberte termín rezervace</DialogTitle>
          {equipmentName ? (
            <p id="calendar-dialog-description" className="text-sm text-muted-foreground">{equipmentName}</p>
          ) : (
            <p id="calendar-dialog-description" className="sr-only">Výběr termínu rezervace vybavení</p>
          )}
        </DialogHeader>

        {/* Legenda barev */}
        <div className="space-y-4">
          <div className="flex flex-col space-y-2">
            
            {/* 
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
              <span className="text-sm text-gray-600">Dostupné dny</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border border-red-300 rounded"></div>
              <span className="text-sm text-gray-600">Rezervované dny</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
              <span className="text-sm text-gray-600">Dnešní den</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded"></div>
              <span className="text-sm text-gray-600">Váš výběr</span>
            </div> */}
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="quantity"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Počet kusů
                {selectedRange?.from && selectedRange?.to && (
                  <span className="text-sm text-blue-600 ml-2">
                    (dostupné: {availableQuantity})
                  </span>
                )}
              </label>
              <select
                id="quantity"
                value={maxQuantity === 0 ? 0 : quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                disabled={maxQuantity === 0}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                {maxQuantity === 0 ? (
                  <option value={0}>Nejdříve vyberte termín</option>
                ) : (
                  Array.from({ length: maxQuantity }, (_, i) => i + 1).map(
                    (num) => (
                      <option key={num} value={num}>
                        {num} {num === 1 ? "kus" : "kusy"}
                      </option>
                    ),
                  )
                )}
              </select>
            </div>

            {/* Kalendář */}
            <Calendar
              mode="range"
              selected={selectedRange}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              modifiers={modifiers}
              modifiersStyles={modifiersStyles}
              locale={cs}
              className="rounded-md border"
              showOutsideDays={false}
            />
          </div>

          {/* Pricing preview when equipment is available */}
          {equipment && !selectedRange?.from && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Ceník</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>1-3 dny:</span>
                  <span className="font-medium">{formatPrice(equipment.price1to3Days || 0)}/den</span>
                </div>
                <div className="flex justify-between">
                  <span>4-7 dnů:</span>
                  <span className="font-medium text-green-600">{formatPrice(equipment.price4to7Days || 0)}/den</span>
                </div>
                <div className="flex justify-between">
                  <span>8+ dnů:</span>
                  <span className="font-medium text-green-700">{formatPrice(equipment.price8PlusDays || 0)}/den</span>
                </div>
                <div className="pt-1 border-t border-gray-300">
                  <div className="flex justify-between">
                    <span>Záloha:</span>
                    <span className="font-medium">{formatPrice(equipment.deposit)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vybraný termín - přehled */}
          {selectedRange?.from && selectedRange?.to && equipment && (
            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
              <p className="text-sm font-medium text-blue-900">
                Vybraný termín:{" "}
                {format(selectedRange.from, "d. MMMM yyyy", { locale: cs })} -{" "}
                {format(selectedRange.to, "d. MMMM yyyy", { locale: cs })}
              </p>
              <p className="text-xs text-blue-700">
                Počet dní:{" "}
                {calculateBillableDays(format(selectedRange.from, "yyyy-MM-dd"), format(selectedRange.to, "yyyy-MM-dd"))} dní
              </p>
              
              {/* Pricing calculation */}
              {(() => {
                const billableDays = calculateBillableDays(format(selectedRange.from, "yyyy-MM-dd"), format(selectedRange.to, "yyyy-MM-dd"));
                const dailyRate = getTieredPrice(billableDays, equipment.price1to3Days || 0, equipment.price4to7Days || 0, equipment.price8PlusDays || 0);
                const rentalPrice = calculateTotalPrice(billableDays, quantity, equipment.price1to3Days || 0, equipment.price4to7Days || 0, equipment.price8PlusDays || 0);
                const totalWithDeposit = rentalPrice + (equipment.deposit * quantity);
                
                return (
                  <div className="bg-white p-2 rounded border border-blue-200">
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span>Půjčovné/den/kus ({billableDays <= 3 ? '1-3 dny' : billableDays <= 7 ? '4-7 dnů' : '8+ dnů'}):</span>
                        <span className="font-medium">{formatPrice(dailyRate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Půjčovné celkem:</span>
                        <span className="font-medium">{formatPrice(rentalPrice)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Záloha ({quantity} × {formatPrice(equipment.deposit)}):</span>
                        <span className="font-medium">{formatPrice(equipment.deposit * quantity)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-green-700 pt-1 border-t">
                        <span>Celkem k platbě:</span>
                        <span>{formatPrice(totalWithDeposit)}</span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* Tlačítka */}
        <DialogFooter className="flex space-x-2">
          <Button variant="outline" onClick={handleClose}>
            Zrušit
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {
                  if (selectedRange?.from && selectedRange?.to && availableQuantity >= quantity) {
                    const dateFrom = format(selectedRange.from, "yyyy-MM-dd");
                    const dateTo = format(selectedRange.to, "yyyy-MM-dd");
                    onAddToCart(dateFrom, dateTo, quantity);
                    onClose();
                  }
                }}
                disabled={!selectedRange?.from || !selectedRange?.to || availableQuantity < quantity || maxQuantity === 0}
                className="bg-teal-500 hover:bg-teal-900 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Přidat do batohu
              </Button>
            </TooltipTrigger>
            {(!selectedRange?.from || !selectedRange?.to) && (
              <TooltipContent>
                <p>Nejdříve vyberte termín</p>
              </TooltipContent>
            )}
            {(selectedRange?.from && selectedRange?.to && (availableQuantity < quantity || maxQuantity === 0)) && (
              <TooltipContent>
                <p>{maxQuantity === 0 ? "Vybavení není v tomto termínu dostupné" : `Dostupné pouze ${availableQuantity} kusů`}</p>
              </TooltipContent>
            )}
          </Tooltip>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
