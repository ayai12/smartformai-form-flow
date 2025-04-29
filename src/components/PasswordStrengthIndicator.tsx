import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordRequirement {
  label: string;
  isMet: boolean;
}

interface PasswordStrengthIndicatorProps {
  password: string;
}

export const PasswordStrengthIndicator = ({ password }: PasswordStrengthIndicatorProps) => {
  const requirements: PasswordRequirement[] = [
    { label: "At least 8 characters", isMet: password.length >= 8 },
    { label: "Contains uppercase letter", isMet: /[A-Z]/.test(password) },
    { label: "Contains lowercase letter", isMet: /[a-z]/.test(password) },
    { label: "Contains number", isMet: /[0-9]/.test(password) },
    { label: "Contains special character", isMet: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ];

  return (
    <div className="mt-2 space-y-2">
      {requirements.map((requirement, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          {requirement.isMet ? (
            <Check className="h-4 w-4 text-green-500" />
          ) : (
            <X className="h-4 w-4 text-gray-300" />
          )}
          <span className={cn(
            requirement.isMet ? "text-green-500" : "text-gray-500"
          )}>
            {requirement.label}
          </span>
        </div>
      ))}
    </div>
  );
}; 