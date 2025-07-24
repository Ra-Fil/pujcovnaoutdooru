import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Home from "@/pages/home";
import Equipment from "@/pages/equipment";
import Locations from "@/pages/locations";
import About from "@/pages/about";
import Cart from "@/pages/cart";
import Admin from "@/pages/admin";
import Login from "@/pages/login";
import Contact from "@/pages/contact";
import Terms from "@/pages/terms";
import UsefulInfo from "@/pages/useful-info";
import NotFound from "@/pages/not-found";
import ProtectedRoute from "@/components/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/vybaveni" component={Equipment} />
      <Route path="/mista" component={Locations} />
      <Route path="/o-nas" component={About} />
      <Route path="/cart" component={Cart} />
      <Route path="/login" component={Login} />
      <Route path="/admin">
        <ProtectedRoute>
          <Admin />
        </ProtectedRoute>
      </Route>
      <Route path="/kontakt" component={Contact} />
      <Route path="/obchodni-podminky" component={Terms} />
      <Route path="/uzitecne-informace" component={UsefulInfo} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
