'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Calendar } from 'lucide-react';

export interface DateInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  error?: string;
  label?: string;
  helperText?: string;
  onChange?: (value: string) => void;
  value?: string;
}

/**
 * DateInput component that allows both manual text entry and date picker selection.
 * Accepts dates in multiple formats: YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY, MM/DD/YYYY
 * Always outputs in YYYY-MM-DD format for form submission.
 */
const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  ({ className, error, label, helperText, id, onChange, value, ...props }, ref) => {
    const inputId = id || props.name;
    const [textValue, setTextValue] = React.useState('');
    const [isFocused, setIsFocused] = React.useState(false);
    const dateInputRef = React.useRef<HTMLInputElement>(null);
    
    // Sync textValue with external value
    React.useEffect(() => {
      if (value && !isFocused) {
        // Format the date for display (YYYY-MM-DD to DD/MM/YYYY)
        const formatted = formatDateForDisplay(value);
        setTextValue(formatted);
      } else if (!value) {
        setTextValue('');
      }
    }, [value, isFocused]);

    // Parse various date formats and return YYYY-MM-DD or null
    const parseDate = (input: string): string | null => {
      if (!input) return null;
      
      const trimmed = input.trim();
      
      // Already in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const date = new Date(trimmed);
        if (!isNaN(date.getTime())) return trimmed;
      }
      
      // DD/MM/YYYY or DD-MM-YYYY format
      const ddmmyyyy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (ddmmyyyy) {
        const [, day, month, year] = ddmmyyyy;
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        if (!isNaN(date.getTime())) {
          return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
      }
      
      // MM/DD/YYYY format (US format)
      const mmddyyyy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
      if (mmddyyyy) {
        const [, month, day, year] = mmddyyyy;
        // Only use US format if month > 12 (clearly a day) or day <= 12
        if (parseInt(month) <= 12 && parseInt(day) <= 31) {
          const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
          if (!isNaN(date.getTime())) {
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          }
        }
      }
      
      // Try native Date parsing as fallback
      const date = new Date(trimmed);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
      
      return null;
    };

    // Format YYYY-MM-DD to DD/MM/YYYY for display
    const formatDateForDisplay = (dateStr: string): string => {
      if (!dateStr) return '';
      const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
      if (match) {
        const [, year, month, day] = match;
        return `${day}/${month}/${year}`;
      }
      return dateStr;
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setTextValue(newValue);
      
      // Try to parse the date and update the form value
      const parsed = parseDate(newValue);
      if (parsed && onChange) {
        onChange(parsed);
      }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(false);
      
      // On blur, try to parse and format the entered value
      const parsed = parseDate(textValue);
      if (parsed) {
        setTextValue(formatDateForDisplay(parsed));
        if (onChange) {
          onChange(parsed);
        }
      } else if (textValue && !parsed) {
        // Invalid date - keep the text but don't update form value
        // The error will be shown by form validation
      }
      
      if (props.onBlur) {
        props.onBlur(e);
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      if (props.onFocus) {
        props.onFocus(e);
      }
    };

    const handleDatePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const dateValue = e.target.value; // YYYY-MM-DD format
      if (dateValue) {
        setTextValue(formatDateForDisplay(dateValue));
        if (onChange) {
          onChange(dateValue);
        }
      }
    };

    const openDatePicker = () => {
      if (dateInputRef.current) {
        dateInputRef.current.showPicker?.();
      }
    };

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-foreground mb-1.5"
          >
            {label}
            {props.required && <span className="text-destructive ml-1">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            type="text"
            id={inputId}
            className={cn(
              'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 pr-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-destructive focus-visible:ring-destructive',
              className
            )}
            ref={ref}
            value={textValue}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onFocus={handleFocus}
            placeholder="DD/MM/YYYY"
            {...props}
          />
          {/* Hidden date input for native date picker */}
          <input
            type="date"
            ref={dateInputRef}
            className="sr-only"
            value={value || ''}
            onChange={handleDatePickerChange}
            tabIndex={-1}
            aria-hidden="true"
          />
          {/* Calendar icon button to trigger date picker */}
          <button
            type="button"
            onClick={openDatePicker}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
            tabIndex={-1}
            aria-label="Open date picker"
          >
            <Calendar className="h-4 w-4" />
          </button>
        </div>
        {error && (
          <p className="mt-1 text-sm text-destructive">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-sm text-muted-foreground">{helperText}</p>
        )}
      </div>
    );
  }
);
DateInput.displayName = 'DateInput';

export { DateInput };
