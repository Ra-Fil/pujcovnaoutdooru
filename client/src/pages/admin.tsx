import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Package, Users, Plus, Edit2, Trash2, ChevronUp, ChevronDown, Save, X, BarChart3, UserCheck, FileText, Settings, Download, Mail, TrendingUp, DollarSign, Eye, Edit, AlertCircle, Upload, Image as ImageIcon, FileDown, LogOut } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/header";
import Footer from "@/components/footer";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate, formatPrice, calculateBillableDays } from "@/lib/utils";
import { insertEquipmentSchema, updateEquipmentSchema } from "@shared/schema";
import type { Equipment, Reservation, ReservationItem, InsertEquipment, UpdateEquipment, CartItem } from "@shared/schema";

function OrdersList() {
  const { data: reservations = [], isLoading: reservationsLoading } = useQuery<any[]>({
    queryKey: ["/api/reservations"],
  });
  
  const [editingReservation, setEditingReservation] = useState<any | null>(null);
  const [editFormData, setEditFormData] = useState({ 
    dateFrom: "", 
    dateTo: "", 
    quantity: 1,
    equipmentId: "",
    items: [] as Array<{ equipmentId: string; quantity: number; name: string; dailyPrice: number; deposit: number }>
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("všechny");
  const [sortBy, setSortBy] = useState<string>("newest");
  const { toast } = useToast();

  // Filtrace a třídění objednávek
  const filteredAndSortedReservations = useMemo(() => {
    let filtered = reservations.filter((reservation: any) => {
      // Filtr podle hledání
      const searchMatch = searchTerm === "" || 
        reservation.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.customerPhone.includes(searchTerm);

      // Filtr podle statusu
      const statusMatch = statusFilter === "všechny" || reservation.status === statusFilter;

      return searchMatch && statusMatch;
    });

    // Třídění
    filtered.sort((a: any, b: any) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case "oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "price-high":
          return b.totalPrice - a.totalPrice;
        case "price-low":
          return a.totalPrice - b.totalPrice;
        case "date-from":
          return new Date(a.dateFrom).getTime() - new Date(b.dateFrom).getTime();
        case "customer":
          return a.customerName.localeCompare(b.customerName);
        default:
          return 0;
      }
    });

    return filtered;
  }, [reservations, searchTerm, statusFilter, sortBy]);

  // Status color functions
  const getStatusColor = (status: string) => {
    switch (status) {
      case "čekající":
        return "text-yellow-700 bg-yellow-100";
      case "vypůjčené":
        return "text-blue-700 bg-blue-100";
      case "vrácené":
        return "text-green-700 bg-green-100";
      case "zrušené":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  // Calculate billable days function - charging for (days - 1)
  const calculateDays = (dateFrom: string, dateTo: string): number => {
    if (!dateFrom || !dateTo) return 1;
    return calculateBillableDays(dateFrom, dateTo);
  };

  // Invoice generation function
  const handleGenerateInvoice = async (reservationId: number) => {
    try {
      const response = await fetch(`/api/reservations/${reservationId}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to generate invoice: ${response.status}`);
      }

      // Get the filename from response headers
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `smlouva-${reservationId}.pdf`;

      // Create blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Úspěch",
        description: "Výpůjční smlouva byla vygenerována a stažena",
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: `Nepodařilo se vygenerovat výpůjční smlouvu: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Fetch equipment for dropdown
  const { data: equipment = [] } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  // Update reservation mutation
  const updateReservationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { dateFrom: string; dateTo: string; quantity: number } }) => {
      const response = await apiRequest("PUT", `/api/reservations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      setEditingReservation(null);
      toast({
        title: "Úspěch",
        description: "Objednávka byla úspěšně upravena",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se upravit objednávku",
        variant: "destructive",
      });
    },
  });

  // Delete reservation mutation
  const deleteReservationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/reservations/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({
        title: "Úspěch",
        description: "Objednávka byla úspěšně smazána",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se smazat objednávku",
        variant: "destructive",
      });
    },
  });

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/reservations/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({
        title: "Úspěch",
        description: "Status objednávky byl úspěšně změněn",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se změnit status objednávky",
        variant: "destructive",
      });
    },
  });

  // Update reservation items mutation
  const updateReservationItemsMutation = useMutation({
    mutationFn: async ({ reservationId, items }: { 
      reservationId: number; 
      items: Array<{equipmentId: string; quantity: number; dailyPrice: number; deposit: number}> 
    }) => {
      const response = await apiRequest("PUT", `/api/reservations/${reservationId}/items`, { items });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: "Nepodařilo se aktualizovat položky rezervace",
        variant: "destructive"
      });
    }
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "čekající":
        return "secondary";
      case "vypůjčené":
        return "default";
      case "vrácené":
        return "outline";
      case "zrušené":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const handleEditClick = async (reservation: any) => {
    try {
      setEditingReservation(reservation);
      
      // Fetch actual reservation items from server
      const response = await fetch(`/api/reservations/${reservation.id}/items`);
      if (!response.ok) {
        throw new Error('Failed to fetch reservation items');
      }
      
      const reservationItems = await response.json();
      
      const formattedItems = reservationItems.map((item: any) => {
        const equipmentItem = equipment.find(eq => eq.id === item.equipmentId);
        return {
          equipmentId: item.equipmentId.toString(),
          quantity: item.quantity,
          name: equipmentItem ? equipmentItem.name : `Equipment ID ${item.equipmentId}`,
          dailyPrice: item.dailyPrice,
          deposit: item.deposit
        };
      });

      setEditFormData({
        dateFrom: reservation.dateFrom.split("T")[0],
        dateTo: reservation.dateTo.split("T")[0],
        quantity: reservation.quantity || 1,
        equipmentId: "",
        items: formattedItems
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se načíst položky rezervace",
        variant: "destructive"
      });
    }
  };

  const addNewItem = () => {
    if (editFormData.equipmentId) {
      const selectedEquipment = equipment.find(eq => eq.id === parseInt(editFormData.equipmentId));
      if (selectedEquipment) {
        setEditFormData(prev => ({
          ...prev,
          items: [...prev.items, {
            equipmentId: selectedEquipment.id.toString(),
            quantity: 1,
            name: selectedEquipment.name,
            dailyPrice: selectedEquipment.dailyPrice,
            deposit: selectedEquipment.deposit
          }],
          equipmentId: ""
        }));
      }
    }
  };

  const calculateTotalPrice = (): { totalPrice: number; totalDeposit: number } => {
    const days = calculateDays(editFormData.dateFrom, editFormData.dateTo);
    let totalPrice = 0;
    let totalDeposit = 0;

    editFormData.items.forEach(item => {
      totalPrice += item.dailyPrice * item.quantity * days;
      totalDeposit += item.deposit * item.quantity;
    });

    return { totalPrice, totalDeposit };
  };

  const removeItem = (index: number) => {
    setEditFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItemQuantity = (index: number, quantity: number) => {
    setEditFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, quantity: Math.max(1, quantity) } : item
      )
    }));
  };

  const updateItemPrice = (index: number, dailyPrice: number) => {
    setEditFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, dailyPrice: Math.max(0, dailyPrice) } : item
      )
    }));
  };

  const handleSaveEdit = async () => {
    if (editingReservation) {
      try {
        // Aktualizujeme hlavní rezervaci
        await updateReservationMutation.mutateAsync({
          id: editingReservation.id,
          data: {
            dateFrom: editFormData.dateFrom,
            dateTo: editFormData.dateTo,
            quantity: editFormData.quantity
          }
        });

        // Pak aktualizujeme položky rezervace
        if (editFormData.items.length > 0) {
          await updateReservationItemsMutation.mutateAsync({
            reservationId: editingReservation.id,
            items: editFormData.items.map(item => ({
              equipmentId: item.equipmentId,
              quantity: item.quantity,
              dailyPrice: item.dailyPrice,
              deposit: item.deposit
            }))
          });
        }

        setEditingReservation(null);
        setEditFormData({ 
          dateFrom: "", 
          dateTo: "", 
          quantity: 1,
          equipmentId: "",
          items: []
        });

        toast({
          title: "Úspěch",
          description: "Objednávka byla úspěšně aktualizována",
        });

      } catch (error) {
        toast({
          title: "Chyba",
          description: "Nepodařilo se aktualizovat objednávku",
          variant: "destructive"
        });
      }
    }
  };

  const handleCancelEdit = () => {
    setEditingReservation(null);
    setEditFormData({ 
      dateFrom: "", 
      dateTo: "", 
      quantity: 1,
      equipmentId: "",
      items: []
    });
  };

  if (reservationsLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Objednávky</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-20" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Objednávky ({reservations.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {reservations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>Zatím nejsou žádné objednávky</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reservations.map((reservation) => (
              <div key={reservation.id} className="border rounded-lg p-4">
                {editingReservation?.id === reservation.id ? (
                  // Edit mode
                  <div className="space-y-4">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-semibold">Upravit objednávku #{reservation.orderNumber}</h3>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={handleSaveEdit}
                          disabled={updateReservationMutation.isPending || updateReservationItemsMutation.isPending}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Save className="h-4 w-4 mr-1" />
                          {(updateReservationMutation.isPending || updateReservationItemsMutation.isPending) ? "Ukládám..." : "Uložit"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleCancelEdit}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Zrušit
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div>
                        <Label htmlFor="dateFrom">Od</Label>
                        <Input
                          id="dateFrom"
                          type="date"
                          value={editFormData.dateFrom?.slice(0, 10) ?? ""}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, dateFrom: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dateTo">Do</Label>
                        <Input
                          id="dateTo"
                          type="date"
                          value={editFormData.dateTo?.slice(0, 10) ?? ""}
                          onChange={(e) => setEditFormData(prev => ({ ...prev, dateTo: e.target.value }))}
                        />
                      </div>
                    </div>

                    {/* Current Items */}
                    <div className="mb-6">
                      <h4 className="font-medium mb-3">Položky objednávky</h4>
                      <div className="space-y-2">
                        {editFormData.items.map((item, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 border rounded">
                            <div className="flex-1">
                              <div className="font-medium">{item.name}</div>
                              <div className="text-sm text-gray-600">
                                Záloha: {formatPrice(item.deposit)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Cena/den:</Label>
                              <Input
                                type="number"
                                min="0"
                                value={item.dailyPrice}
                                onChange={(e) => updateItemPrice(index, parseInt(e.target.value) || 0)}
                                className="w-24"
                              />
                              <span className="text-sm text-gray-500">Kč</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Label className="text-sm">Počet:</Label>
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateItemQuantity(index, parseInt(e.target.value) || 1)}
                                className="w-20"
                              />
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeItem(index)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Add New Item */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Přidat novou položku</h4>
                      <div className="flex gap-3">
                        <Select
                          value={editFormData.equipmentId}
                          onValueChange={(value) => setEditFormData(prev => ({ ...prev, equipmentId: value }))}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Vyberte vybavení..." />
                          </SelectTrigger>
                          <SelectContent>
                            {equipment
                              .filter(eq => !editFormData.items.some(item => item.equipmentId === eq.id.toString()))
                              .map((eq) => (
                                <SelectItem key={eq.id} value={eq.id.toString()}>
                                  {eq.name} - {formatPrice(eq.dailyPrice)}/den
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={addNewItem}
                          disabled={!editFormData.equipmentId}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Přidat
                        </Button>
                      </div>
                    </div>

                    {/* Celkový přehled ceny */}
                    <div className="bg-gray-50 p-4 rounded-lg border-t">
                      <h4 className="font-medium mb-3">Přehled ceny</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Počet dní:</span>
                          <span>{calculateDays(editFormData.dateFrom, editFormData.dateTo)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Celková cena za půjčení:</span>
                          <span className="font-medium text-green-600">{formatPrice(calculateTotalPrice().totalPrice)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Vratná záloha:</span>
                          <span className="font-medium text-blue-600">{formatPrice(calculateTotalPrice().totalDeposit)}</span>
                        </div>
                        <div className="border-t pt-2 flex justify-between font-medium">
                          <span>Celkem k platbě:</span>
                          <span className="text-lg">{formatPrice(calculateTotalPrice().totalPrice + calculateTotalPrice().totalDeposit)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 border-t pt-4">
                      <p><strong>Zákazník:</strong> {reservation.customerName}</p>
                      <p><strong>E-mail:</strong> {reservation.customerEmail}</p>
                      <p><strong>Telefon:</strong> {reservation.customerPhone}</p>
                      <p><strong>Místo převzetí:</strong> {reservation.pickupLocation}</p>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="space-y-4">
                    {/* Hlavička objednávky */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-xl text-gray-900">#{reservation.orderNumber}</h3>
                          <Select
                            value={reservation.status}
                            onValueChange={(newStatus) => updateStatusMutation.mutate({ id: reservation.id, status: newStatus })}
                          >
                            <SelectTrigger className={`w-32 text-xs font-medium ${getStatusColor(reservation.status)} border-0`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="čekající">Čekající</SelectItem>
                              <SelectItem value="vypůjčené">Vypůjčené</SelectItem>
                              <SelectItem value="vrácené">Vrácené</SelectItem>
                              <SelectItem value="zrušené">Zrušené</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-sm text-gray-500">
                            {new Date(reservation.createdAt).toLocaleDateString('cs-CZ')}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Zákazník */}
                          <div>
                            <h4 className="font-medium text-gray-900 mb-1">{reservation.customerName}</h4>
                            {reservation.customerAddress && (
                              <p className="text-sm text-gray-600 mb-1">{reservation.customerAddress}</p>
                            )}
                            <p className="text-sm text-gray-600">{reservation.customerEmail}</p>
                            <p className="text-sm text-gray-600">{reservation.customerPhone}</p>
                          </div>
                          
                          {/* Detaily */}
                          <div>
                            <p className="text-sm mb-1">
                              <span className="font-medium">Místo převzetí:</span> {reservation.pickupLocation}
                            </p>
                            <p className="text-sm mb-1">
                              <span className="font-medium">Období:</span> {formatDate(reservation.dateFrom)} - {formatDate(reservation.dateTo)}
                            </p>
                            {reservation.customerNote && (
                              <p className="text-sm">
                                <span className="font-medium">Poznámky:</span> {reservation.customerNote}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Akce */}
                      <div className="flex gap-2 ml-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleGenerateInvoice(reservation.id)}
                          className="text-green-600 border-green-200 hover:bg-green-50"
                          title="Stáhnout výpůjční smlouvu"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEditClick(reservation)}
                          title="Upravit objednávku"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600" title="Smazat objednávku">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Smazat objednávku</AlertDialogTitle>
                              <AlertDialogDescription>
                                Opravdu chcete smazat objednávku #{reservation.orderNumber}? Tato akce je nevratná.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Zrušit</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteReservationMutation.mutate(reservation.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Smazat
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>



                    {/* Zobrazení položek objednávky */}
                    <div className="border-t pt-4">
                      {reservation.items && reservation.items.length > 0 ? (
                        <div className="space-y-3">
                          <h4 className="font-semibold text-gray-900 mb-3">Položky objednávky</h4>
                          
                          {/* Seznam položek */}
                          <div className="space-y-2">
                            {reservation.items.map((item: any, index: number) => {
                              const equipmentInfo = equipment.find(eq => eq.id === item.equipmentId);
                              const days = calculateDays(reservation.dateFrom, reservation.dateTo);
                              return (
                                <div key={index} className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border">
                                  <div className="flex-1">
                                    <div className="font-medium text-gray-900">{equipmentInfo?.name || `Equipment ${item.equipmentId}`}</div>
                                    <div className="text-sm text-gray-600 mt-1 flex gap-6">
                                      <span>Množství: <strong>{item.quantity} ks</strong></span>
                                      <span>Dní: <strong>{days}</strong></span>
                                      <span>Denní cena: <strong>{formatPrice(item.dailyPrice)}</strong></span>
                                    </div>
                                  </div>
                                  <div className="text-right ml-4">
                                    <div className="text-lg font-semibold text-gray-900">{formatPrice(item.dailyPrice * days * item.quantity)}</div>
                                    <div className="text-sm text-gray-600">záloha: {formatPrice(item.deposit * item.quantity)}</div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                          
                          {/* Celkový součet */}
                          <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border border-blue-200 mt-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                  <span>Celkem za půjčení:</span>
                                  <span className="font-medium text-green-600">
                                    {formatPrice(reservation.items.reduce((sum: number, item: any) => {
                                      const days = calculateDays(reservation.dateFrom, reservation.dateTo);
                                      return sum + (item.dailyPrice * days * item.quantity);
                                    }, 0))}
                                  </span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Celková záloha:</span>
                                  <span className="font-medium text-blue-600">
                                    {formatPrice(reservation.items.reduce((sum: number, item: any) => sum + (item.deposit * item.quantity), 0))}
                                  </span>
                                </div>
                              </div>
                              <div className="border-l border-blue-300 pl-4">
                                <div className="flex justify-between items-center">
                                  <span className="text-lg font-semibold">Celkem k platbě:</span>
                                  <span className="text-2xl font-bold text-gray-900">
                                    {formatPrice(
                                      reservation.items.reduce((sum: number, item: any) => {
                                        const days = calculateDays(reservation.dateFrom, reservation.dateTo);
                                        return sum + (item.dailyPrice * days * item.quantity);
                                      }, 0) +
                                      reservation.items.reduce((sum: number, item: any) => sum + (item.deposit * item.quantity), 0)
                                    )}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600 text-right mt-1">
                                  {reservation.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} ks, {reservation.items.length} položek
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Fallback pro starší objednávky bez položek
                        <div className="bg-gray-50 p-4 rounded-lg border">
                          <div className="flex justify-between items-center">
                            <div>
                              {(() => {
                                const currentEquipment = equipment.find(eq => eq.id === reservation.equipmentId);
                                return currentEquipment ? (
                                  <div>
                                    <div className="font-medium text-gray-900">{currentEquipment.name}</div>
                                    <div className="text-sm text-gray-600 mt-1">
                                      Množství: {reservation.quantity || 1} ks
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-red-500">Vybavení již není dostupné</span>
                                );
                              })()}
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-semibold">{formatPrice(reservation.totalPrice)}</div>
                              <div className="text-sm text-gray-600">záloha: {formatPrice(reservation.totalDeposit)}</div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EditEquipmentModal({ equipment, onClose }: { equipment: Equipment; onClose: () => void }) {
  const { toast } = useToast();
  const [uploadingImage, setUploadingImage] = useState(false);

  const form = useForm<UpdateEquipment>({
    resolver: zodResolver(updateEquipmentSchema),
    defaultValues: {
      name: equipment.name,
      description: equipment.description,
      dailyPrice: equipment.dailyPrice,
      price1to3Days: equipment.price1to3Days,
      price4to7Days: equipment.price4to7Days,
      price8PlusDays: equipment.price8PlusDays,
      deposit: equipment.deposit,
      stock: equipment.stock,
      imageUrl: equipment.imageUrl,
      categories: equipment.categories || ["all"],
    },
  });

  const updateEquipmentMutation = useMutation({
    mutationFn: async (data: UpdateEquipment) => {
      const response = await apiRequest("PUT", `/api/equipment/${equipment.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      onClose();
      toast({
        title: "Úspěch",
        description: "Vybavení bylo úspěšně upraveno",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se upravit vybavení",
        variant: "destructive",
      });
    },
  });

  // Local image upload function for EditEquipmentModal
  const handleImageUpload = async (file: File): Promise<string | null> => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      
      toast({
        title: "Úspěch",
        description: "Obrázek byl úspěšně nahrán",
      });
      return data.imageUrl;
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se nahrát obrázek",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const onSubmit = (data: UpdateEquipment) => {
    // Ensure all required fields are properly formatted
    const updatedData = {
      ...data,
      dailyPrice: Number(data.dailyPrice) || Number(data.price1to3Days), // Use price1to3Days as fallback
      price1to3Days: Number(data.price1to3Days),
      price4to7Days: Number(data.price4to7Days),
      price8PlusDays: Number(data.price8PlusDays),
      deposit: Number(data.deposit),
      stock: Number(data.stock),
    };
    updateEquipmentMutation.mutate(updatedData);
  };

  return (
    <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Upravit vybavení</DialogTitle>
      </DialogHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Název *</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Obrázek vybavení</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const imageUrl = await handleImageUpload(file);
                              if (imageUrl) {
                                field.onChange(imageUrl);
                              }
                              // Clear the file input
                              e.target.value = '';
                            }
                          }}
                          disabled={uploadingImage}
                          className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                        />
                        {uploadingImage && (
                          <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                            <span className="text-sm text-gray-600">Nahrávám...</span>
                          </div>
                        )}
                      </div>
                      {field.value && (
                        <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                          <img 
                            src={field.value} 
                            alt="Náhled" 
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/uploads/placeholder.svg';
                            }}
                          />
                          <button
                            type="button"
                            className="absolute top-1 right-1 h-6 w-6 p-0 bg-red-600 text-white rounded-full text-xs"
                            onClick={() => {
                              field.onChange("");
                            }}
                          >
                            ×
                          </button>
                        </div>
                      )}
                      <Input 
                        type="text"
                        placeholder="Nebo vložte URL obrázku..."
                        value={field.value || ""}
                        onChange={(e) => {
                          field.onChange(e.target.value);
                        }}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tiered Pricing Fields - Full width section */}
            <div className="md:col-span-2 bg-gray-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium mb-3 text-gray-700">Stupňované ceny podle počtu dní</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="price1to3Days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>1-3 dny (Kč/den) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price4to7Days"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>4-7 dnů (Kč/den) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="price8PlusDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>8+ dnů (Kč/den) *</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Keep legacy field for compatibility */}
            <FormField
              control={form.control}
              name="dailyPrice"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="deposit"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Vratná záloha (Kč) *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="stock"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Počet kusů k půjčení *</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Popis *</FormLabel>
                <FormControl>
                  <Textarea 
                    className="min-h-[100px]"
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categories"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Kategorie *</FormLabel>
                <FormControl>
                  <div className="space-y-2">
                    {[
                      { key: "all", label: "Vše" },
                      { key: "ferraty", label: "Via Ferrata" },
                      { key: "kids", label: "Pro děti" },
                      { key: "camping", label: "Kempování" },
                      { key: "climbing", label: "Lezení" },
                      { key: "winter", label: "Zimní vybavení" },
                      { key: "voda", label: "Vodní sporty" }
                    ].map((category) => (
                      <div key={category.key} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`category-edit-${category.key}`}
                          checked={field.value?.includes(category.key) || false}
                          onChange={(e) => {
                            const currentCategories = field.value || [];
                            if (e.target.checked) {
                              field.onChange([...currentCategories, category.key]);
                            } else {
                              field.onChange(currentCategories.filter(c => c !== category.key));
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`category-edit-${category.key}`} className="text-sm">
                          {category.label}
                        </label>
                      </div>
                    ))}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-2">
            <Button 
              type="submit" 
              className="flex-1 bg-teal-500 hover:bg-teal-600 text-white"
              disabled={updateEquipmentMutation.isPending}
            >
              {updateEquipmentMutation.isPending ? "Ukládám..." : "Uložit změny"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Zrušit
            </Button>
          </div>
        </form>
      </Form>
    </DialogContent>
  );
}

export default function Admin() {
  const [, setLocation] = useLocation();
  const [cartItemCount, setCartItemCount] = useState(0);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [currentTab, setCurrentTab] = useState("orders");
  const [editingReservation, setEditingReservation] = useState<any | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);


  
  // Analytics filters
  const [analyticsFilters, setAnalyticsFilters] = useState({
    dateFrom: "",
    dateTo: "",
    equipmentCategory: "all",
    status: "all"
  });

  // Separate state for applied filters (used for actual filtering)
  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: "",
    dateTo: "",
    equipmentCategory: "all",
    status: "all"
  });

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportReservationsData = (filteredReservations: any[]) => {
    const exportData = filteredReservations.map(res => ({
      'Číslo objednávky': res.orderNumber,
      'Jméno zákazníka': res.customerName,
      'Email': res.customerEmail,
      'Telefon': res.customerPhone,
      'Od data': formatDate(res.dateFrom),
      'Do data': formatDate(res.dateTo),
      'Místo převzetí': res.pickupLocation,
      'Celková cena': res.totalPrice,
      'Záloha': res.totalDeposit,
      'Status': res.status,
      'Vytvořeno': formatDate(res.createdAt)
    }));
    exportToCSV(exportData, 'objednavky');
  };

  const exportEquipmentPerformance = (equipmentUsage: any[]) => {
    const exportData = equipmentUsage.map(eq => ({
      'Název vybavení': eq.name,
      'Celkem půjčeno': eq.totalQuantityRented,
      'Počet půjček': eq.rentalsCount,
      'Celkem dnů půjčeno': eq.totalRentalDays,
      'Celkový výdělek': eq.totalRevenue,
      'Využití skladu (%)': eq.utilizationRate,
      'Skladem': eq.stock,
      'Denní cena': eq.dailyPrice,
      'Záloha': eq.deposit
    }));
    exportToCSV(exportData, 'vykonnost_vybaveni');
  };

  const { toast } = useToast();

  // Logout functionality
  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/auth/logout");
      setLocation("/login");
      toast({
        title: "Odhlášení",
        description: "Byli jste úspěšně odhlášeni",
      });
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se odhlásit",
        variant: "destructive",
      });
    }
  };

  // Image upload function
  const handleImageUpload = async (file: File): Promise<string | null> => {
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status}`);
      }

      const data = await response.json();
      
      // Set image preview to uploaded URL
      setImagePreview(data.imageUrl);
      
      toast({
        title: "Úspěch",
        description: "Obrázek byl úspěšně nahrán",
      });
      return data.imageUrl;
    } catch (error) {
      toast({
        title: "Chyba",
        description: "Nepodařilo se nahrát obrázek",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Load cart items count
  useEffect(() => {
    const saved = localStorage.getItem('cartItems');
    if (saved) {
      const cartItems: CartItem[] = JSON.parse(saved);
      setCartItemCount(cartItems.length);
    }
  }, []);

  const handleCartClick = () => {
    setLocation("/cart");
  };

  // Fetch equipment
  const { data: equipment = [], isLoading: equipmentLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  // Fetch reservations for analytics
  const { data: reservations = [] } = useQuery<any[]>({
    queryKey: ["/api/reservations"],
  });

  // Add equipment form
  const form = useForm<InsertEquipment>({
    resolver: zodResolver(insertEquipmentSchema),
    defaultValues: {
      name: "",
      description: "",
      dailyPrice: 0,
      price1to3Days: 0,
      price4to7Days: 0,
      price8PlusDays: 0,
      deposit: 0,
      stock: 1,
      imageUrl: "",
      categories: ["all"],
    },
  });

  // Add equipment mutation
  const addEquipmentMutation = useMutation({
    mutationFn: async (data: InsertEquipment) => {
      const response = await apiRequest("POST", "/api/equipment", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      form.reset({
        name: "",
        description: "",
        dailyPrice: 0,
        price1to3Days: 0,
        price4to7Days: 0,
        price8PlusDays: 0,
        deposit: 0,
        stock: 1,
        imageUrl: "",
        categories: ["all"],
      });
      setImagePreview(null);
      toast({
        title: "Úspěch",
        description: "Vybavení bylo úspěšně přidáno",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se přidat vybavení",
        variant: "destructive",
      });
    },
  });

  // Delete equipment mutation
  const deleteEquipmentMutation = useMutation({
    mutationFn: async (equipmentId: string) => {
      const response = await apiRequest("DELETE", `/api/equipment/${equipmentId}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Úspěch",
        description: "Vybavení bylo úspěšně smazáno",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se smazat vybavení",
        variant: "destructive",
      });
    },
  });

  const handleDeleteEquipment = (equipmentId: string) => {
    deleteEquipmentMutation.mutate(equipmentId);
  };

  // Move equipment order mutation
  const reorderEquipmentMutation = useMutation({
    mutationFn: async (equipmentOrders: { id: string; sortOrder: number }[]) => {
      const response = await apiRequest("POST", "/api/equipment/reorder", { equipmentOrders });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Úspěch",
        description: "Pořadí vybavení bylo změněno",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se změnit pořadí",
        variant: "destructive",
      });
    },
  });

  const moveEquipment = (equipmentId: string, direction: 'up' | 'down') => {
    const currentIndex = equipment.findIndex(item => item.id === parseInt(equipmentId));
    if (currentIndex === -1) return;

    const newEquipment = [...equipment];
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= newEquipment.length) return;

    // Swap positions
    [newEquipment[currentIndex], newEquipment[targetIndex]] = [newEquipment[targetIndex], newEquipment[currentIndex]];
    
    // Update sort orders
    const updates = newEquipment.map((item, index) => ({
      id: item.id.toString(),
      sortOrder: index
    }));

    reorderEquipmentMutation.mutate(updates);
  };

  // Update reservation mutation
  const updateReservationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { dateFrom: string; dateTo: string; quantity: number } }) => {
      const response = await apiRequest("PUT", `/api/reservations/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      setEditingReservation(null);
      toast({
        title: "Úspěch",
        description: "Objednávka byla úspěšně upravena",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se upravit objednávku",
        variant: "destructive",
      });
    },
  });

  // Delete reservation mutation
  const deleteReservationMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/reservations/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reservations"] });
      toast({
        title: "Úspěch",
        description: "Objednávka byla úspěšně smazána",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Chyba",
        description: error.message || "Nepodařilo se smazat objednávku",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    // ID se generuje automaticky v databázi (serial), takže ho neposíláme
    const equipmentData = {
      name: data.name,
      description: data.description,
      dailyPrice: Number(data.dailyPrice) || Number(data.price1to3Days), // Use price1to3Days as fallback for compatibility
      price1to3Days: Number(data.price1to3Days),
      price4to7Days: Number(data.price4to7Days),
      price8PlusDays: Number(data.price8PlusDays),
      deposit: Number(data.deposit),
      stock: Number(data.stock),
      imageUrl: data.imageUrl,
      categories: data.categories || [],
      sortOrder: Number(data.sortOrder) || 0
    };
    addEquipmentMutation.mutate(equipmentData);
  };

  return (
    <div className="min-h-screen bg-neutral-light">
      <Header cartItemCount={cartItemCount} onCartClick={handleCartClick} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-neutral-dark mb-2">
              Administrace
            </h1>
            <p className="text-gray-600">
              Správa vybavení a zobrazení objednávek
            </p>
          </div>
          <Button 
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut className="h-4 w-4" />
            Odhlásit se
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Left Sidebar Menu */}
          <div className="w-64 flex-shrink-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Menu</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1">
                  <button
                    onClick={() => setCurrentTab("orders")}
                    className={`w-full p-3 rounded-md border-l-4 flex items-center gap-3 text-left transition-colors ${
                      currentTab === "orders"
                        ? "bg-teal-100 text-teal-700 border-teal-500 font-medium"
                        : "border-transparent hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <Users className="h-5 w-5" />
                    <span>Objednávky</span>
                  </button>
                  
                  <div>
                    <button
                      onClick={() => setCurrentTab("equipment")}
                      className={`w-full p-3 rounded-md border-l-4 flex items-center gap-3 text-left transition-colors ${
                        currentTab === "equipment" || currentTab === "add-equipment"
                          ? "bg-green-100 text-green-700 border-green-500 font-medium"
                          : "border-transparent hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      <Package className="h-5 w-5" />
                      <span>Vybavení</span>
                    </button>
                    {/* Submenu for Equipment */}
                    {(currentTab === "equipment" || currentTab === "add-equipment") && (
                      <div className="ml-6 mt-1 space-y-1">
                        <button
                          onClick={() => setCurrentTab("equipment")}
                          className={`w-full p-2 rounded-md text-sm flex items-center gap-2 text-left transition-colors ${
                            currentTab === "equipment"
                              ? "bg-teal-50 text-teal-600 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <div className="w-1 h-1 bg-current rounded-full" />
                          <span>Seznam vybavení</span>
                        </button>
                        <button
                          onClick={() => setCurrentTab("add-equipment")}
                          className={`w-full p-2 rounded-md text-sm flex items-center gap-2 text-left transition-colors ${
                            currentTab === "add-equipment"
                              ? "bg-teal-50 text-teal-600 font-medium"
                              : "text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          <div className="w-1 h-1 bg-current rounded-full" />
                          <span>Přidat nové vybavení</span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={() => setCurrentTab("analytics")}
                    className={`w-full p-3 rounded-md border-l-4 flex items-center gap-3 text-left transition-colors ${
                      currentTab === "analytics"
                        ? "bg-teal-100 text-teal-700 border-teal-500 font-medium"
                        : "border-transparent hover:bg-gray-50 text-gray-600"
                    }`}
                  >
                    <BarChart3 className="h-5 w-5" />
                    <span>Statistiky</span>
                  </button>
                  


                  
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="flex-1">
            {/* Equipment List */}
            {currentTab === "equipment" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Seznam vybavení</span>
                    <Button 
                      onClick={() => setCurrentTab("add-equipment")}
                      className="bg-green-500 hover:bg-green-600 text-white flex items-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Přidat nové vybavení
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {equipmentLoading ? (
                    <div className="space-y-4">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="bg-gray-200 animate-pulse rounded-lg h-24" />
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {equipment.map((item) => (
                        <div key={item.id} className="border rounded-lg p-4 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <img 
                              src={item.imageUrl || '/uploads/placeholder.svg'} 
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded"
                              onError={(e) => {
                                e.currentTarget.src = '/uploads/placeholder.svg';
                              }}
                            />
                            <div>
                              <h3 className="font-semibold">{item.name}</h3>
                              <p className="text-sm text-gray-600">{item.description}</p>
                              <div className="flex gap-4 text-sm">
                                <span>Cena: {formatPrice(item.price1to3Days)} / {formatPrice(item.price4to7Days)} / {formatPrice(item.price8PlusDays)}</span>
                                <span>Záloha: {formatPrice(item.deposit)}</span>
                                <span>Skladem: {item.stock} ks</span>
                              </div>
                              {item.categories && item.categories.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-2">
                                  {item.categories.map((category, index) => (
                                    <Badge key={index} variant="secondary" className="text-xs">
                                      {category === 'ferraty' ? 'Ferraty' :
                                       category === 'krosny' ? 'Krosny' :
                                       category === 'spacaky' ? 'Spacáky' :
                                       category === 'camping' ? 'Kempování' :
                                       category === 'vybaveni' ? 'Vybavení' :
                                       category === 'general' ? 'Obecné' : category}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex flex-col gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveEquipment(item.id.toString(), 'up')}
                                disabled={equipment.findIndex(eq => eq.id === item.id) === 0 || reorderEquipmentMutation.isPending}
                                className="h-8 w-8 p-0"
                                title="Přesunout nahoru"
                              >
                                <ChevronUp className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveEquipment(item.id.toString(), 'down')}
                                disabled={equipment.findIndex(eq => eq.id === item.id) === equipment.length - 1 || reorderEquipmentMutation.isPending}
                                className="h-8 w-8 p-0"
                                title="Přesunout dolů"
                              >
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <Dialog open={editingEquipment?.id === item.id} onOpenChange={(open) => !open && setEditingEquipment(null)}>
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm" onClick={() => setEditingEquipment(item)}>
                                  <Edit2 className="h-4 w-4" />
                                </Button>
                              </DialogTrigger>
                              {editingEquipment && editingEquipment.id === item.id && (
                                <EditEquipmentModal 
                                  equipment={editingEquipment} 
                                  onClose={() => setEditingEquipment(null)} 
                                />
                              )}
                            </Dialog>
                            
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="outline" size="sm" className="text-red-600">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Smazat vybavení</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Opravdu chcete smazat "{item.name}"? Tato akce je nevratná.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Zrušit</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDeleteEquipment(item.id.toString())}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Smazat
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Add Equipment Form */}
            {currentTab === "add-equipment" && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Přidat nové vybavení
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Název *</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="Název vybavení" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Tiered Pricing Fields */}
                        <div className="bg-gray-50 p-4 rounded-lg md:col-span-2">
                          <h4 className="text-sm font-medium mb-3 text-gray-700">Stupňované ceny podle počtu dní</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                              control={form.control}
                              name="price1to3Days"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>1-3 dny (Kč/den) *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      placeholder="Nejvyšší cena"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="price4to7Days"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>4-7 dnů (Kč/den) *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      placeholder="Střední cena"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name="price8PlusDays"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>8+ dnů (Kč/den) *</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="number" 
                                      {...field}
                                      onChange={(e) => field.onChange(Number(e.target.value))}
                                      placeholder="Nejnižší cena"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Delší půjčení = levnější cena za den. Doporučujeme ceny klesající s délkou půjčení.
                          </p>
                        </div>

                        {/* Keep legacy field for compatibility - hidden */}
                        <FormField
                          control={form.control}
                          name="dailyPrice"
                          render={({ field }) => (
                            <FormItem className="hidden">
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="deposit"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Vratná záloha (Kč) *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  placeholder="Výše zálohy"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="stock"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Počet kusů *</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  {...field}
                                  onChange={(e) => field.onChange(Number(e.target.value))}
                                  placeholder="Počet kusů na skladě"
                                  min="1"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Popis *</FormLabel>
                            <FormControl>
                              <Textarea 
                                className="min-h-[100px]"
                                {...field} 
                                placeholder="Detailní popis vybavení..."
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Obrázek vybavení</FormLabel>
                            <FormControl>
                              <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                  <input
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const imageUrl = await handleImageUpload(file);
                                        if (imageUrl) {
                                          field.onChange(imageUrl);
                                        }
                                        // Clear the file input
                                        e.target.value = '';
                                      }
                                    }}
                                    disabled={uploadingImage}
                                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                                  />
                                  {uploadingImage && (
                                    <div className="flex items-center gap-2">
                                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                                      <span className="text-sm text-gray-600">Nahrávám...</span>
                                    </div>
                                  )}
                                </div>
                                {field.value && (
                                  <div className="relative w-32 h-32 border rounded-lg overflow-hidden">
                                    <img 
                                      src={field.value} 
                                      alt="Náhled" 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // Show placeholder instead of hiding
                                        e.currentTarget.src = '/uploads/placeholder.svg';
                                      }}
                                    />
                                    <Button
                                      type="button"
                                      variant="destructive"
                                      size="sm"
                                      className="absolute top-1 right-1 h-6 w-6 p-0"
                                      onClick={() => {
                                        field.onChange("");
                                        setImagePreview(null);
                                      }}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                )}
                                <Input 
                                  type="text"
                                  placeholder="Nebo vložte URL obrázku..."
                                  value={field.value || ""}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    field.onChange(value);
                                    setImagePreview(value);
                                  }}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="categories"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Kategorie *</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                {[
                                  { key: "all", label: "Vše" },
                                  { key: "ferraty", label: "Via Ferrata" },
                                  { key: "kids", label: "Pro děti" },
                                  { key: "camping", label: "Kempování" },
                                  { key: "climbing", label: "Lezení" },
                                  { key: "winter", label: "Zimní vybavení" },
                                  { key: "voda", label: "Vodní sporty" }
                                ].map((category) => (
                                  <div key={category.key} className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      id={`category-${category.key}`}
                                      checked={field.value?.includes(category.key) || false}
                                      onChange={(e) => {
                                        const currentCategories = field.value || [];
                                        if (e.target.checked) {
                                          field.onChange([...currentCategories, category.key]);
                                        } else {
                                          field.onChange(currentCategories.filter(c => c !== category.key));
                                        }
                                      }}
                                      className="rounded border-gray-300"
                                    />
                                    <label htmlFor={`category-${category.key}`} className="text-sm">
                                      {category.label}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-4">
                        <Button 
                          type="submit" 
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                          disabled={addEquipmentMutation.isPending}
                        >
                          {addEquipmentMutation.isPending ? "Přidávám..." : "Přidat vybavení"}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => setCurrentTab("equipment")}
                        >
                          Zpět na seznam
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Orders */}
            {currentTab === "orders" && <OrdersList />}

            {/* Analytics */}
            {currentTab === "analytics" && (
              <div className="space-y-6">
                {/* Filters */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Filtry statistik
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <Label htmlFor="dateFrom">Od data</Label>
                        <Input
                          id="dateFrom"
                          type="date"
                          value={analyticsFilters.dateFrom}
                          onChange={(e) => setAnalyticsFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="dateTo">Do data</Label>
                        <Input
                          id="dateTo"
                          type="date"
                          value={analyticsFilters.dateTo}
                          onChange={(e) => setAnalyticsFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="category">Kategorie vybavení</Label>
                        <Select
                          value={analyticsFilters.equipmentCategory}
                          onValueChange={(value) => setAnalyticsFilters(prev => ({ ...prev, equipmentCategory: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Všechny kategorie" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Všechny kategorie</SelectItem>
                            <SelectItem value="ferraty">Via Ferrata</SelectItem>
                            <SelectItem value="kids">Pro děti</SelectItem>
                            <SelectItem value="camping">Kempování</SelectItem>
                            <SelectItem value="climbing">Lezení</SelectItem>
                            <SelectItem value="winter">Zimní vybavení</SelectItem>
                            <SelectItem value="paddleboardy">Vodní sporty</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="status">Status objednávky</Label>
                        <Select
                          value={analyticsFilters.status}
                          onValueChange={(value) => setAnalyticsFilters(prev => ({ ...prev, status: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Všechny statusy" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Všechny statusy</SelectItem>
                            <SelectItem value="čekající">Čekající</SelectItem>
                            <SelectItem value="vypůjčené">Vypůjčené</SelectItem>
                            <SelectItem value="vrácené">Vrácené</SelectItem>
                            <SelectItem value="zrušené">Zrušené</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => setAppliedFilters(analyticsFilters)}
                        variant="default"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Filtrovat
                      </Button>
                      <Button
                        onClick={() => {
                          const emptyFilters = { dateFrom: "", dateTo: "", equipmentCategory: "all", status: "all" };
                          setAnalyticsFilters(emptyFilters);
                          setAppliedFilters(emptyFilters);
                        }}
                        variant="outline"
                        size="sm"
                      >
                        Vymazat filtry
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {(() => {
                  // Filter reservations based on applied filters
                  const filteredReservations = reservations?.filter(res => {
                    const matchesDate = (!appliedFilters.dateFrom || res.dateFrom >= appliedFilters.dateFrom) &&
                                      (!appliedFilters.dateTo || res.dateTo <= appliedFilters.dateTo);
                    const matchesStatus = appliedFilters.status === "all" || res.status === appliedFilters.status;
                    
                    // Filter by equipment category if specified
                    let matchesCategory = true;
                    if (appliedFilters.equipmentCategory !== "all") {
                      matchesCategory = res.items?.some((item: any) => {
                        const equipmentItem = equipment?.find(eq => eq.id === item.equipmentId);
                        return equipmentItem?.categories?.includes(appliedFilters.equipmentCategory);
                      }) || false;
                    }
                    
                    return matchesDate && matchesStatus && matchesCategory;
                  }) || [];

                  // Calculate equipment usage statistics
                  const equipmentUsage = equipment?.map(eq => {
                    const totalQuantityRented = filteredReservations
                      .flatMap(res => res.items || [])
                      .filter((item: any) => item.equipmentId === eq.id)
                      .reduce((sum: number, item: any) => sum + item.quantity, 0);
                    
                    const totalRevenue = filteredReservations
                      .flatMap(res => res.items || [])
                      .filter((item: any) => item.equipmentId === eq.id)
                      .reduce((sum: number, item: any) => {
                        const days = calculateBillableDays(item.dateFrom, item.dateTo);
                        return sum + (item.dailyPrice * days * item.quantity);
                      }, 0);

                    const rentalsCount = filteredReservations
                      .filter(res => res.items?.some((item: any) => item.equipmentId === eq.id))
                      .length;

                    // Calculate total rental days for this equipment
                    const totalRentalDays = filteredReservations
                      .filter(res => res.items?.some((item: any) => item.equipmentId === eq.id))
                      .reduce((totalDays: number, res: any) => {
                        const relevantItems = res.items?.filter((item: any) => item.equipmentId === eq.id) || [];
                        const reservationDays = relevantItems.reduce((days: number, item: any) => {
                          return days + (calculateBillableDays(res.dateFrom, res.dateTo) * item.quantity);
                        }, 0);
                        return totalDays + reservationDays;
                      }, 0);

                    // Calculate utilization rate based on filtered period
                    let utilizationRate = 0;
                    let startDate: Date, endDate: Date;
                    
                    if (appliedFilters.dateFrom && appliedFilters.dateTo) {
                      startDate = new Date(appliedFilters.dateFrom);
                      endDate = new Date(appliedFilters.dateTo);
                    } else {
                      // Default date range from June 1, 2025 to current date when no filter is set
                      startDate = new Date('2025-06-01');
                      endDate = new Date();
                    }
                    
                    const totalFilteredDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    
                    // Calculate how many days this equipment was rented within the period
                    const rentedDaysInPeriod = filteredReservations
                      .filter(res => res.items?.some((item: any) => item.equipmentId === eq.id))
                      .reduce((totalDays: number, res: any) => {
                        const relevantItems = res.items?.filter((item: any) => item.equipmentId === eq.id) || [];
                        const reservationDays = relevantItems.reduce((days: number, item: any) => {
                          return days + calculateBillableDays(res.dateFrom, res.dateTo);
                        }, 0);
                        return totalDays + reservationDays;
                      }, 0);

                    utilizationRate = totalFilteredDays > 0 ? Math.round((rentedDaysInPeriod / totalFilteredDays) * 100) : 0;

                    return {
                      ...eq,
                      totalQuantityRented,
                      totalRevenue,
                      rentalsCount,
                      totalRentalDays,
                      utilizationRate
                    };
                  }).sort((a, b) => b.totalRevenue - a.totalRevenue) || [];

                  return (
                    <>
                      {/* Key Metrics */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="h-5 w-5" />
                              Přehled prodeje
                              {(appliedFilters.dateFrom || appliedFilters.dateTo) && (
                                <Badge variant="outline" className="ml-2">
                                  Filtrováno
                                </Badge>
                              )}
                            </div>
                            <Button
                              onClick={() => exportReservationsData(filteredReservations)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <FileDown className="h-4 w-4" />
                              Export CSV
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-blue-100">Celkově půjčovné</p>
                                  <p className="text-2xl font-bold">
                                    {filteredReservations.reduce((total, res) => {
                                      const itemRevenue = res.items?.reduce((sum: number, item: any) => {
                                        const days = calculateBillableDays(item.dateFrom, item.dateTo);
                                        return sum + (item.dailyPrice * days * item.quantity);
                                      }, 0) || 0;
                                      return total + itemRevenue;
                                    }, 0).toLocaleString('cs-CZ')} Kč
                                  </p>
                                </div>
                                <DollarSign className="h-8 w-8 text-blue-200" />
                              </div>
                            </div>
                            
                            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-green-100">Počet objednávek</p>
                                  <p className="text-2xl font-bold">{filteredReservations.length}</p>
                                </div>
                                <Package className="h-8 w-8 text-green-200" />
                              </div>
                            </div>
                            
                            <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-purple-100">Průměrná objednávka (bez zálohy)</p>
                                  <p className="text-2xl font-bold">
                                    {filteredReservations.length > 0 
                                      ? Math.round(filteredReservations.reduce((total, res) => {
                                        const itemRevenue = res.items?.reduce((sum: number, item: any) => {
                                          const days = calculateBillableDays(item.dateFrom, item.dateTo);
                                          return sum + (item.dailyPrice * days * item.quantity);
                                        }, 0) || 0;
                                        return total + itemRevenue;
                                      }, 0) / filteredReservations.length).toLocaleString('cs-CZ')
                                      : 0} Kč
                                  </p>
                                </div>
                                <BarChart3 className="h-8 w-8 text-purple-200" />
                              </div>
                            </div>

                            <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-4 rounded-lg">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-orange-100">Celkové zálohy</p>
                                  <p className="text-2xl font-bold">
                                    {filteredReservations.reduce((total, res) => {
                                      const itemDeposits = res.items?.reduce((sum: number, item: any) => sum + (item.deposit * item.quantity), 0) || 0;
                                      return total + itemDeposits;
                                    }, 0).toLocaleString('cs-CZ')} Kč
                                  </p>
                                </div>
                                <UserCheck className="h-8 w-8 text-orange-200" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Equipment Performance */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>Výkonnost vybavení</span>
                            <Button
                              onClick={() => exportEquipmentPerformance(equipmentUsage)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <FileDown className="h-4 w-4" />
                              Export CSV
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {equipmentUsage.slice(0, 10).map((item) => (
                              <div key={item.id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h3 className="font-medium">{item.name}</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-2 text-sm text-gray-600">
                                      <div>
                                        <span className="font-medium">Půjčeno celkem:</span>
                                        <p className="text-lg font-semibold text-blue-600">{item.totalQuantityRented}x</p>
                                      </div>
                                      <div>
                                        <span className="font-medium">Počet půjček:</span>
                                        <p className="text-lg font-semibold text-green-600">{item.rentalsCount}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium">Vypůjčeno dnů:</span>
                                        <p className="text-lg font-semibold text-orange-600">{item.totalRentalDays}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium">Tržba na půjčovném:</span>
                                        <p className="text-lg font-semibold text-purple-600">{formatPrice(item.totalRevenue)}</p>
                                      </div>
                                      <div>
                                        <span className="font-medium">Využití skladu:</span>
                                        <div className="flex items-center gap-2">
                                          <div className="flex-1 bg-gray-200 rounded-full h-2">
                                            <div 
                                              className="bg-blue-500 h-2 rounded-full" 
                                              style={{ width: `${Math.min(item.utilizationRate, 100)}%` }}
                                            />
                                          </div>
                                          <span className="text-sm font-medium">{item.utilizationRate}%</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Monthly Trends */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>Měsíční trendy</span>
                            <Button
                              onClick={() => {
                                const monthlyData = filteredReservations.reduce((acc, res) => {
                                  const month = new Date(res.createdAt).toLocaleDateString('cs-CZ', { year: 'numeric', month: 'long' });
                                  if (!acc[month]) {
                                    acc[month] = { orders: 0, revenue: 0, deposits: 0 };
                                  }
                                  acc[month].orders += 1;
                                  acc[month].revenue += res.totalPrice;
                                  acc[month].deposits += res.totalDeposit;
                                  return acc;
                                }, {} as Record<string, {orders: number, revenue: number, deposits: number}>);

                                const exportData = Object.entries(monthlyData).map(([month, data]) => ({
                                  'Měsíc': month,
                                  'Počet objednávek': data.orders,
                                  'Celkové tržby': data.revenue,
                                  'Celkové zálohy': data.deposits,
                                  'Průměrná objednávka': Math.round(data.revenue / data.orders)
                                }));
                                exportToCSV(exportData, 'mesicni_trendy');
                              }}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <FileDown className="h-4 w-4" />
                              Export CSV
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {(() => {
                              const monthlyData = filteredReservations.reduce((acc, res) => {
                                const month = new Date(res.createdAt).toLocaleDateString('cs-CZ', { year: 'numeric', month: 'long' });
                                if (!acc[month]) {
                                  acc[month] = { orders: 0, revenue: 0, deposits: 0 };
                                }
                                acc[month].orders += 1;
                                acc[month].revenue += res.totalPrice;
                                acc[month].deposits += res.totalDeposit;
                                return acc;
                              }, {} as Record<string, {orders: number, revenue: number, deposits: number}>);

                              return Object.entries(monthlyData)
                                .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
                                .map(([month, data]) => (
                                  <div key={month} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                      <span className="font-medium">{month}</span>
                                      <div className="text-sm text-gray-600">
                                        {data.orders} objednávek
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold text-green-600">
                                        {formatPrice(data.revenue)}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        Zálohy: {formatPrice(data.deposits)}
                                      </div>
                                    </div>
                                  </div>
                                ));
                            })()}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Customer Analysis */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center justify-between">
                            <span>Analýza zákazníků</span>
                            <Button
                              onClick={() => {
                                const customerData = filteredReservations.reduce((acc, res) => {
                                  if (!acc[res.customerEmail]) {
                                    acc[res.customerEmail] = {
                                      name: res.customerName,
                                      orders: 0,
                                      totalSpent: 0,
                                      lastOrder: res.createdAt
                                    };
                                  }
                                  acc[res.customerEmail].orders += 1;
                                  acc[res.customerEmail].totalSpent += res.totalPrice;
                                  if (new Date(res.createdAt) > new Date(acc[res.customerEmail].lastOrder)) {
                                    acc[res.customerEmail].lastOrder = res.createdAt;
                                  }
                                  return acc;
                                }, {} as Record<string, {name: string, orders: number, totalSpent: number, lastOrder: string}>);

                                const exportData = Object.entries(customerData).map(([email, data]) => ({
                                  'Jméno zákazníka': data.name,
                                  'Email': email,
                                  'Počet objednávek': data.orders,
                                  'Celkové utraceno': data.totalSpent,
                                  'Průměrná objednávka': Math.round(data.totalSpent / data.orders),
                                  'Poslední objednávka': formatDate(data.lastOrder)
                                }));
                                exportToCSV(exportData, 'analyza_zakazniku');
                              }}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-2"
                            >
                              <FileDown className="h-4 w-4" />
                              Export CSV
                            </Button>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            {(() => {
                              const customerData = filteredReservations.reduce((acc, res) => {
                                if (!acc[res.customerEmail]) {
                                  acc[res.customerEmail] = {
                                    name: res.customerName,
                                    orders: 0,
                                    totalSpent: 0,
                                    lastOrder: res.createdAt
                                  };
                                }
                                acc[res.customerEmail].orders += 1;
                                acc[res.customerEmail].totalSpent += res.totalPrice;
                                if (new Date(res.createdAt) > new Date(acc[res.customerEmail].lastOrder)) {
                                  acc[res.customerEmail].lastOrder = res.createdAt;
                                }
                                return acc;
                              }, {} as Record<string, {name: string, orders: number, totalSpent: number, lastOrder: string}>);

                              return Object.entries(customerData)
                                .sort(([,a], [,b]) => b.totalSpent - a.totalSpent)
                                .slice(0, 10)
                                .map(([email, data]) => (
                                  <div key={email} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                    <div>
                                      <span className="font-medium">{data.name}</span>
                                      <div className="text-sm text-gray-600">{email}</div>
                                    </div>
                                    <div className="text-right">
                                      <div className="font-semibold">{formatPrice(data.totalSpent)}</div>
                                      <div className="text-sm text-gray-600">
                                        {data.orders} objednávek
                                      </div>
                                    </div>
                                  </div>
                                ));
                            })()}
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  );
                })()}
              </div>
            )}






          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}