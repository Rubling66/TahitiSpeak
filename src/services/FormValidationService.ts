import React from 'react';
import { notificationService } from './NotificationService';
import { logger } from './LoggingService';

export interface ValidationRule {
  name: string;
  validator: (value: unknown, formData?: Record<string, unknown>) => boolean | Promise<boolean>;
  message: string | ((value: unknown, formData?: Record<string, unknown>) => string);
  severity?: 'error' | 'warning' | 'info';
  async?: boolean;
}

export interface FieldValidation {
  field: string;
  rules: ValidationRule[];
  dependencies?: string[]; // Fields that trigger re-validation of this field
  debounceMs?: number;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
  value?: unknown;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  infos: ValidationError[];
  fieldErrors: Record<string, ValidationError[]>;
  hasAsyncValidation: boolean;
}

export interface FormState {
  values: Record<string, unknown>;
  errors: Record<string, ValidationError[]>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  validating: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  hasErrors: boolean;
  hasWarnings: boolean;
  submitCount: number;
}

export interface FormConfig {
  validateOnChange: boolean;
  validateOnBlur: boolean;
  validateOnSubmit: boolean;
  showErrorsOnTouch: boolean;
  showWarningsImmediately: boolean;
  debounceMs: number;
  maxSubmitAttempts: number;
  enableAutoSave: boolean;
  autoSaveDebounceMs: number;
}

// Built-in validation rules
export const ValidationRules = {
  required: (message = 'This field is required'): ValidationRule => ({
    name: 'required',
    validator: (value) => {
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === 'string') return value.trim().length > 0;
      return value != null && value !== '';
    },
    message
  }),

  email: (message = 'Please enter a valid email address'): ValidationRule => ({
    name: 'email',
    validator: (value) => {
      if (!value) return true; // Allow empty unless required
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value);
    },
    message
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    name: 'minLength',
    validator: (value) => {
      if (!value) return true;
      return String(value).length >= min;
    },
    message: message || `Must be at least ${min} characters long`
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    name: 'maxLength',
    validator: (value) => {
      if (!value) return true;
      return String(value).length <= max;
    },
    message: message || `Must be no more than ${max} characters long`
  }),

  pattern: (regex: RegExp, message = 'Invalid format'): ValidationRule => ({
    name: 'pattern',
    validator: (value) => {
      if (!value) return true;
      return regex.test(String(value));
    },
    message
  }),

  numeric: (message = 'Must be a number'): ValidationRule => ({
    name: 'numeric',
    validator: (value) => {
      if (!value) return true;
      return !isNaN(Number(value));
    },
    message
  }),

  min: (min: number, message?: string): ValidationRule => ({
    name: 'min',
    validator: (value) => {
      if (!value) return true;
      return Number(value) >= min;
    },
    message: message || `Must be at least ${min}`
  }),

  max: (max: number, message?: string): ValidationRule => ({
    name: 'max',
    validator: (value) => {
      if (!value) return true;
      return Number(value) <= max;
    },
    message: message || `Must be no more than ${max}`
  }),

  url: (message = 'Please enter a valid URL'): ValidationRule => ({
    name: 'url',
    validator: (value) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message
  }),

  phone: (message = 'Please enter a valid phone number'): ValidationRule => ({
    name: 'phone',
    validator: (value) => {
      if (!value) return true;
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      return phoneRegex.test(value.replace(/[\s\-\(\)]/g, ''));
    },
    message
  }),

  passwordStrength: (message = 'Password must contain at least 8 characters, including uppercase, lowercase, number, and special character'): ValidationRule => ({
    name: 'passwordStrength',
    validator: (value) => {
      if (!value) return true;
      const hasUpper = /[A-Z]/.test(value);
      const hasLower = /[a-z]/.test(value);
      const hasNumber = /\d/.test(value);
      const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
      const hasMinLength = value.length >= 8;
      return hasUpper && hasLower && hasNumber && hasSpecial && hasMinLength;
    },
    message,
    severity: 'warning'
  }),

  confirmPassword: (passwordField = 'password', message = 'Passwords do not match'): ValidationRule => ({
    name: 'confirmPassword',
    validator: (value, formData) => {
      if (!value || !formData) return true;
      return value === formData[passwordField];
    },
    message
  }),

  unique: (checkUnique: (value: unknown) => Promise<boolean>, message = 'This value is already taken'): ValidationRule => ({
    name: 'unique',
    validator: checkUnique,
    message,
    async: true
  }),

  custom: (validator: (value: unknown, formData?: Record<string, unknown>) => boolean | Promise<boolean>, message: string, name = 'custom'): ValidationRule => ({
    name,
    validator,
    message
  })
};

