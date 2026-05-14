
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
}

const Button: React.FC<ButtonProps> = ({ children, className, variant = 'primary', ...props }) => {
  const baseClasses = 'inline-flex items-center justify-center px-4 py-2 border text-sm font-semibold rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-green-500 text-black font-bold border-green-500 hover:bg-green-400 focus:ring-green-400',
    secondary: 'bg-transparent text-green-400 border-green-700 hover:bg-green-900/50 focus:ring-green-600',
    outline: 'bg-transparent text-green-500 border-green-600 hover:bg-green-500 hover:text-black focus:ring-green-500',
    danger: 'bg-red-600 text-white font-bold border-red-600 hover:bg-red-500 focus:ring-red-500'
  };

  return (
    <button
      type="button"
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;