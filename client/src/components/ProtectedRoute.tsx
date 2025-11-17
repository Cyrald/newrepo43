import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuthStore } from "@/stores/authStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const [, setLocation] = useLocation();
  const authInitialized = useAuthStore((state) => state.authInitialized);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (authInitialized && !isAuthenticated) {
      const currentPath = window.location.pathname;
      setLocation(`/login?returnUrl=${encodeURIComponent(currentPath)}`);
    }
  }, [authInitialized, isAuthenticated, setLocation]);

  if (!authInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (roles && roles.length > 0) {
    const userRoles = user?.roles || [];
    const hasRequiredRole = roles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Доступ запрещён</h1>
            <p className="text-muted-foreground mb-4">
              У вас нет прав для просмотра этой страницы
            </p>
            <button
              onClick={() => setLocation("/")}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              На главную
            </button>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
