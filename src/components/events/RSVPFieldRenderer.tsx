import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { TimePicker } from '@/components/ui/time-picker';
import { CalendarIcon, Upload, Star } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { RSVPField } from '@/types';

interface RSVPFieldRendererProps {
  fields: RSVPField[];
  values: Record<string, any>;
  onChange: (fieldName: string, value: any) => void;
  errors?: Record<string, string>;
}

export const RSVPFieldRenderer = ({ fields, values, onChange, errors }: RSVPFieldRendererProps) => {
  const [fileUploads, setFileUploads] = useState<Record<string, File | null>>({});

  const handleFileChange = (fieldName: string, file: File | null) => {
    setFileUploads(prev => ({ ...prev, [fieldName]: file }));
    
    if (file) {
      // Convert to base64 for template transmission
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64 = e.target?.result as string;
        onChange(fieldName, {
          name: file.name,
          size: file.size,
          type: file.type,
          data: base64
        });
      };
      reader.readAsDataURL(file);
    } else {
      onChange(fieldName, null);
    }
  };

  const renderField = (field: RSVPField) => {
    const value = values[field.field_name];
    const error = errors?.[field.field_name];

    const commonProps = {
      id: field.field_name,
      className: cn(error && "border-destructive")
    };

    switch (field.field_type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.field_name} className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type={field.field_type === 'email' ? 'email' : field.field_type === 'phone' ? 'tel' : 'text'}
              value={value || ''}
              onChange={(e) => onChange(field.field_name, e.target.value)}
              placeholder={field.placeholder_text}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'number':
        return (
          <div key={field.field_name} className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="number"
              value={value || ''}
              onChange={(e) => onChange(field.field_name, e.target.value)}
              placeholder={field.placeholder_text}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'textarea':
        return (
          <div key={field.field_name} className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              {...commonProps}
              value={value || ''}
              onChange={(e) => onChange(field.field_name, e.target.value)}
              placeholder={field.placeholder_text}
              rows={3}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'select':
        return (
          <div key={field.field_name} className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Select value={value || ''} onValueChange={(val) => onChange(field.field_name, val)}>
              <SelectTrigger className={cn(error && "border-destructive")}>
                <SelectValue placeholder={field.placeholder_text || `Select ${field.field_label}`} />
              </SelectTrigger>
              <SelectContent>
                {(Array.isArray(field.field_options) 
                  ? field.field_options 
                  : field.field_options?.options || []
                ).map((option: string, index: number) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'radio':
        return (
          <div key={field.field_name} className="space-y-2">
            <Label>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <RadioGroup 
              value={value || ''} 
              onValueChange={(val) => onChange(field.field_name, val)}
              className={cn(error && "border border-destructive rounded p-2")}
            >
              {(Array.isArray(field.field_options) 
                ? field.field_options 
                : field.field_options?.options || []
              ).map((option: string, index: number) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.field_name}-${index}`} />
                  <Label htmlFor={`${field.field_name}-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'checkbox':
        return (
          <div key={field.field_name} className="space-y-2">
            <Label>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className={cn("space-y-2", error && "border border-destructive rounded p-2")}>
              {(Array.isArray(field.field_options) 
                ? field.field_options 
                : field.field_options?.options || []
              ).map((option: string, index: number) => {
                const checked = Array.isArray(value) ? value.includes(option) : false;
                return (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`${field.field_name}-${index}`}
                      checked={checked}
                      onCheckedChange={(isChecked) => {
                        const currentValues = Array.isArray(value) ? value : [];
                        if (isChecked) {
                          onChange(field.field_name, [...currentValues, option]);
                        } else {
                          onChange(field.field_name, currentValues.filter((v: string) => v !== option));
                        }
                      }}
                    />
                    <Label htmlFor={`${field.field_name}-${index}`}>{option}</Label>
                  </div>
                );
              })}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'toggle':
        return (
          <div key={field.field_name} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                {...commonProps}
                checked={value || false}
                onCheckedChange={(checked) => onChange(field.field_name, checked)}
              />
              <Label htmlFor={field.field_name}>
                {field.field_label}
                {field.is_required && <span className="text-destructive ml-1">*</span>}
              </Label>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'date':
        return (
          <div key={field.field_name} className="space-y-2">
            <Label>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !value && "text-muted-foreground",
                    error && "border-destructive"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {value ? format(new Date(value), "PPP") : <span>{field.placeholder_text || "Pick a date"}</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={value ? new Date(value) : undefined}
                  onSelect={(date) => onChange(field.field_name, date?.toISOString())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'time':
        return (
          <div key={field.field_name} className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="time"
              value={value || ''}
              onChange={(e) => onChange(field.field_name, e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'datetime':
        return (
          <div key={field.field_name} className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Input
              {...commonProps}
              type="datetime-local"
              value={value || ''}
              onChange={(e) => onChange(field.field_name, e.target.value)}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'file':
        return (
          <div key={field.field_name} className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                {...commonProps}
                type="file"
                onChange={(e) => handleFileChange(field.field_name, e.target.files?.[0] || null)}
                accept={!Array.isArray(field.field_options) ? field.field_options?.accept || '*/*' : '*/*'}
              />
              <Upload className="w-4 h-4 text-muted-foreground" />
            </div>
            {value && (
              <p className="text-sm text-muted-foreground">
                Selected: {value.name} ({(value.size / 1024).toFixed(1)} KB)
              </p>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'rating':
        return (
          <div key={field.field_name} className="space-y-2">
            <Label>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <div className={cn("flex gap-1", error && "border border-destructive rounded p-2")}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => onChange(field.field_name, rating)}
                  className="p-1"
                >
                  <Star
                    className={cn(
                      "w-6 h-6",
                      rating <= (value || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    )}
                  />
                </button>
              ))}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      case 'address':
        return (
          <div key={field.field_name} className="space-y-2">
            <Label htmlFor={field.field_name}>
              {field.field_label}
              {field.is_required && <span className="text-destructive ml-1">*</span>}
            </Label>
            <Textarea
              {...commonProps}
              value={value || ''}
              onChange={(e) => onChange(field.field_name, e.target.value)}
              placeholder={field.placeholder_text || "Enter your address"}
              rows={3}
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {fields.map(renderField)}
    </div>
  );
};