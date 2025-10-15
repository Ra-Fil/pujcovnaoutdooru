import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SEOHead, { SEOConfigs } from "@/components/seo-head";
import type { CartItem } from "@shared/schema";

export default function Contact() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('cartItems');
    if (saved) {
      setCartItems(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SEOHead {...SEOConfigs.contact} />
      <Header cartItemCount={cartItems.length} />
      
      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">Kontakt</h1>       

            {/* Kontakt */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Rezervace, změny a dotazy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  <div>
                    <p>pujcovnaoutdooru@gmail.com</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  <div>
                    <p>+420 606 476 399</p>
                  </div>
                </div>

                <div>
                  <p className="text-gray-600">
                    POZOR - namám kamennou pobočku! Než vyrazíš pro vybavení, zavolej mi prosím předem 
                    a domluvíme se na předání. Pro kontrolu dostupnosti a rychlé vyřízení objednávky můžeš využít online 
                    rezervační systém a já se Ti ozvu. Rezervace je možné zrušit nejpozději 
                    48 hodin před plánovaným vyzvednutím.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Fakturační údaje</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div>
                    <p>Jan Rücker</p>
                    <p>17. listopadu 1215/2b </p>
                    <p>771 47 Olomouc</p>
                    <p>IČ: 02938316</p>
                    <p>Nejsem plátce DPH</p>
                  </div>
                </div>

              </CardContent>
            </Card>
            
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
