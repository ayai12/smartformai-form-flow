import { createContext, useContext, useState, useEffect } from 'react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { XCircle, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Define the positions and variant styles
const VARIANT_STYLES = {
  error: {
    bg: 'bg-red-600/90',
    icon: XCircle,
    iconColor: 'text-red-100',
    titleColor: 'text-red-50',
  },
  success: {
    bg: 'bg-green-600/90',
    icon: CheckCircle2,
    iconColor: 'text-green-100',
    titleColor: 'text-green-50',
  },
  warning: {
    bg: 'bg-yellow-600/90',
    icon: AlertCircle,
    iconColor: 'text-yellow-100',
    titleColor: 'text-yellow-50',
  },
};

type AlertType = keyof typeof VARIANT_STYLES;

interface AlertContextType {
  showAlert: (title: string, message: string, type: AlertType) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);
export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) throw new Error('useAlert must be used within AlertProvider');
  return context;
};

let globalId = 0;
export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const [alerts, setAlerts] = useState<
    Array<{ id: number; title: string; message: string; type: AlertType }>
  >([]);

  const showAlert = (title: string, message: string, type: AlertType) => {
    const id = ++globalId;
    setAlerts((prev) => [{ id, title, message, type }, ...prev]);
  };

  const removeAlert = (id: number) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  useEffect(() => {
    if (!alerts.length) return;
    const timers = alerts.map((alert) =>
      setTimeout(() => removeAlert(alert.id), 3000)
    );
    return () => timers.forEach(clearTimeout);
  }, [alerts]);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 w-80">
        {alerts.map(({ id, title, message, type }) => {
          const { bg, icon: Icon, iconColor, titleColor } = VARIANT_STYLES[type];
          return (
            <Alert
              key={id}
              className={`flex items-start ${bg} text-white shadow-lg rounded-2xl backdrop-blur-md p-4 animate-slide-in-down`}
            >
              <Icon className={`h-6 w-6 flex-shrink-0 mr-3 ${iconColor}`} />
              <div className="flex-1">
                <AlertTitle className={`font-semibold text-base ${titleColor}`}>
                  {title}
                </AlertTitle>
                <AlertDescription className="mt-1 text-sm opacity-90">
                  {message}
                </AlertDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeAlert(id)}
                className="ml-2 p-1 hover:bg-white/20 rounded-full"
                aria-label="Close"
              >
                <X className="h-4 w-4 text-white opacity-80" />
              </Button>
            </Alert>
          );
        })}
      </div>
      <style>{`
        @keyframes slide-in-down {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-in-down {
          animation: slide-in-down 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
      `}</style>
      {children}
    </AlertContext.Provider>
  );
};
