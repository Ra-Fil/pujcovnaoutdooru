import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { ChevronDown, Filter, ArrowUp } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import EquipmentCard from "@/components/equipment-card";
import CartModal from "@/components/cart-modal";
import CalendarModal from "@/components/calendar-modal";
import ConfirmationModal from "@/components/confirmation-modal";
import SEOHead, { SEOConfigs } from "@/components/seo-head";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { calculateDays, calculateBillableDays, getTieredPrice, calculateTotalPrice } from "@/lib/utils";
import type { Equipment, CartItem, ContactForm } from "@shared/schema";

export default function Equipment() {
  const [, setLocation] = useLocation();
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    // Load cart items from localStorage
    const saved = localStorage.getItem("cartItems");
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedDates, setSelectedDates] = useState<
    Record<string, { from: string; to: string; quantity?: number }>
  >({});
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [currentEquipmentId, setCurrentEquipmentId] = useState<string>("");
  const [orderNumber, setOrderNumber] = useState("");
  const [qrCodeUrl, setQrCodeUrl] = useState<string>();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isCategoriesOpen, setIsCategoriesOpen] = useState(false);
  const [showScrollToTop, setShowScrollToTop] = useState(false);

  const { toast } = useToast();

  const handleCartClick = () => {
    setLocation("/cart");
  };

  // Fetch equipment
  const { data: equipment = [], isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  // Filter equipment by category
  const filteredEquipment = equipment.filter((item) => {
    if (selectedCategory === "all") return true;
    return item.categories && item.categories.includes(selectedCategory);
  });

  // Get current equipment for calendar modal
  const currentEquipment = equipment.find((e) => e.id.toString() === currentEquipmentId);

  // Track scroll position for back-to-top button
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollToTop(window.scrollY > 400);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll to top function
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Handle category change and scroll to top
  const handleCategoryChange = (categoryKey: string) => {
    // Update category
    setSelectedCategory(categoryKey);
    
    // Scroll to top of page smoothly
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  // Define categories
  const categories = [
    { key: "all", label: "Vše" },
    { key: "ferraty", label: "Via Ferrata" },
    { key: "kids", label: "Pro děti" },
    { key: "camping", label: "Kempování" },
    { key: "climbing", label: "Lezení" },
    { key: "winter", label: "Zimní vybavení" },
    { key: "voda", label: "Vodní sporty" },
  ];

  // Check availability mutation
  const availabilityMutation = useMutation({
    mutationFn: async ({
      equipmentId,
      dateFrom,
      dateTo,
    }: {
      equipmentId: string;
      dateFrom: string;
      dateTo: string;
    }) => {
      const response = await apiRequest(
        "POST",
        `/api/equipment/${equipmentId}/availability`,
        {
          dateFrom,
          dateTo,
        },
      );
      return response.json();
    },
  });

  // Create reservation mutation
  const createReservationMutation = useMutation({
    mutationFn: async (data: ContactForm & { cartItems: CartItem[] }) => {
      const response = await apiRequest("POST", "/api/reservations", data);
      return response.json();
    },
    onSuccess: (data) => {
      setOrderNumber(data.reservation.orderNumber);
      setQrCodeUrl(data.qrCode);
      setIsCartOpen(false);
      setIsConfirmationOpen(true);
      setCartItems([]);
      setSelectedDates({});

      toast({
        title: "Úspěch",
        description: "Rezervace byla úspěšně vytvořena!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se vytvořit rezervaci",
        variant: "destructive",
      });
    },
  });

  const handleSelectDates = (equipmentId: string) => {
    setCurrentEquipmentId(equipmentId);
    setIsCalendarOpen(true);
  };

  const handleConfirmDates = async (
    dateFrom: string,
    dateTo: string,
    quantity: number,
  ) => {
    try {
      const result = await availabilityMutation.mutateAsync({
        equipmentId: currentEquipmentId,
        dateFrom,
        dateTo,
      });

      if (result.available) {
        setSelectedDates((prev) => ({
          ...prev,
          [currentEquipmentId]: { from: dateFrom, to: dateTo, quantity },
        }));
        setIsCalendarOpen(false);
        toast({
          title: "Úspěch",
          description: "Termín byl vybrán úspěšně!",
        });
      } else {
        toast({
          title: "Nedostupné",
          description: "Vybavení není ve vybraném termínu dostupné",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se ověřit dostupnost",
        variant: "destructive",
      });
    }
  };

  const handleAddToCart = (equipmentId: string) => {
    const equipmentItem = equipment.find((e) => e.id === parseInt(equipmentId));
    const dates = selectedDates[equipmentId];

    if (!equipmentItem) {
      toast({
        title: "Chyba",
        description: "Vybavení nebylo nalezeno",
        variant: "destructive",
      });
      return;
    }

    if (!dates) {
      toast({
        title: "Chyba",
        description: "Nejdříve vyberte termín rezervace",
        variant: "destructive",
      });
      return;
    }

    const days = calculateDays(dates.from, dates.to);
    const billableDays = calculateBillableDays(dates.from, dates.to);
    const quantity = dates.quantity || 1;
    
    // Check if adding this quantity would exceed available stock
    const currentCartQuantity = cartItems
      .filter(item => item.id === equipmentId.toString())
      .reduce((total, item) => total + item.quantity, 0);
    
    if (currentCartQuantity + quantity > equipmentItem.stock) {
      toast({
        title: "Nedostatek skladových zásob",
        description: `Nelze přidat ${quantity} ks. V košíku už máte ${currentCartQuantity} ks, skladem pouze ${equipmentItem.stock} ks.`,
        variant: "destructive",
      });
      return;
    }
    
    // Calculate tiered price based on rental duration
    const dailyRate = getTieredPrice(billableDays, equipmentItem.price1to3Days, equipmentItem.price4to7Days, equipmentItem.price8PlusDays);
    const rentalPrice = calculateTotalPrice(billableDays, quantity, equipmentItem.price1to3Days, equipmentItem.price4to7Days, equipmentItem.price8PlusDays);
    const totalPrice = rentalPrice + (equipmentItem.deposit * quantity);

    const cartItem: CartItem = {
      id: equipmentId.toString(),
      name: equipmentItem.name,
      dailyPrice: dailyRate, // Use the tiered daily rate
      deposit: equipmentItem.deposit,
      dateFrom: dates.from,
      dateTo: dates.to,
      days: billableDays,
      quantity,
      totalPrice,
    };

    const updatedCartItems = [...cartItems, cartItem];
    setCartItems(updatedCartItems);
    localStorage.setItem("cartItems", JSON.stringify(updatedCartItems));

    // Remove selected dates for this item
    setSelectedDates((prev) => {
      const newDates = { ...prev };
      delete newDates[equipmentId];
      return newDates;
    });

    toast({
      title: "Přidáno do košíku",
      description: `${equipmentItem.name} byl přidán do košíku`,
    });
  };

  const handleRemoveFromCart = (itemId: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const handleSubmitReservation = (
    data: ContactForm & { cartItems: CartItem[] },
  ) => {
    createReservationMutation.mutate(data);
  };

  return (
    <div className="min-h-screen bg-neutral-light">
      <SEOHead {...SEOConfigs.equipment} />
      <Header cartItemCount={cartItems.length} onCartClick={handleCartClick} />

      {/* Equipment Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-neutral-dark text-center mb-8">
            Vybavení k zapůjčení
          </h1>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Mobile Category Button */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                className="w-full flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3 text-left font-medium text-gray-900 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Kategorie: {categories.find(c => c.key === selectedCategory)?.label}</span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isCategoriesOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {/* Mobile Categories Dropdown */}
              {isCategoriesOpen && (
                <div className="mt-2 bg-white rounded-lg border border-gray-200 shadow-lg">
                  <div className="p-2 space-y-1">
                    {categories.map((category) => (
                      <button
                        key={category.key}
                        onClick={() => {
                          handleCategoryChange(category.key);
                          setIsCategoriesOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          selectedCategory === category.key
                            ? "bg-teal-500 text-white shadow-lg"
                            : "bg-gray-50 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {category.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Left Sidebar - Categories (Desktop Only) */}
            <div className="hidden lg:block lg:w-64 flex-shrink-0">
              <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Kategorie</h3>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.key}
                      onClick={() => handleCategoryChange(category.key)}
                      className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        selectedCategory === category.key
                          ? "bg-teal-500 text-white shadow-lg"
                          : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Content - Equipment Grid */}
            <div className="flex-1">

              {isLoading ? (
                <div className="space-y-4">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="bg-gray-200 animate-pulse rounded-xl h-48 w-full"
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredEquipment.map((item) => (
                    <EquipmentCard
                      key={item.id}
                      equipment={item}
                      onSelectDates={handleSelectDates}
                    />
                  ))}
                </div>
              )}

              {!isLoading && filteredEquipment.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">
                    Žádné vybavení v této kategorii není k dispozici.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Modals */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onRemoveItem={handleRemoveFromCart}
        onSubmitReservation={handleSubmitReservation}
        isSubmitting={createReservationMutation.isPending}
      />

      <CalendarModal
        isOpen={isCalendarOpen}
        onClose={() => setIsCalendarOpen(false)}
        onConfirm={handleConfirmDates}
        onAddToCart={async (dateFrom, dateTo, quantity) => {
          const equipmentItem = equipment.find(
            (e) => e.id.toString() === currentEquipmentId,
          );
          if (!equipmentItem) return;

          try {
            // Check real-time availability for selected dates
            const availabilityResponse = await fetch(`/api/equipment/${currentEquipmentId}/availability`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ dateFrom, dateTo }),
            });

            if (!availabilityResponse.ok) {
              toast({
                title: "Chyba",
                description: "Nepodařilo se ověřit dostupnost",
                variant: "destructive",
              });
              return;
            }

            const { available, availableQuantity } = await availabilityResponse.json();

            if (!available || availableQuantity < quantity) {
              toast({
                title: "Nedostupné",
                description: `Vybavení není ve vybraném termínu dostupné. Dostupné pouze ${availableQuantity} kusů.`,
                variant: "destructive",
              });
              return;
            }

            // Check if adding this quantity would exceed available stock
            const currentCartQuantity = cartItems
              .filter(item => item.id === currentEquipmentId.toString())
              .reduce((total, item) => total + item.quantity, 0);
            
            if (currentCartQuantity + quantity > equipmentItem.stock) {
              toast({
                title: "Nedostatek skladových zásob",
                description: `Nelze přidat ${quantity} ks. V košíku už máte ${currentCartQuantity} ks, skladem pouze ${equipmentItem.stock} ks.`,
                variant: "destructive",
              });
              return;
            }

            const days = calculateDays(dateFrom, dateTo);
            const billableDays = calculateBillableDays(dateFrom, dateTo);
            
            // Calculate tiered price based on rental duration
            const dailyRate = getTieredPrice(billableDays, equipmentItem.price1to3Days, equipmentItem.price4to7Days, equipmentItem.price8PlusDays);
            const rentalPrice = calculateTotalPrice(billableDays, quantity, equipmentItem.price1to3Days, equipmentItem.price4to7Days, equipmentItem.price8PlusDays);
            const totalPrice = rentalPrice + (equipmentItem.deposit * quantity);

            const cartItem: CartItem = {
              id: currentEquipmentId.toString(),
              name: equipmentItem.name,
              dailyPrice: dailyRate, // Use the tiered daily rate
              deposit: equipmentItem.deposit,
              dateFrom,
              dateTo,
              days: billableDays,
              quantity,
              totalPrice,
            };

            const updatedCartItems = [...cartItems, cartItem];
            setCartItems(updatedCartItems);
            localStorage.setItem("cartItems", JSON.stringify(updatedCartItems));

            toast({
              title: "Přidáno do batohu",
              description: `${equipmentItem.name} byl přidán do vašeho batohu`,
            });
          } catch (error) {
            toast({
              title: "Chyba",
              description: "Nepodařilo se přidat položku do košíku",
              variant: "destructive",
            });
          }
        }}
        equipmentName={currentEquipment?.name}
        equipmentId={currentEquipmentId}
        equipment={currentEquipment ? {
          price1to3Days: currentEquipment.price1to3Days,
          price4to7Days: currentEquipment.price4to7Days,
          price8PlusDays: currentEquipment.price8PlusDays,
          deposit: currentEquipment.deposit,
        } : undefined}
      />

      <ConfirmationModal
        isOpen={isConfirmationOpen}
        onClose={() => setIsConfirmationOpen(false)}
        orderNumber={orderNumber}
        qrCodeUrl={qrCodeUrl}
      />

      {/* Scroll to Top Button */}
      {showScrollToTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 bg-teal-500 hover:bg-teal-600 text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 hover:scale-110"
          aria-label="Zpět nahoru"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      <Footer />
    </div>
  );
}
