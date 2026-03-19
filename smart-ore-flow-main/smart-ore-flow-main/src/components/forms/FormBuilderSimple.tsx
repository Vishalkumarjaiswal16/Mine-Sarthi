import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'textarea'
  | 'select'
  | 'checkbox'
  | 'radio'
  | 'slider'
  | 'switch'
  | 'date';

export interface FormField {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: { value: string; label: string }[];
  defaultValue?: string | number | boolean;
  description?: string;
  className?: string;
  min?: number;
  max?: number;
  step?: number;
}

export interface FormBuilderProps {
  fields: FormField[];
  onSubmit: (data: Record<string, string | number | boolean>) => void | Promise<void>;
  onCancel?: () => void;
  title?: string;
  description?: string;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  className?: string;
  layout?: 'vertical' | 'horizontal';
  showCancel?: boolean;
}

const FormBuilder: React.FC<FormBuilderProps> = ({
  fields,
  onSubmit,
  onCancel,
  title,
  description,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  loading = false,
  className = '',
  layout = 'vertical',
  showCancel = true,
}) => {
  const [formData, setFormData] = useState<Record<string, string | number | boolean>>(() => {
    const initial: Record<string, string | number | boolean> = {};
    fields.forEach(field => {
      initial[field.name] = field.defaultValue || (field.type === 'checkbox' || field.type === 'switch' ? false : field.type === 'number' ? 0 : '');
    });
    return initial;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateField = (field: FormField, value: string | number | boolean): string => {
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.label} is required`;
    }

    if (field.type === 'email' && typeof value === 'string') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value && !emailRegex.test(value)) {
        return 'Invalid email address';
      }
    }

    if (field.type === 'number' && typeof value === 'number') {
      if (field.min !== undefined && value < field.min) {
        return `Minimum value is ${field.min}`;
      }
      if (field.max !== undefined && value > field.max) {
        return `Maximum value is ${field.max}`;
      }
    }

    return '';
  };

  const handleInputChange = (name: string, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: Record<string, string> = {};
    fields.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setIsSubmitting(true);
      try {
        await onSubmit(formData);
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error('Form submission error:', errorMessage);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const renderField = (field: FormField) => {
    const error = errors[field.name];
    const value = formData[field.name];
    const fieldLayout = layout === 'horizontal' ? 'flex items-center gap-4' : '';

    const fieldComponent = (
      <div className={`${fieldLayout} ${field.className || ''}`}>
        <Label htmlFor={field.name} className={layout === 'horizontal' ? 'w-32 flex-shrink-0' : ''}>
          {field.label}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </Label>

        <div className={layout === 'horizontal' ? 'flex-1' : ''}>
          {field.type === 'textarea' && (
            <Textarea
              id={field.name}
              placeholder={field.placeholder}
              value={value as string}
              disabled={field.disabled || loading}
              className={error ? 'border-destructive' : ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
            />
          )}

          {field.type === 'select' && (
            <Select
              value={value as string}
              onValueChange={(newValue) => handleInputChange(field.name, newValue)}
              disabled={field.disabled || loading}
            >
              <SelectTrigger className={error ? 'border-destructive' : ''}>
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
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.name}
                checked={value as boolean}
                disabled={field.disabled || loading}
                onCheckedChange={(checked) => handleInputChange(field.name, checked as boolean)}
              />
              <Label htmlFor={field.name} className="text-sm font-normal">
                {field.description || field.label}
              </Label>
            </div>
          )}

          {field.type === 'radio' && (
            <RadioGroup
              value={value as string}
              onValueChange={(newValue) => handleInputChange(field.name, newValue)}
              disabled={field.disabled || loading}
            >
              {field.options?.map(option => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${field.name}-${option.value}`} />
                  <Label htmlFor={`${field.name}-${option.value}`} className="text-sm font-normal">
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}

          {field.type === 'slider' && (
            <div className="space-y-2">
              <Slider
                value={[value as number]}
                onValueChange={(newValue) => handleInputChange(field.name, newValue[0])}
                min={field.min || 0}
                max={field.max || 100}
                step={field.step || 1}
                disabled={field.disabled || loading}
                className="w-full"
              />
              <div className="text-sm text-muted-foreground text-center">
                Value: {value as number}
              </div>
            </div>
          )}

          {field.type === 'switch' && (
            <div className="flex items-center space-x-2">
              <Switch
                id={field.name}
                checked={value as boolean}
                disabled={field.disabled || loading}
                onCheckedChange={(checked) => handleInputChange(field.name, checked as boolean)}
              />
              <Label htmlFor={field.name} className="text-sm font-normal">
                {field.description || field.label}
              </Label>
            </div>
          )}

          {(field.type === 'text' || field.type === 'email' || field.type === 'password' || field.type === 'date') && (
            <Input
              id={field.name}
              type={field.type}
              placeholder={field.placeholder}
              value={value as string}
              disabled={field.disabled || loading}
              className={error ? 'border-destructive' : ''}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
            />
          )}

          {field.type === 'number' && (
            <Input
              id={field.name}
              type="number"
              placeholder={field.placeholder}
              value={value as number}
              min={field.min}
              max={field.max}
              step={field.step}
              disabled={field.disabled || loading}
              className={error ? 'border-destructive' : ''}
              onChange={(e) => handleInputChange(field.name, parseFloat(e.target.value) || 0)}
            />
          )}

          {field.description && field.type !== 'checkbox' && field.type !== 'switch' && (
            <p className="text-sm text-muted-foreground mt-1">{field.description}</p>
          )}

          {error && (
            <Alert variant="destructive" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
    );

    return fieldComponent;
  };

  return (
    <Card className={`p-6 ${className}`}>
      {(title || description) && (
        <div className="mb-6">
          {title && <h3 className="text-lg font-semibold">{title}</h3>}
          {description && <p className="text-muted-foreground mt-1">{description}</p>}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {fields.map(field => (
          <div key={field.name}>
            {renderField(field)}
          </div>
        ))}

        <div className="flex gap-4 pt-4">
          <Button type="submit" disabled={loading || isSubmitting} className="flex-1">
            {loading || isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {submitLabel}...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {submitLabel}
              </>
            )}
          </Button>

          {showCancel && onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading || isSubmitting}>
              {cancelLabel}
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
};

export default FormBuilder;
