import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { getQueryFn } from "@/lib/queryClient";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  
  const { data: authStatus, isLoading, error } = useQuery({
    queryKey: ["/api/auth/status"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    refetchOnMount: true,
    staleTime: 0, // Always refetch to ensure fresh auth status
  });

  useEffect(() => {
    if (!isLoading && (!authStatus || error)) {
      setLocation("/login");
    }
  }, [authStatus, isLoading, error, setLocation]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Kontrola přihlášení...</p>
        </div>
      </div>
    );
  }

  if (!authStatus || error) {
    return null; // Will redirect to login via useEffect
  }

  return <>{children}</>;
}