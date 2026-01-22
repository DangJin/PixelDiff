import React from 'react';
import { cn } from '../../utils/cn';
import type { LucideIcon } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'filled' | 'outlined' | 'tonal' | 'text';
  icon?: LucideIcon;
  label: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'filled',
  icon: Icon,
  label,
  className,
  ...props
}) => {
  const baseStyles = "relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none overflow-hidden isolate";
  
  const variants = {
    filled: "bg-md-primary text-md-on-primary hover:bg-md-primary/90 shadow-sm hover:shadow-md-1",
    tonal: "bg-md-secondary-container text-md-on-secondary-container hover:bg-md-secondary-container/80",
    outlined: "border border-md-outline text-md-primary hover:bg-md-primary/10 hover:border-md-primary focus:ring-1 focus:ring-md-primary",
    text: "text-md-primary hover:bg-md-primary/10 px-4",
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {/* State Layer (Overlay) - simple implementation via hover colors above, but can be explicit div if needed */}
      {Icon && <Icon size={18} />}
      {label}
    </button>
  );
};

export const IconButton: React.FC<Omit<ButtonProps, 'label'> & { label?: string }> = ({
    variant = 'text',
    icon: Icon,
    className,
    ...props
}) => {
    // Icon button styles
    const baseStyles = "flex items-center justify-center p-2 rounded-full transition-colors disabled:opacity-50";
     const variants = {
        filled: "bg-md-primary text-md-on-primary hover:bg-md-primary/90",
        tonal: "bg-md-secondary-container text-md-on-secondary-container hover:bg-md-secondary-container/80",
        outlined: "border border-md-outline text-md-on-surface-variant",
        text: "text-md-on-surface-variant hover:bg-md-on-surface/10",
      };

    return (
        <button className={cn(baseStyles, variants[variant], className)} {...props}>
             {Icon && <Icon size={24} />}
        </button>
    )
}
