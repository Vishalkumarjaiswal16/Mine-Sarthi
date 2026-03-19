import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import DateRangePicker, { DateRange } from '@/components/ui/DateRangePicker';
import MultiSelect, { MultiSelectOption } from '@/components/ui/MultiSelect';
import FilterPresets, { FilterPreset } from '@/components/ui/FilterPresets';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'checkbox';
  options?: FilterOption[];
  placeholder?: string;
  defaultValue?: string | boolean;
  className?: string;
}

export interface FilterPanelProps {
  fields: FilterField[];
  onApply: (filters: Record<string, string | boolean>) => void;
  onClear?: () => void;
  title?: string;
  className?: string;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  fields,
  onApply,
  onClear,
  title,
  className = '',
}) => {
  const initialFilters = fields.reduce((acc, field) => {
    acc[field.name] = field.defaultValue || (field.type === 'checkbox' ? false : '');
    return acc;
  }, {} as Record<string, string | boolean>);

  const [filters, setFilters] = useState<Record<string, string | boolean>>(initialFilters);

  const handleChange = (name: string, value: string | boolean) => {
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClear = () => {
    setFilters(initialFilters);
    if (onClear) onClear();
  };

  const handleApply = () => {
    onApply(filters);
  };

  return (
    <Card className={`p-6 ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-4">{title}</h3>}

      <div className="space-y-4">
        {fields.map(field => (
          <div key={field.name} className={field.className}>
            <Label className="mb-1 block">{field.label}</Label>
            {field.type === 'text' && (
              <Input
                value={filters[field.name] as string}
                placeholder={field.placeholder}
                onChange={e => handleChange(field.name, e.target.value)}
              />
            )}

            {field.type === 'select' && (
              <Select
                value={filters[field.name] as string}
                onValueChange={value => handleChange(field.name, value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {field.type === 'checkbox' && (
              <Checkbox
                checked={filters[field.name] as boolean}
                onCheckedChange={checked => handleChange(field.name, checked)}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-4 mt-6">
        <Button variant="outline" onClick={handleClear}>
          Clear
        </Button>
        <Button onClick={handleApply}>Apply</Button>
      </div>
    </Card>
  );
};

export default FilterPanel;