export class FormValidationService {
  private validations: Map<string, FieldValidation> = new Map();
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private asyncValidationCache: Map<string, { value: unknown; result: boolean; timestamp: number }> = new Map();
  private config: FormConfig;

  constructor(config: Partial<FormConfig> = {}) {
    this.config = {
      validateOnChange: true,
      validateOnBlur: true,
      validateOnSubmit: true,
      showErrorsOnTouch: true,
      showWarningsImmediately: false,
      debounceMs: 300,
      maxSubmitAttempts: 3,
      enableAutoSave: false,
      autoSaveDebounceMs: 2000,
      ...config
    };
  }

  // Register field validations
  addField(validation: FieldValidation): void {
    this.validations.set(validation.field, {
      ...validation,
      debounceMs: validation.debounceMs ?? this.config.debounceMs,
      validateOnChange: validation.validateOnChange ?? this.config.validateOnChange,
      validateOnBlur: validation.validateOnBlur ?? this.config.validateOnBlur
    });
  }

  removeField(field: string): void {
    this.validations.delete(field);
    this.clearDebounceTimer(field);
  }

  // Validate a single field
  async validateField(
    field: string,
    value: unknown,
    formData: Record<string, unknown> = {},
    options: { skipAsync?: boolean; useCache?: boolean } = {}
  ): Promise<ValidationError[]> {
    const validation = this.validations.get(field);
    if (!validation) return [];

    const errors: ValidationError[] = [];

    for (const rule of validation.rules) {
      try {
        let isValid: boolean;

        if (rule.async && !options.skipAsync) {
          // Handle async validation with caching
          const cacheKey = `${field}-${rule.name}-${JSON.stringify(value)}`;
          const cached = this.asyncValidationCache.get(cacheKey);
          
          if (options.useCache && cached && Date.now() - cached.timestamp < 60000) {
            isValid = cached.result;
          } else {
            isValid = await rule.validator(value, formData);
            this.asyncValidationCache.set(cacheKey, {
              value,
              result: isValid,
              timestamp: Date.now()
            });
          }
        } else {
          isValid = await rule.validator(value, formData);
        }

        if (!isValid) {
          const message = typeof rule.message === 'function'
            ? rule.message(value, formData)
            : rule.message;

          errors.push({
            field,
            rule: rule.name,
            message,
            severity: rule.severity || 'error',
            value
          });
        }
      } catch (error) {
        logger.error('Validation rule error', {
          field,
          rule: rule.name,
          error: error instanceof Error ? error.message : String(error)
        });

        errors.push({
          field,
          rule: rule.name,
          message: 'Validation error occurred',
          severity: 'error',
          value
        });
      }
    }

    return errors;
  }

