import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SEOHead, { SEOConfigs } from "@/components/seo-head";
import { Card, CardContent } from "@/components/ui/card";
import { Mountain, Shield, Users, Award } from "lucide-react";
import type { CartItem } from "@shared/schema";

export default function About() {
  const [, setLocation] = useLocation();
  const [cartItemCount, setCartItemCount] = useState(0);

  // Načíst počet položek z košíku
  useEffect(() => {
    const saved = localStorage.getItem("cartItems");
    if (saved) {
      const cartItems: CartItem[] = JSON.parse(saved);
      setCartItemCount(cartItems.length);
    }
  }, []);

  const handleCartClick = () => {
    setLocation("/cart");
  };

  return (
    <div className="min-h-screen bg-neutral-light">
      <SEOHead {...SEOConfigs.about} />
      <Header cartItemCount={cartItemCount} onCartClick={handleCartClick} />

      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-neutral-dark text-center mb-12">
            O nás
          </h1>

          <div className="prose prose-lg mx-auto text-gray-600 mb-12 text-center">
            <p className="text-xl leading-relaxed mb-8">
              Kvalitní oudoorové vybavení dostupné každému od renomovaných
              značek.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            <Card className="shadow-lg">
              <CardContent className="p-8 text-center">
                <Mountain className="text-primary text-4xl mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-dark mb-4">
                  Specializace
                </h3>
                <p className="text-gray-600">
                  Ferratové, trekingové a horolezecké vybavení.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-8 text-center">
                <Shield className="text-primary text-4xl mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-dark mb-4">
                  Bezpečnost
                </h3>
                <p className="text-gray-600">
                  Všechno vybavení pravidelně kontrolujeme a servisujeme, aby
                  splňovalo nejvyšší bezpečnostní standardy.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-8 text-center">
                <Users className="text-primary text-4xl mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-dark mb-4">
                  Náš tým
                </h3>
                <p className="text-gray-600">
                  Náš tým tvoří zkušení horolezci a turisté s dlouholetými
                  zkušenostmi z českých i zahraničních hor.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-8 text-center">
                <Award className="text-primary text-4xl mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-neutral-dark mb-4"></h3>
                <p className="text-gray-600">
                  Nabízíme vybavení od ověřených značek, které sám používám při
                  outdoorových aktivitách.
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="shadow-lg bg-primary/5">
            <CardContent className="p-8 text-center">
              <div className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-neutral-dark font-semibold">
                  Máte otázky? Neváhejte mě kontaktovat - rád poradím s výběrem
                  vhodného vybavení pro vaše dobrodružství.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
