import React from 'react';
import { LucideIcon } from 'lucide-react';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  icon?: LucideIcon;
  variant?: 'primary' | 'secondary';
}

export default function GradientButton({ 
  children, 
  icon: Icon, 
  variant = 'primary', 
  className = '', 
  ...props 
}: GradientButtonProps) {
  
  const baseStyles = "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 hover:scale-[1.02] active:scale-[0.98]",
    secondary: "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98]"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      {children}
    </button>
  );
}