  // Validate entire form
  async validateForm(
    formData: Record<string, unknown>,
    options: { skipAsync?: boolean; fields?: string[] } = {}
  ): Promise<ValidationResult> {
    const fieldsToValidate = options.fields || Array.from(this.validations.keys());
    const allErrors: ValidationError[] = [];
    const fieldErrors: Record<string, ValidationError[]> = {};
    let hasAsyncValidation = false;

    // Validate each field
    for (const field of fieldsToValidate) {
      const validation = this.validations.get(field);
      if (!validation) continue;

      if (validation.rules.some(rule => rule.async)) {
        hasAsyncValidation = true;
      }

      const errors = await this.validateField(field, formData[field], formData, options);
      if (errors.length > 0) {
        allErrors.push(...errors);
        fieldErrors[field] = errors;
      }
    }

    // Separate errors by severity
    const errors = allErrors.filter(e => e.severity === 'error');
    const warnings = allErrors.filter(e => e.severity === 'warning');
    const infos = allErrors.filter(e => e.severity === 'info');

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      infos,
      fieldErrors,
      hasAsyncValidation
    };
  }

  // Validate field with debouncing
  validateFieldDebounced(
    field: string,
    value: unknown,
    formData: Record<string, unknown>,
    callback: (errors: ValidationError[]) => void
  ): void {
    const validation = this.validations.get(field);
    if (!validation) {
      callback([]);
      return;
    }

    this.clearDebounceTimer(field);

    const timer = setTimeout(async () => {
      const errors = await this.validateField(field, value, formData);
      callback(errors);
    }, validation.debounceMs);

    this.debounceTimers.set(field, timer);
  }

  // Get dependent fields that should be re-validated
  getDependentFields(changedField: string): string[] {
    const dependents: string[] = [];

    for (const [field, validation] of this.validations) {
      if (validation.dependencies?.includes(changedField)) {
        dependents.push(field);
      }
    }

    return dependents;
  }

  // Clear validation cache
  clearCache(field?: string): void {
    if (field) {
      const keysToDelete = Array.from(this.asyncValidationCache.keys())
        .filter(key => key.startsWith(`${field}-`));
      keysToDelete.forEach(key => this.asyncValidationCache.delete(key));
    } else {
      this.asyncValidationCache.clear();
    }
  }

  // Utility methods
  private clearDebounceTimer(field: string): void {
    const timer = this.debounceTimers.get(field);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(field);
    }
  }

  // Form state management helpers
  createFormState(initialValues: Record<string, unknown> = {}): FormState {
    return {
      values: { ...initialValues },
      errors: {},
      touched: {},
      dirty: {},
      validating: {},
      isSubmitting: false,
      isValid: true,
      hasErrors: false,
      hasWarnings: false,
      submitCount: 0
    };
  }

  updateFormState(
    state: FormState,
    updates: Partial<FormState>
  ): FormState {
    const newState = { ...state, ...updates };
    
    // Update computed properties
    newState.hasErrors = Object.values(newState.errors).some(errors => 
      errors.some(e => e.severity === 'error')
    );
    newState.hasWarnings = Object.values(newState.errors).some(errors => 
      errors.some(e => e.severity === 'warning')
    );
    newState.isValid = !newState.hasErrors;

    return newState;
  }

  // Error formatting and display helpers
  formatErrorMessage(error: ValidationError): string {
    return error.message;
  }

  getFieldErrorMessage(fieldErrors: ValidationError[]): string {
    const errors = fieldErrors.filter(e => e.severity === 'error');
    return errors.length > 0 ? errors[0].message : '';
  }

  getFieldWarningMessage(fieldErrors: ValidationError[]): string {
    const warnings = fieldErrors.filter(e => e.severity === 'warning');
    return warnings.length > 0 ? warnings[0].message : '';
  }

  // Form submission helpers
  async handleFormSubmit(
    formData: Record<string, unknown>,
    onSubmit: (data: Record<string, unknown>) => Promise<void>,
    onError?: (errors: ValidationError[]) => void
  ): Promise<boolean> {
    try {
      const validation = await this.validateForm(formData);
      
      if (!validation.isValid) {
        // Show validation errors
        this.showValidationErrors(validation.errors);
        onError?.(validation.errors);
        return false;
      }

      // Show warnings but allow submission
      if (validation.warnings.length > 0) {
        this.showValidationWarnings(validation.warnings);
      }

      await onSubmit(formData);
      return true;
    } catch (error) {
      logger.error('Form submission error', { error });
      notificationService.error('Failed to submit form', {
        description: error instanceof Error ? error.message : 'An unexpected error occurred'
      });
      return false;
    }
  }

  private showValidationErrors(errors: ValidationError[]): void {
    const errorsByField = errors.reduce((acc, error) => {
      if (!acc[error.field]) acc[error.field] = [];
      acc[error.field].push(error);
      return acc;
    }, {} as Record<string, ValidationError[]>);

    const fieldCount = Object.keys(errorsByField).length;
    const errorCount = errors.length;

    notificationService.error('Form validation failed', {
      description: `Please fix ${errorCount} error${errorCount > 1 ? 's' : ''} in ${fieldCount} field${fieldCount > 1 ? 's' : ''}`,
      duration: 5000
    });
  }

  private showValidationWarnings(warnings: ValidationError[]): void {
    if (warnings.length === 1) {
      notificationService.warning(warnings[0].message, {
        duration: 4000
      });
    } else {
      notificationService.warning('Form has warnings', {
        description: `${warnings.length} field${warnings.length > 1 ? 's' : ''} have warnings`,
        duration: 4000
      });
    }
  }

  // Cleanup
  destroy(): void {
    // Clear all debounce timers
    for (const timer of this.debounceTimers.values()) {
      clearTimeout(timer);
    }
    this.debounceTimers.clear();
    this.asyncValidationCache.clear();
    this.validations.clear();
  }
}

