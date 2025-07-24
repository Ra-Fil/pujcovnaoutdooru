import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Info,
  AlertTriangle,
  CheckCircle,
  Mountain,
  Backpack,
  Shield,
} from "lucide-react";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SEOHead, { SEOConfigs } from "@/components/seo-head";

export default function UsefulInfo() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SEOHead {...SEOConfigs.usefulInfo} />
      <Header cartItemCount={0} />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">
              Užitečné informace
            </h1>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Často kladené otázky</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="font-bold">
                      Můžu vybavení vrátit na jiném místě než si jej vyzvednu?
                    </p>
                    <p>
                      Ano, vybavení můžete vrátit/vyzvednout po domluvě v Brně,
                      Bílovicích nad Svitavou, Olomouci nebo po domluvě
                      přepravní službou na své náklady.
                    </p>
                  </div>

                  <div>
                    <p className="font-bold">Co když se mi změní plány?</p>
                    <p>
                      Rezervaci můžete zrušit nejpozději 48 hodin před
                      vyzvednutím bez poplatku. Stačí mi poslat sms, email nebo
                      zavolat číslo objednávky.
                    </p>
                  </div>

                  <div>
                    <p className="font-bold">
                      Poskytuješ slevu při dlouhodobém vypůjčení vybavení nebo
                      většího množství?
                    </p>
                    <p>
                      Jasně! Pokud si chceš vypůjčit vybavení dlouhodobě nebo
                      pro více lidí, napiš nebo zavolej a dohodneme se
                      individuálně.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Péče o půjčené vybavení</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    <strong>Čištění:</strong> Vybavení vraťte prosím čisté a
                    suché.
                  </p>
                  <p>
                    <strong>Skladování:</strong> Během půjčování skladujte
                    vybavení na suchém místě, chraňte před přímým slunečním
                    zářením a extrémními teplotami.
                  </p>
                  <p>
                    <strong>Poškození:</strong> Poškození vybavení mi prosím
                    nahlaste co nejdříve (sms, email, telefon).
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Backpack className="h-5 w-5" />
                    Krosny na nošení dětí
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Krosny jsou vhodné pro děti, které už umí samy sedět do cca
                    4 let (maximální váha 22 kg). Zvažte své síly a kolik jste
                    schopni sami unést :)
                  </p>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-1" />
                      <div>
                        <p className="font-medium text-green-900">
                          <strong>Příslušenství:</strong>
                        </p>
                        <div className="text-green-800">
                          <p>
                            Osprey POCO:m pláštěnka, stříška
                          </p>
                          <p>
                            Corazon Panda: pláštěnka, stříška proti slunci
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Bezpečnostní pokyny
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-1" />
                      <div>
                        <p className="font-medium text-yellow-900">
                          Důležité upozornění:
                        </p>
                        <p className="text-yellow-800">
                          Všechno vybavení používejte pouze po seznámení se s
                          návody k použití výrobce a v souladu s bezpečnostními
                          pokyny výrobce.
                        </p>
                      </div>
                    </div>
                  </div>

                  <ul className="space-y-2 list-disc list-inside">
                    <li>Před každým použitím zkontrolujte stav vybavení.</li>
                    <li>Nepoužívejte poškozené vybavení.</li>
                    <li>Dodržujte maximální povolenou zátěž.</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
