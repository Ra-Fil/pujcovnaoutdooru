import { Button } from "@/components/ui/button";

interface HeroBannerProps {
  onScrollToEquipment: () => void;
}

export default function HeroBanner({ onScrollToEquipment }: HeroBannerProps) {
  return (
    <section className="relative h-96 overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: "url('/uploads/Banner-pujcovna-outdooru-1.jpg')",
        }}
      />
      <div className="absolute inset-0 bg-black bg-opacity-40" />
      <div className="relative h-full flex items-center justify-center">
        <div className="text-center text-white px-4">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Půjčte si outdoorové vybavení
          </h1>
           {/* Logo <p className="text-xl md:text-2xl mb-8">
            Kvalitní vybavení pro vaše dobrodružství v přírodě
          </p>*/}
          <p className="text-xl md:text-3xl font-bold mb-2 mb-8">
            BRNO | OLOMOUC | BÍLOVICE NAD SVITAVOU
          </p>
          <Button
            onClick={() => (window.location.href = "/vybaveni")}
            className="bg-accent hover:bg-accent/90 text-white font-semibold py-3 px-8 rounded-lg"
            size="lg"
          >
            Prohlédnout vybavení
          </Button>
          
        </div>
      </div>
    </section>
  );
}
