
import React from 'react';

interface ControlButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger';
}

const ControlButton: React.FC<ControlButtonProps> = ({ children, variant = 'primary', className, ...props }) => {
  const baseClasses = 'px-6 py-3 rounded-lg font-bold text-lg transition-all duration-300 transform active:scale-95 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-primary';

  const variantClasses = {
    primary: 'bg-highlight text-primary hover:bg-teal-300 focus:ring-highlight',
    secondary: 'bg-accent text-text-main hover:bg-gray-600 focus:ring-accent',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-600',
  };

  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

export default ControlButton;
