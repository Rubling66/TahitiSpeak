'use client';

import React from 'react';
import { Search, Eye, EyeOff } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  variant?: 'default' | 'search';
  ariaLabel?: string;
  ariaDescribedBy?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  variant = 'default',
  className = '',
  type = 'text',
  ariaLabel,
  ariaDescribedBy,
  ...props
}) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [inputType, setInputType] = React.useState(type);
  
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperTextId = helperText ? `${inputId}-helper` : undefined;
  const describedBy = [ariaDescribedBy, errorId, helperTextId].filter(Boolean).join(' ') || undefined;
  
  React.useEffect(() => {
    if (type === 'password') {
      setInputType(showPassword ? 'text' : 'password');
    } else {
      setInputType(type);
    }
  }, [type, showPassword]);
  
  const baseClasses = 'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-0 transition-colors';
  const errorClasses = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
    : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';
  
  const searchClasses = variant === 'search'
    ? 'pl-10'
    : leftIcon
    ? 'pl-10'
    : '';
  
  const rightPaddingClasses = rightIcon || type === 'password' ? 'pr-10' : '';
  
  const inputClasses = `${baseClasses} ${errorClasses} ${searchClasses} ${rightPaddingClasses} ${className}`;
  
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {props.required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
        </label>
      )}
      
      <div className="relative">
        {(variant === 'search' || leftIcon) && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            {variant === 'search' ? (
              <Search className="h-4 w-4 text-gray-400" />
            ) : (
              leftIcon
            )}
          </div>
        )}
        
        <input
          id={inputId}
          type={inputType}
          className={inputClasses}
          aria-label={ariaLabel || label}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : 'false'}
          aria-required={props.required}
          {...props}
        />
        
        {(rightIcon || type === 'password') && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            {type === 'password' ? (
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            ) : (
              rightIcon
            )}
          </div>
        )}
      </div>
      
      {error && (
        <p id={errorId} className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p id={helperTextId} className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Input;