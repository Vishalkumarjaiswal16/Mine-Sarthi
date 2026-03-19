import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}

export interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const DateRangePicker: React.FC<DateRangePickerProps> = ({
  value = { from: undefined, to: undefined },
  onChange,
  placeholder = "Pick a date range",
  className = '',
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      onChange(range);
      setIsOpen(false);
    } else {
      onChange(range || { from: undefined, to: undefined });
    }
  };

  const handleClear = () => {
    onChange({ from: undefined, to: undefined });
  };

  const formatDateRange = () => {
    if (!value.from && !value.to) return placeholder;
    if (value.from && !value.to) return format(value.from, 'MMM dd, yyyy');
    if (value.from && value.to) {
      return `${format(value.from, 'MMM dd')} - ${format(value.to, 'MMM dd, yyyy')}`;
    }
    return placeholder;
  };

  return (
    <div className={`relative ${className}`}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={`w-full justify-start text-left font-normal ${!value.from && !value.to ? 'text-muted-foreground' : ''}`}
            disabled={disabled}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {formatDateRange()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="range"
            selected={{
              from: value.from,
              to: value.to,
            }}
            onSelect={handleSelect}
            numberOfMonths={2}
            className="rounded-md border-0"
          />
          <div className="flex items-center justify-between p-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleClear}
              disabled={!value.from && !value.to}
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
            <Button
              size="sm"
              onClick={() => setIsOpen(false)}
              disabled={!value.from || !value.to}
            >
              Apply
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default DateRangePicker;
