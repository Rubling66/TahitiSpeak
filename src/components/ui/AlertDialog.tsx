'use client';

import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

interface AlertDialogContextType {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AlertDialogContext = createContext<AlertDialogContextType | undefined>(undefined);

interface AlertDialogProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  children,
  open: controlledOpen,
  onOpenChange
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  
  const handleOpenChange = (newOpen: boolean) => {
    if (controlledOpen === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <AlertDialogContext.Provider value={{ open, onOpenChange: handleOpenChange }}>
      {children}
    </AlertDialogContext.Provider>
  );
};

interface AlertDialogTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
  className?: string;
}

const AlertDialogTrigger: React.FC<AlertDialogTriggerProps> = ({
  children,
  asChild = false,
  className
}) => {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error('AlertDialogTrigger must be used within AlertDialog');
  }

  const { onOpenChange } = context;

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      onClick: () => onOpenChange(true),
      className: cn(children.props.className, className)
    });
  }

  return (
    <button
      type="button"
      onClick={() => onOpenChange(true)}
      className={className}
    >
      {children}
    </button>
  );
};

interface AlertDialogContentProps {
  children: React.ReactNode;
  className?: string;
}

const AlertDialogContent: React.FC<AlertDialogContentProps> = ({
  children,
  className
}) => {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error('AlertDialogContent must be used within AlertDialog');
  }

  const { open, onOpenChange } = context;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      
      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={cn(
            'relative w-full max-w-lg rounded-lg bg-white p-6 shadow-lg',
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );
};

interface AlertDialogHeaderProps {
  children: React.ReactNode;
  className?: string;
}

const AlertDialogHeader: React.FC<AlertDialogHeaderProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)}>
      {children}
    </div>
  );
};

interface AlertDialogTitleProps {
  children: React.ReactNode;
  className?: string;
}

const AlertDialogTitle: React.FC<AlertDialogTitleProps> = ({
  children,
  className
}) => {
  return (
    <h2 className={cn('text-lg font-semibold', className)}>
      {children}
    </h2>
  );
};

interface AlertDialogDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

const AlertDialogDescription: React.FC<AlertDialogDescriptionProps> = ({
  children,
  className
}) => {
  return (
    <p className={cn('text-sm text-gray-500', className)}>
      {children}
    </p>
  );
};

interface AlertDialogFooterProps {
  children: React.ReactNode;
  className?: string;
}

const AlertDialogFooter: React.FC<AlertDialogFooterProps> = ({
  children,
  className
}) => {
  return (
    <div className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}>
      {children}
    </div>
  );
};

interface AlertDialogActionProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const AlertDialogAction: React.FC<AlertDialogActionProps> = ({
  children,
  className,
  onClick
}) => {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error('AlertDialogAction must be used within AlertDialog');
  }

  const { onOpenChange } = context;

  const handleClick = () => {
    onClick?.();
    onOpenChange(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'inline-flex h-10 items-center justify-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
    >
      {children}
    </button>
  );
};

interface AlertDialogCancelProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

const AlertDialogCancel: React.FC<AlertDialogCancelProps> = ({
  children,
  className,
  onClick
}) => {
  const context = useContext(AlertDialogContext);
  if (!context) {
    throw new Error('AlertDialogCancel must be used within AlertDialog');
  }

  const { onOpenChange } = context;

  const handleClick = () => {
    onClick?.();
    onOpenChange(false);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'mt-2 inline-flex h-10 items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 sm:mt-0',
        className
      )}
    >
      {children}
    </button>
  );
};

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
};