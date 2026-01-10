import { Link } from "wouter";
import { Facebook } from "lucide-react";

export default function Footer() {
  // Funkce pro scrolování nahoru po kliknutí na odkaz v patičce
  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  return (
    <footer className="bg-gray-900 text-white py-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pl-6 md:pl-0">
          {/* Logo a kontakt - levá strana */}
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-start space-x-2">
              <span className="text-lg font-semibold relative mt-5 pb-[17px] mb-[12px] text-[1.3em] font-bold before:content-[''] before:h-[1.5px] before:bg-[#125d58] before:absolute before:bottom-0 before:left-0 before:w-[50px]">Pujcovnaoutdooru.cz</span>
            </div>
            <div className="text-sm text-gray-300 space-y-1">
              <p>Půjčovna outdoorového vybavení</p>
              <p>Brno | Olomouc | Bílovice nad Svitavou</p>
              <p>
                <a href="mailto:pujcovnaoutdooru@gmail.com" className="hover:text-white transition-colors">
                  pujcovnaoutdooru@gmail.com
                </a>
              </p>
              <p>
                <a href="tel:+420606476399" className="hover:text-white transition-colors">
                  +420 606 476 399
                </a>
              </p>
            </div>
          </div>

          {/* Odkazy - střed */}
          <div className="flex flex-col md:items-center md:text-center items-start text-left space-y-4">
            <h3 className="text-lg font-semibold relative mt-5 pb-[17px] mb-[12px] text-[1.3em] font-bold before:content-[''] before:h-[1.5px] before:bg-[#125d58] before:absolute before:bottom-0 before:left-0 before:w-[50px] ">Užitečné odkazy</h3>
            <nav className="flex flex-col items-start space-y-2 text-sm">
              <Link href="/obchodni-podminky" className="text-gray-300 hover:text-white transition-colors" onClick={handleLinkClick}>
                Obchodní podmínky
              </Link>
              <Link href="/gdpr" className="text-gray-300 hover:text-white transition-colors" onClick={handleLinkClick}>
                GDPR
              </Link>
              <Link href="/uzitecne-informace" className="text-gray-300 hover:text-white transition-colors" onClick={handleLinkClick}>
                Užitečné informace
              </Link>
              <Link href="/kontakt" className="text-gray-300 hover:text-white transition-colors" onClick={handleLinkClick}>
                Kontakt
              </Link>
            </nav>
          </div>

          {/* Facebook - pravá strana */}
          <div className="flex flex-col items-start md:items-end space-y-4">
            <h3 className="text-lg font-semibold relative mt-5 pb-[17px] mb-[12px] text-[1.3em] font-bold before:content-[''] before:h-[1.5px] before:bg-[#125d58] before:absolute before:bottom-0 before:left-0 before:w-[50px]">Sledujte nás</h3>
            <a
              href="https://www.facebook.com/pujcovnaoutdooru/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
            >
              <Facebook className="h-6 w-6" />
              <span>Facebook</span>
            </a>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-sm text-gray-400">
          <p>&copy; {new Date().getFullYear()} Pujcovnaoutdooru.cz</p>
        </div>
      </div>
    </footer>
  );
}
