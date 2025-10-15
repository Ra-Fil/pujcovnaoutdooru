import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Header from "@/components/header";
import Footer from "@/components/footer";
import SEOHead, { SEOConfigs } from "@/components/seo-head";
import type { CartItem } from "@shared/schema";

export default function Terms() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem("cartItems");
    if (saved) {
      setCartItems(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SEOHead {...SEOConfigs.terms} />
      <Header cartItemCount={cartItems.length} />

      <main className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-8">
              Obchodní podmínky
            </h1>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>1. Základní ustanovení</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Tyto obchodní podmínky upravují práva a povinnosti smluvních
                    stran při půjčování outdoorového vybavení prostřednictvím
                    služby pujcovnaoutdooru.cz.
                  </p>
                  <p>
                    <strong>Pronajímatel:</strong> Jan Rücker, 17. listopadu
                    1215/2b, 771 47 Olomouc
                    <br />
                    <strong>IČ:</strong> 02938316, Nejsem plátce DPH
                  </p>
                  <p>
                    <strong>Email:</strong>{" "}
                    <a href="mailto:pujcovnaoutdooru@gmail.com">
                      honza@pujcovnaoutdooru.cz
                    </a>
                    <br />
                    <strong>Telefon:</strong>{" "}
                    <a href="tel:+420734415950">+420 606 476 399</a>
                    <br />
                  </p>

                  <p>
                    Pronajímatel pronajímá vybavení na pujcovnaoutdooru.cz a
                    nájemce se zavazuje vypůjčené vybavení užívat za účelem a
                    způsobem, kterým se věc obvykle užívá vzhledem ke své povaze
                    a svému určení. Obě smluvní strany prohlašují, že věc je
                    předávána a přebírána ve stavu způsobilém k obvyklému
                    užívání.
                  </p>
                  <p>
                    Nájemní smlouva se uzavírá na dobu určitou, uvedenou v
                    nájemní smlouvě. Nájemce se zavazuje uhradit částku za nájem
                    věci uvedenou v nájemní smlouvě. Nájemné je splatné předem,
                    nejpozději na místě v den uzavřeni smlouvy.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>2. Rezervace a půjčování</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    <strong>Rezervace:</strong> Vybavení je možné rezervovat
                    online odesláním formuláře, emailem nebo telefonicky.
                    Rezervace je závazná po jejím potvrzení ze strany
                    pronajímatele a zaplacení zálohy.
                  </p>
                  <p>
                    <strong>Vyzvednutí:</strong> Vybavení je možné vyzvednout po
                    domluvě v Brně, Bílovicích nad Svitavou, Olomouci nebo na
                    jiném smluveném místě. Při vyzvednutí je nutné předložit
                    platný doklad totožnosti, zaplatit zálohu a podepsat nájemní
                    smlouvu.
                  </p>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
                    <p className="text-sm text-blue-700 mb-2">
                      <strong>Vzorová smlouva ke stažení:</strong>
                    </p>
                    <a
                      href="/uploads/Pujcovnaoutdooru - vzorová smlouva.pdf"
                      download="Pujcovnaoutdooru - vzorová smlouva.pdf"
                      className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7,10 12,15 17,10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Stáhnout vzorovou nájemní smlouvu (PDF)
                    </a>
                  </div>

                  <p>
                    Smlouva o pronájmu nabývá platnosti dnem převzetí věci
                    nájemcem. Smlouva o pronájmu bude je vypracována ve dvou
                    stejnopisech, z nichž pronajímatel i nájemce obdrží každý po
                    jednom stejnopise.
                  </p>

                  <p>
                    Reklamace vad vybavení je možné uplatnit nejpozději při
                    vyzvednutí. Nájemce nesmí dát zboží do nájmu třetí osobě a
                    není oprávněn na něm provádět žádné změny.
                  </p>

                  <p>
                    Nájemce se zavazuje, že se bude o předmět nájemní smlouvy
                    (věci) řádně starat a užívat jej tak, aby nedošlo k jeho
                    poškození, zničení, ztrátě nebo k nepřiměřenému opotřebení.{" "}
                    <br />
                  </p>

                  <p>
                    V případě jakékoliv ztráty nebo úplného zničení věci v
                    stanovené době nájmu se nájemce zavazuje uhradit
                    pronajímateli hodnotu věci dle této smlouvy. <br />
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>3. Ceny a platební podmínky</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    <strong>Půjčovné:</strong> Cena půjčovného se účtuje za
                    kalendářní dny, včetně dnů vyzvednutí i vrácení.
                  </p>
                  <p>
                    <strong>Záloha:</strong> Při vyzvednutí vybavení je nutné
                    složit zálohu (převodem na účet nebo hotově při vyzvednutí),
                    která je vrácena při řádném vrácení nepoškozeného vybavení.
                  </p>
                  <p>
                    <strong>Platba:</strong> Půjčovné je splatné při vyzvednutí
                    vybavení. Přijímám hotovost, platbu QR kódem nebo bankovním
                    převodem.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>4. Odpovědnost </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    <strong>Odpovědnost nájemce:</strong> Nájemce odpovídá za
                    škody způsobené na půjčeném vybavení během doby půjčování až
                    do výše jeho nové hodnoty. V případě ztráty nebo odcizení
                    vybavení je nájemce povinen uhradit jeho plnou novou
                    hodnotu. Konkrétní částka bude stanovena při převzetí věci
                    pronajímatelem.
                  </p>
                  <p>
                    Pronajímatel nenese zodpovědnoost za škody a způsob použití
                    vybavení.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>5. Storno podmínky</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    <strong>Zrušení rezervace:</strong> Rezervaci je možné
                    zrušit nejpozději 48 hodin před plánovaným vyzvednutím bez
                    storno poplatku.
                  </p>
                  <p>
                    <strong>Storno poplatky:</strong> Při zrušení rezervace méně
                    než 48 hodin před vyzvednutím se účtuje storno poplatek ve
                    výši 50% půjčovného.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>6. Vrácení</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    <strong>Vrácení:</strong> Vybavení musí být vráceno
                    nejpozději do konce posledního dne půjčovného v čistém a
                    nepoškozením stavu. V případě poškození zboží mě prosím co
                    nejdříve kontaktujte emailem, telefonicky nebo sms. Vrátí-li
                    nájemce zboží po době dohodnuté v nájemní smlouvě, popřípadě
                    po uplynutí výpovědní lhůty, je povinen hradit nájemné až do
                    vrácení zboží a navíc uhradit poplatek z prodlení ve výši
                    denní sazby nájemného za každý den prodlení. V případě
                    ztráty nebo zničení zboží, stíhají tyto povinnosti nájemce
                    až do doby, kdy zničení nebo ztrátu zboží pronajímateli
                    písemně nahlásí.
                  </p>
                  <p>
                    Při vrácení zboží před dohodnutým termínem se nájemné
                    nevrací.
                  </p>
                  <p>
                    Při vrácení věci pronajímateli je nájemce povinen předložit
                    pronajímateli stejnopis nájemní smlouvy, na kterém bude
                    potvrzeno vrácení zboží a jeho stav.
                  </p>

                  <p>
                    <strong>Smlouva zaniká: </strong>
                    <ul className="list-disc list-inside">
                      <li>Navrácením zboží.</li>
                      <li>Písemně, dohodou obou smluvních stran.</li>
                      <li>
                      Uplynutím výpovědní lhůty na základě písemné výpovědi z
                      jakéhokoliv důvodu. Výpovědní lhůta se sjednává
                      desetidenní a začíná běžet od následujícího dne po
                      doručení výpovědi druhé smluvní straně. Ustanovení dle
                      §676,odstavce 2, Občanského zákoníku se neužije.
                      </li>
                    </ul>
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>7. Závěrečná ustanovení</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p>
                    Tyto obchodní podmínky nabývají účinnosti dnem 1. 1. 2025 a
                    nahrazují všechny předchozí verze.
                  </p>
                  <p>
                    Vztahy neupravené těmito obchodními podmínkami se řídí
                    právním řádem České republiky.
                  </p>
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
