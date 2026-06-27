import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ variant = 'primary', children, className = '', ...props }) => {
  const baseStyles = "px-4 py-2 rounded font-semibold text-sm transition-colors duration-200 flex items-center gap-2";
  
  const variants = {
    primary: "bg-navy-primary text-white hover:bg-opacity-90",
    secondary: "bg-navy-yellow text-navy-primary hover:bg-opacity-90",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-navy-text hover:bg-gray-200"
  };

  return (
    <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};