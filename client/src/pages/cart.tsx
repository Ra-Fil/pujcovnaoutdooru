import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Trash2, ShoppingCart, ArrowLeft, Plus, Minus, Calendar, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ConfirmationModal from "@/components/confirmation-modal";
import CalendarModal from "@/components/calendar-modal";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { apiRequest } from "@/lib/queryClient";
import {
  formatDate,
  formatPrice,
  calculateDays,
  calculateBillableDays,
} from "@/lib/utils";
import { contactFormSchema } from "@shared/schema";
import type { CartItem, ContactForm } from "@shared/schema";
import { z } from "zod";

export default function Cart() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  const [editingDates, setEditingDates] = useState<{
    isOpen: boolean;
    item: CartItem | null;
    equipment: any;
  }>({
    isOpen: false,
    item: null,
    equipment: null,
  });

  // Load cart items from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("cartItems");
    if (saved) {
      setCartItems(JSON.parse(saved));
    }
  }, []);

  // Note: localStorage is now updated explicitly in removeItem and updateQuantity functions
  const form = useForm<ContactForm & { agreeToTerms: boolean }>({
    resolver: zodResolver(
      contactFormSchema.extend({
        agreeToTerms: z.boolean().refine((val) => val === true, {
          message: "Musíte souhlasit s obchodními podmínkami",
        }),
      }),
    ),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      customerNote: "",
      pickupLocation: "brno",
      agreeToTerms: false,
    },
  });

  const createReservationMutation = useMutation({
    mutationFn: async (data: ContactForm & { cartItems: CartItem[] }) => {
      const response = await fetch("/api/reservations", {
        method: "POST",
        body: JSON.stringify(data),
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Chyba při vytváření rezervace");
      }

      return response.json();
    },
    onSuccess: (response) => {
      setOrderNumber(response.reservation.orderNumber);
      setQrCodeUrl(response.qrCodeUrl);
      setIsConfirmationOpen(true);
      setCartItems([]);
      localStorage.removeItem("cartItems");
      toast({
        title: "Rezervace vytvořena",
        description: "Vaše objednávka byla úspěšně vytvořena.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description:
          error.message || "Něco se pokazilo při vytváření rezervace.",
        variant: "destructive",
      });
    },
  });

  const removeItem = (itemId: string, dateFrom: string, dateTo: string) => {
    const updatedItems = cartItems.filter(
      (item) =>
        !(
          item.id === itemId &&
          item.dateFrom === dateFrom &&
          item.dateTo === dateTo
        ),
    );

    setCartItems(updatedItems);
    // Explicitně uložíme do localStorage
    localStorage.setItem("cartItems", JSON.stringify(updatedItems));

    toast({
      title: "Položka odstraněna",
      description: "Položka byla odebrána z košíku.",
    });
  };

  const updateQuantity = async (
    itemId: string,
    dateFrom: string,
    dateTo: string,
    newQuantity: number,
  ) => {
    if (newQuantity < 1) return;

    try {
      // Zkontroluj dostupné množství
      const response = await fetch(`/api/equipment/${itemId}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateFrom, dateTo }),
      });

      if (!response.ok) {
        toast({
          title: "Chyba",
          description: "Nepodařilo se ověřit dostupnost",
          variant: "destructive",
        });
        return;
      }

      const { availableQuantity } = await response.json();

      if (newQuantity > availableQuantity) {
        toast({
          title: "Nedostatek kusů",
          description: `K dispozici je pouze ${availableQuantity} kusů pro vybraný termín`,
          variant: "destructive",
        });
        return;
      }

      const updatedItems = cartItems.map((item) => {
        if (
          item.id === itemId &&
          item.dateFrom === dateFrom &&
          item.dateTo === dateTo
        ) {
          const billableDays = calculateBillableDays(
            item.dateFrom,
            item.dateTo,
          );
          const newTotalPrice =
            item.dailyPrice * billableDays * newQuantity + item.deposit;
          return {
            ...item,
            quantity: newQuantity,
            days: billableDays,
            totalPrice: newTotalPrice,
          };
        }
        return item;
      });

      setCartItems(updatedItems);
      localStorage.setItem("cartItems", JSON.stringify(updatedItems));
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se aktualizovat množství",
        variant: "destructive",
      });
    }
  };

  const openDateEditor = (item: CartItem) => {
    // Create a mock equipment object for the calendar modal
    const equipment = {
      id: item.id,
      name: item.name,
      description: "",
      dailyPrice: item.dailyPrice,
      price1to3Days: item.dailyPrice,
      price4to7Days: item.dailyPrice,
      price8PlusDays: item.dailyPrice,
      deposit: item.deposit,
      stock: item.quantity,
      imageUrl: "",
      categories: [],
    };

    setEditingDates({
      isOpen: true,
      item,
      equipment,
    });
  };

  const updateItemDates = async (
    originalItem: CartItem,
    newDateFrom: string,
    newDateTo: string,
    quantity: number,
  ) => {
    try {
      // Check availability for new dates
      const response = await fetch(`/api/equipment/${originalItem.id}/availability`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateFrom: newDateFrom, dateTo: newDateTo }),
      });

      if (!response.ok) {
        toast({
          title: "Chyba",
          description: "Nepodařilo se ověřit dostupnost",
          variant: "destructive",
        });
        return;
      }

      const { availableQuantity } = await response.json();

      if (quantity > availableQuantity) {
        toast({
          title: "Nedostatek kusů",
          description: `K dispozici je pouze ${availableQuantity} kusů pro vybraný termín`,
          variant: "destructive",
        });
        return;
      }

      // Update the cart item with new dates
      const updatedItems = cartItems.map((item) => {
        if (
          item.id === originalItem.id &&
          item.dateFrom === originalItem.dateFrom &&
          item.dateTo === originalItem.dateTo
        ) {
          const billableDays = calculateBillableDays(newDateFrom, newDateTo);
          const newTotalPrice = item.dailyPrice * billableDays * quantity + item.deposit;
          
          return {
            ...item,
            dateFrom: newDateFrom,
            dateTo: newDateTo,
            quantity,
            days: billableDays,
            totalPrice: newTotalPrice,
          };
        }
        return item;
      });

      setCartItems(updatedItems);
      localStorage.setItem("cartItems", JSON.stringify(updatedItems));
      
      setEditingDates({ isOpen: false, item: null, equipment: null });
      
      toast({
        title: "Termín aktualizován",
        description: "Termín půjčení byl úspěšně změněn.",
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se aktualizovat termín",
        variant: "destructive",
      });
    }
  };

  const onSubmit = (data: ContactForm & { agreeToTerms: boolean }) => {
    if (cartItems.length === 0) {
      toast({
        title: "Prázdný košík",
        description: "Přidejte alespoň jednu položku do košíku.",
        variant: "destructive",
      });
      return;
    }

    // Extrakce agreeToTerms a předání pouze ContactForm dat do API
    const { agreeToTerms, ...contactData } = data;
    const orderData = {
      ...contactData,
      cartItems,
    };

    createReservationMutation.mutate(orderData);
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalDeposit = cartItems.reduce(
    (sum, item) => sum + item.deposit * item.quantity,
    0,
  );
  const totalRental = cartItems.reduce(
    (sum, item) => sum + item.dailyPrice * item.days * item.quantity,
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header cartItemCount={cartItems.length} />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Zpět na výběr vybavení
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Košík */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Váš košík ({cartItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cartItems.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Váš košík je prázdný</p>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/vybaveni")}
                    className="mt-4"
                  >
                    Přidat vybavení
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {cartItems.map((item, index) => (
                    <div
                      key={`cart-item-${index}-${item.id}-${item.dateFrom}-${item.dateTo}`}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            removeItem(item.id, item.dateFrom, item.dateTo)
                          }
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="text-sm text-gray-600 space-y-2">
                        <div className="flex items-center justify-between">
                          <p>
                            Termín: {formatDate(item.dateFrom)} -{" "}
                            {formatDate(item.dateTo)}
                          </p>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDateEditor(item)}
                            className="text-blue-600 hover:text-blue-800 h-6 px-2"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Upravit
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500">
                          <div>
                            Počet dnů půjčení:{" "}
                            {calculateDays(item.dateFrom, item.dateTo)}
                          </div>
                          <div>
                            Cena za den: {formatPrice(item.dailyPrice)}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 mt-2">
                          <span>Množství:</span>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.dateFrom,
                                  item.dateTo,
                                  item.quantity - 1,
                                )
                              }
                              disabled={item.quantity <= 1}
                              className="h-8 w-8 p-0"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>

                            <Input
                              type="number"
                              min="1"
                              max="10"
                              value={item.quantity}
                              onChange={(e) => {
                                const newQuantity =
                                  parseInt(e.target.value) || 1;
                                updateQuantity(
                                  item.id,
                                  item.dateFrom,
                                  item.dateTo,
                                  newQuantity,
                                );
                              }}
                              className="w-16 h-8 text-center"
                            />

                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                updateQuantity(
                                  item.id,
                                  item.dateFrom,
                                  item.dateTo,
                                  item.quantity + 1,
                                )
                              }
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>

                            <span className="text-xs">ks</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2 pt-2 border-t space-y-1">
                        <div className="flex justify-between">
                          <span>Půjčové:</span>
                          <span>
                            {formatPrice(
                              item.dailyPrice * item.days * item.quantity,
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Vratná záloha:</span>
                          <span>
                            {formatPrice(item.deposit * item.quantity)}
                          </span>
                        </div>
                        <div className="flex justify-between font-semibold pt-1 border-t">
                          <span>Celková cena:</span>
                          <span>{formatPrice(item.totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Půjčové celkem:</span>
                      <span>{formatPrice(totalRental)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Vratná záloha:</span>
                      <span>{formatPrice(totalDeposit)}</span>
                    </div>
                    <div className="flex justify-between items-center font-semibold text-lg pt-2 border-t">
                      <span>Celková cena:</span>
                      <span>{formatPrice(totalPrice)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Formulář objednávky */}
          <Card>
            <CardHeader>
              <CardTitle>Dokončit objednávku</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jméno a příjmení *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Honza Dobrodružný" 
                            className="placeholder:text-gray-300"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>E-mail *</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="honza@chcejetnahory.com"
                            className="placeholder:text-gray-300"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Telefon *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="+420 123 456 789" 
                            className="placeholder:text-gray-300"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Adresa *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Kdebydlis 123, Praha"
                            className="placeholder:text-gray-300"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pickupLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Místo vyzvednutí *</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Vyberte místo vyzvednutí" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="brno">Brno</SelectItem>
                            <SelectItem value="bilovice">
                              Bílovice nad Svitavou
                            </SelectItem>
                            <SelectItem value="olomouc">Olomouc</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerNote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poznámky</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Napiš mi, kdy a kde by se Ti hodilo předání vybavení nebo další požadavky k objednávce..."
                            className="resize-none placeholder:text-gray-300"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="agreeToTerms"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 p-4 border rounded-lg bg-gray-50">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            className={`w-5 h-5 ${
                              field.value
                                ? "border-green-600 bg-green-600 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                : "border-gray-400 hover:border-green-500"
                            }`}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-medium cursor-pointer">
                            Odesláním objednávky souhlasím s{" "}
                            <Link
                              href="/obchodni-podminky"
                              className="text-green-600 hover:text-green-800 underline"
                            >
                              obchodními podmínkami
                            </Link>
                            .
                          </FormLabel>
                          <FormMessage />
                        </div>
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-teal-500 hover:bg-teal-900 text-white"
                    disabled={
                      createReservationMutation.isPending ||
                      cartItems.length === 0 ||
                      !form.watch("agreeToTerms")
                    }
                  >
                    {createReservationMutation.isPending
                      ? "Zpracovávám..."
                      : "Dokončit objednávku"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => {
          setIsConfirmationOpen(false);
          setLocation("/");
        }}
        orderNumber={orderNumber}
        qrCodeUrl={qrCodeUrl}
      />

      {editingDates.isOpen && editingDates.item && editingDates.equipment && (
        <CalendarModal
          isOpen={editingDates.isOpen}
          onClose={() => setEditingDates({ isOpen: false, item: null, 
            equipment: null })}
            equipmentId={editingDates.item.id}
            equipmentName={editingDates.item.name}
            equipment={editingDates.equipment}
          
          onAddToCart={(dateFrom: string, dateTo: string, quantity: number) => {
            updateItemDates(editingDates.item!, dateFrom, dateTo, quantity);
          }}
          initialDateFrom={editingDates.item.dateFrom}
          initialDateTo={editingDates.item.dateTo}
          initialQuantity={editingDates.item.quantity}
        />
      )}

      <Footer />
    </div>
  );
}
