import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Trash2, ShoppingCart } from "lucide-react";
import { formatPrice, formatDate, calculateDays, calculateBillableDays } from "@/lib/utils";
import { contactFormSchema, type CartItem, type ContactForm } from "@shared/schema";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onRemoveItem: (itemId: string) => void;
  onSubmitReservation: (data: ContactForm & { cartItems: CartItem[] }) => void;
  isSubmitting: boolean;
}

export default function CartModal({
  isOpen,
  onClose,
  cartItems,
  onRemoveItem,
  onSubmitReservation,
  isSubmitting,
}: CartModalProps) {
  const form = useForm<ContactForm>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      customerAddress: "",
      customerNote: "",
      pickupLocation: undefined,
    },
  });

  const totalPrice = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);
  const totalDeposit = cartItems.reduce((sum, item) => sum + (item.deposit * item.quantity), 0);

  const onSubmit = (data: ContactForm) => {
    onSubmitReservation({ ...data, cartItems });
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShoppingCart className="mr-2 h-5 w-5" />
            Košík
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {cartItems.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-500">Váš košík je prázdný</p>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={`${item.id}-${item.dateFrom}`} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold">{item.name}</h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {formatDate(item.dateFrom)} - {formatDate(item.dateTo)}
                    </p>
                    <div className="text-xs text-gray-500 mb-2">
                      <div>Počet dnů půjčení: {calculateDays(item.dateFrom, item.dateTo)}</div>
                      <div>Počet dnů k platbě: {calculateBillableDays(item.dateFrom, item.dateTo)}</div>
                    </div>
                    <p className="text-sm text-blue-600 font-medium mb-2">
                      Počet kusů: {item.quantity}
                    </p>
                    <div className="flex justify-between text-sm">
                      <span>Cena: {formatPrice(item.totalPrice)}</span>
                      <span>Záloha: {formatPrice(item.deposit * item.quantity)}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Cena za půjčení:</span>
                  <span>{formatPrice(totalPrice)}</span>
                </div>
                <div className="flex justify-between items-center text-sm text-gray-600">
                  <span>Vratná záloha:</span>
                  <span>{formatPrice(totalDeposit)}</span>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                    <span>Celková cena k platbě:</span>
                    <span className="text-green-600">{formatPrice(totalPrice + totalDeposit)}</span>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="pickupLocation"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Místo výdeje</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col space-y-2"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="brno" id="brno" />
                              <Label htmlFor="brno">Brno</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="olomouc" id="olomouc" />
                              <Label htmlFor="olomouc">Olomouc</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Jméno a příjmení *</FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel>Email *</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} />
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
                          <Input type="tel" {...field} />
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
                          <Input {...field} placeholder="Ulice a číslo popisné, město, PSČ" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="customerNote"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Poznámka</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Případné poznámky k rezervaci..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="w-full bg-teal-500 hover:bg-teal-900 text-white"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Odesílám..." : "Odeslat rezervaci"}
                  </Button>
                </form>
              </Form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
