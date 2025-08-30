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
              GDPR
            </h1>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                    <CardTitle>1. Základní ustanovení</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p> Jan Rücker, se sídlem: 17. listopadu 1215/2b, 771 47 Olomouc, IČ 02938316, email: 
                        pujcovnaoutdooru@gmail.com, (dále jen <strong>„pronajímatel“</strong>) zpracovává ve smyslu 
                        nařízení Evropského parlamentu a Rady (EU) č. 2016/679 o ochraně fyzických osob v souvislosti 
                        se zpracováním osobních údajů a o volném pohybu těchto údajů a o zrušení směrnice 95/46/ES 
                        (obecné nařízení o ochraně osobních údajů)(dále jen <strong>„Nařízení“</strong>), následující osobní údaje: 
                        jméno, příjmením, e-mailovou adresu, telefonní číslo, adresu
                    </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                   <CardTitle>2.</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p> Výše uvedené osobní údaje je nutné zpracovat pro odbavení objednávek a další plnění 
                        ze smlouvy, pokud mezi vámi a prodávajícím dojde k uzavření kupní smlouvy. Takové 
                        zpracování osobních údajů umožňuje čl. 6 odst. 1 písm. b) Nařízení – zpracování je 
                        nezbytné pro splnění smlouvy.
                    </p><p>
                        Prodávající zpracovává tyto údaje rovněž za účelem evidence smlouvy a případného budoucího 
                        uplatnění a obranu práv a povinností smluvních stran. Uchování a zpracování osobních údajů 
                        je za výše uvedeným účelem po dobu 3 let od realizace poslední části plnění dle smlouvy, 
                        nepožaduje-li jiný právní předpis uchování smluvní dokumentace po dobu delší. Takové 
                        zpracování je možné na základě čl. 6 odst. 1 písm. c) a f) Nařízení – zpracování je nezbytné 
                        pro splnění právní povinnosti a pro účely oprávněných zájmů správce.
                    </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle>3.</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p> Na e-mailovou adresu mohou být kupujícímu zasílány novinky a jiná obchodní sdělení, 
                        tento postup umožňuje § 7 odst. 3 zákona č.480/2004 Sb., o službách informační společnosti, 
                        pokud jej kupující neodmítne. Tato sdělení lze kdykoliv jakýmkoliv způsobem – například 
                        zasláním e-mailu nebo proklikem na odkaz v obchodním sdělení – odhlásit.
                    </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle>4.</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p> Zpracování osobních údajů je prováděno Janem Rückerem. Osobní údaje pro tohoto správce 
                        zpracovávají také zpracovatelé:
                    </p>
                    <li>Google Czech Republic, s.r.o., IČ: 27604977, se sídlem Stroupežnického 3191/17, 150 00 
                        Praha 5,
                    </li>
                    <p> Vaše osobní údaje si ponechávám po dobu běhu promlčecích lhůt, pokud zákon nestanoví 
                        delší dobu k jejich uchování nebo jsme v konkrétních případech neuvedli jinak.
                    </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle>5.</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p> Správce osobních údajů, jakožto provozovatel webové stránky www.pujcovnaoutdooru.cz, užívá 
                        na této webové stránce soubory cookies, které jsou zde užity za účelem: měření návštěvnosti 
                        webových stránek a vytváření statistik týkající se návštěvnosti a chování návštěvníků na 
                        webových stránkách a základní funkčnosti webových stránek.
                    </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                    <CardTitle>6.</CardTitle>                    
                </CardHeader>
                <CardContent className="space-y-4">
                    <p>Ukládání cookies můžete kdykoli odmítnout nebo nastavit prostřednictvím Vašeho 
                       internetového prohlížeče. V případě odmítnutí nezbytných cookies nemusí být některé 
                       funkce webu dostupné nebo mohou být omezené.
                    </p>
                    <p>
                       Tyto podmínky nabývají účinnosti dnem 20.9.2018.
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