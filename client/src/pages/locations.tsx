import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SEOHead, { SEOConfigs } from "@/components/seo-head";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { LuPackage } from "react-icons/lu";
import type { CartItem } from "@shared/schema";

export default function Locations() {
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
      <SEOHead {...SEOConfigs.locations} />
      <Header cartItemCount={cartItemCount} onCartClick={handleCartClick} />

      <section className="py-16 bg-neutral-light">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-neutral-dark text-center mb-12">
            Místa výdeje
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="shadow-lg">
              <CardContent className="p-8 text-center">
                <MapPin className="text-primary text-4xl mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-neutral-dark mb-4">
                  Brno
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Vybavení si můžete vyzvednout nebo vrátit v Brně na ulici
                  Štefánikova 551/36a v Korongo boulder clubu, případně na jiném
                  domluveném místě. Nejčastěji se pohybuji v Líšni, takže se
                  můžeme potkat i tam.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-8 text-center">
                <MapPin className="text-primary text-4xl mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-neutral-dark mb-4">
                  Olomouc
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Ideálně předání v okolí Šantovky, případně se domluvíme
                  individuálně podle vašich potřeb.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-8 text-center">
                <MapPin className="text-primary text-4xl mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-neutral-dark mb-4">
                  Bílovice nad Svitavou
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Přesné místo a čas domluvíme individuálně podle vašich potřeb.
                </p>
              </CardContent>
            </Card>

            <Card className="shadow-lg">
              <CardContent className="p-8 text-center">
                <LuPackage className="text-primary text-2xl mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-neutral-dark mb-4">
                  Zásilkovna
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  Po dohodě můžu vybavení doručit/převzít i Zásilkovnou. Je
                  možné kombinovat např. výdej v Brně a vrácení na Zásilkovnu.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="mt-12 text-center">
            <Card className="shadow-lg bg-primary/5">
              <CardContent className="p-8">
                <h3 className="text-xl font-semibold text-neutral-dark mb-4">
                  Důležité informace
                </h3>
                <div className="space-y-3 text-gray-600">
                  <p>
                    • Přesný čas a místo výdeje/vrácení dohodneme individuálně
                    telefonicky nebo emailem – vždy se snažím najít co
                    nejpohodlnější řešení pro obě strany.
                  </p>
                  <p>
                    • Vypůjčení vybavení je možné pouze po potvrzení rezervace a
                    zaplacení zálohy - buď předem nebo při převzetí na místě QR
                    kódem.
                  </p>
                  <p>
                    • Při převzetí budete potřebovat platný doklad totožnosti.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
