import { useState } from "react";
import { Link, useLocation } from "wouter";
import { ShoppingCart, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  cartItemCount: number;
  onCartClick?: () => void;
}

export default function Header({ cartItemCount, onCartClick }: HeaderProps) {
  const [location, setLocation] = useLocation();
  const [isOpen, setIsOpen] = useState(false);

  const handleCartClick = () => {
    if (onCartClick) {
      onCartClick();
    } else {
      setLocation("/cart");
    }
  };

  const navItems = [
    { href: "/vybaveni", label: "Vybavení" },
    { href: "/mista", label: "Místa vyzvednutí" },
  ];

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50 h-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="flex items-center">
              <img 
                src="/uploads/logo-pujcovnaoutdooru-cz.png" 
                alt="Půjčovna outdooru.cz logo" 
                className="h-8 w-auto mr-2"
              />
              <span className="text-xl font-bold text-neutral-dark">Půjčovna outdooru.cz</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`font-medium transition-colors ${
                  location === item.href
                    ? "text-primary"
                    : "text-neutral-dark hover:text-primary"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Cart and Mobile Menu */}
          <div className="flex items-center space-x-4">
            {/* Cart Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCartClick}
              className="relative text-neutral-dark hover:text-primary"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <Badge
                  variant="default"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-accent text-white"
                >
                  {cartItemCount}
                </Badge>
              )}
            </Button>

            {/* Mobile Menu */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <div className="flex flex-col space-y-4 mt-6">
                  {navItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`block py-2 font-medium transition-colors ${
                        location === item.href
                          ? "text-primary"
                          : "text-neutral-dark hover:text-primary"
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