// React hook for form validation
export function useFormValidation(config?: Partial<FormConfig>) {
  const [service] = React.useState(() => new FormValidationService(config));
  const [formState, setFormState] = React.useState<FormState>(() => service.createFormState());

  const addField = React.useCallback((validation: FieldValidation) => {
    service.addField(validation);
  }, [service]);

  const removeField = React.useCallback((field: string) => {
    service.removeField(field);
  }, [service]);

  const validateField = React.useCallback(async (field: string, value: unknown) => {
    setFormState(prev => service.updateFormState(prev, {
      validating: { ...prev.validating, [field]: true }
    }));

    const errors = await service.validateField(field, value, formState.values);
    
    setFormState(prev => service.updateFormState(prev, {
      errors: { ...prev.errors, [field]: errors },
      validating: { ...prev.validating, [field]: false }
    }));

    return errors;
  }, [service, formState.values]);

  const validateForm = React.useCallback(async () => {
    const validation = await service.validateForm(formState.values);
    
    const newErrors: Record<string, ValidationError[]> = {};
    for (const [field, errors] of Object.entries(validation.fieldErrors)) {
      newErrors[field] = errors;
    }

    setFormState(prev => service.updateFormState(prev, {
      errors: newErrors
    }));

    return validation;
  }, [service, formState.values]);

  const setValue = React.useCallback((field: string, value: unknown) => {
    setFormState(prev => {
      const newValues = { ...prev.values, [field]: value };
      const isDirty = newValues[field] !== (prev.values[field] ?? '');
      
      return service.updateFormState(prev, {
        values: newValues,
        dirty: { ...prev.dirty, [field]: isDirty }
      });
    });

    // Validate dependent fields
    const dependents = service.getDependentFields(field);
    dependents.forEach(depField => {
      validateField(depField, formState.values[depField]);
    });
  }, [service, validateField, formState.values]);

  const setTouched = React.useCallback((field: string, touched = true) => {
    setFormState(prev => service.updateFormState(prev, {
      touched: { ...prev.touched, [field]: touched }
    }));
  }, [service]);

  const handleSubmit = React.useCallback(async (onSubmit: (data: Record<string, unknown>) => Promise<void>) => {
    setFormState(prev => service.updateFormState(prev, {
      isSubmitting: true,
      submitCount: prev.submitCount + 1
    }));

    const success = await service.handleFormSubmit(
      formState.values,
      onSubmit,
      (errors) => {
        setFormState(prev => service.updateFormState(prev, {
          isSubmitting: false
        }));
      }
    );

    if (success) {
      setFormState(prev => service.updateFormState(prev, {
        isSubmitting: false,
        dirty: {},
        touched: {}
      }));
    }

    return success;
  }, [service, formState.values]);

  const reset = React.useCallback((newValues?: Record<string, unknown>) => {
    setFormState(service.createFormState(newValues));
    service.clearCache();
  }, [service]);

  React.useEffect(() => {
    return () => {
      service.destroy();
    };
  }, [service]);

  return {
    formState,
    addField,
    removeField,
    validateField,
    validateForm,
    setValue,
    setTouched,
    handleSubmit,
    reset,
    service
  };
}

// Export validation rules for easy access
export { ValidationRules as Rules };