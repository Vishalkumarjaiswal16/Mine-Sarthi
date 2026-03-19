import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, Filter, X, Plus } from 'lucide-react';

export type SearchOperator = 'contains' | 'equals' | 'startsWith' | 'endsWith' | 'greaterThan' | 'lessThan' | 'between';

export interface SearchCondition {
  id: string;
  field: string;
  operator: SearchOperator;
  value: string;
  value2?: string; // For between operator
}

export interface AdvancedSearchProps {
  fields: Array<{ value: string; label: string; type?: 'text' | 'number' | 'date' }>;
  onSearch: (conditions: SearchCondition[]) => void;
  placeholder?: string;
  className?: string;
}

const operatorOptions = [
  { value: 'contains', label: 'Contains', types: ['text'] },
  { value: 'equals', label: 'Equals', types: ['text', 'number', 'date'] },
  { value: 'startsWith', label: 'Starts with', types: ['text'] },
  { value: 'endsWith', label: 'Ends with', types: ['text'] },
  { value: 'greaterThan', label: 'Greater than', types: ['number', 'date'] },
  { value: 'lessThan', label: 'Less than', types: ['number', 'date'] },
  { value: 'between', label: 'Between', types: ['number', 'date'] },
];

const AdvancedSearch: React.FC<AdvancedSearchProps> = ({
  fields,
  onSearch,
  placeholder = "Advanced search...",
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [conditions, setConditions] = useState<SearchCondition[]>([]);
  const [quickSearch, setQuickSearch] = useState('');

  const addCondition = () => {
    const newCondition: SearchCondition = {
      id: Date.now().toString(),
      field: fields[0]?.value || '',
      operator: 'contains',
      value: '',
    };
    setConditions([...conditions, newCondition]);
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter(c => c.id !== id));
  };

  const updateCondition = (id: string, updates: Partial<SearchCondition>) => {
    setConditions(conditions.map(c =>
      c.id === id ? { ...c, ...updates } : c
    ));
  };

  const handleSearch = () => {
    if (quickSearch.trim()) {
      // If there's a quick search, create a contains condition for all text fields
      const textFields = fields.filter(f => f.type !== 'number' && f.type !== 'date');
      const quickConditions = textFields.map(field => ({
        id: `quick-${field.value}`,
        field: field.value,
        operator: 'contains' as SearchOperator,
        value: quickSearch,
      }));
      onSearch([...conditions, ...quickConditions]);
    } else {
      onSearch(conditions);
    }
    setIsOpen(false);
  };

  const clearAll = () => {
    setConditions([]);
    setQuickSearch('');
    onSearch([]);
  };

  const getOperatorsForField = (fieldValue: string) => {
    const field = fields.find(f => f.value === fieldValue);
    if (!field) return operatorOptions;
    return operatorOptions.filter(op => op.types.includes(field.type || 'text'));
  };

  const getConditionDisplay = (condition: SearchCondition) => {
    const field = fields.find(f => f.value === condition.field);
    const operator = operatorOptions.find(op => op.value === condition.operator);
    return `${field?.label || condition.field} ${operator?.label || condition.operator} "${condition.value}"${condition.value2 ? ` and "${condition.value2}"` : ''}`;
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder={placeholder}
            value={quickSearch}
            onChange={(e) => setQuickSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSearch();
              }
            }}
            className="pl-10 pr-10"
          />
          {quickSearch && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              onClick={() => setQuickSearch('')}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-96 p-0" align="end">
            <div className="p-4 border-b">
              <h4 className="font-medium mb-3">Advanced Search Conditions</h4>

              <div className="space-y-3 max-h-60 overflow-y-auto">
                {conditions.map(condition => (
                  <div key={condition.id} className="flex items-center gap-2 p-2 border rounded">
                    <Select
                      value={condition.field}
                      onValueChange={(value) => updateCondition(condition.id, { field: value })}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Select
                      value={condition.operator}
                      onValueChange={(value: SearchOperator) => updateCondition(condition.id, { operator: value })}
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {getOperatorsForField(condition.field).map(op => (
                          <SelectItem key={op.value} value={op.value}>
                            {op.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      placeholder="Value"
                      value={condition.value}
                      onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                      className="flex-1"
                    />

                    {condition.operator === 'between' && (
                      <Input
                        placeholder="Value 2"
                        value={condition.value2 || ''}
                        onChange={(e) => updateCondition(condition.id, { value2: e.target.value })}
                        className="w-20"
                      />
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCondition(condition.id)}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={addCondition}
                className="w-full mt-3"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Condition
              </Button>
            </div>

            <div className="flex items-center justify-between p-3">
              <Button variant="outline" onClick={clearAll}>
                Clear All
              </Button>
              <Button onClick={handleSearch}>
                Apply Search
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button onClick={handleSearch}>
          Search
        </Button>
      </div>

      {/* Active conditions display */}
      {conditions.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {conditions.map(condition => (
            <Badge key={condition.id} variant="secondary" className="text-xs">
              {getConditionDisplay(condition)}
              <button
                className="ml-1 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                onClick={() => removeCondition(condition.id)}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvancedSearch;
