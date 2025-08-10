import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Edit3, Zap } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { RSVPField } from '@/types';

export interface RSVPFieldLocal {
  id?: string;
  field_name: string;
  field_label: string;
  field_type: string;
  is_required: boolean;
  field_options: any;
  placeholder_text?: string;
  validation_rules: any;
  display_order: number;
}

interface RSVPFieldBuilderProps {
  eventId: string;
  fields: RSVPField[];
  onFieldsChange: (fields: RSVPField[]) => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone Number' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Radio Buttons' },
  { value: 'checkbox', label: 'Checkboxes' },
  { value: 'toggle', label: 'Yes/No Toggle' },
  { value: 'date', label: 'Date Picker' },
  { value: 'time', label: 'Time Picker' },
  { value: 'datetime', label: 'Date & Time' },
  { value: 'file', label: 'File Upload' },
  { value: 'rating', label: 'Rating Scale' },
  { value: 'address', label: 'Address' }
];

// Pre-filled field templates for quick-add
const QUICK_ADD_TEMPLATES = [
  {
    id: 'guest_count',
    field_name: 'guest_count',
    field_label: 'Guest Count',
    field_type: 'select' as const,
    is_required: true,
    field_options: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10+'],
    placeholder_text: 'Select number of guests',
  },
  {
    id: 'dietary_restrictions',
    field_name: 'dietary_restrictions',
    field_label: 'Dietary Restrictions',
    field_type: 'textarea' as const,
    is_required: false,
    field_options: [],
    placeholder_text: 'Please mention any dietary restrictions or allergies...',
  },
  {
    id: 'arrival_time',
    field_name: 'arrival_time',
    field_label: 'Arrival Time',
    field_type: 'datetime' as const,
    is_required: false,
    field_options: [],
    placeholder_text: 'When do you plan to arrive?',
  },
  {
    id: 'additional_details',
    field_name: 'additional_details',
    field_label: 'Additional Details',
    field_type: 'text' as const,
    is_required: false,
    field_options: [],
    placeholder_text: 'Any additional information you\'d like to share...',
  },
];

export const RSVPFieldBuilder = ({ eventId, fields, onFieldsChange }: RSVPFieldBuilderProps) => {
  const [editingField, setEditingField] = useState<RSVPField | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const createNewField = (): RSVPField => ({
    id: '',
    field_name: '',
    field_label: '',
    field_type: 'text',
    is_required: false,
    field_options: [],
    placeholder_text: '',
    validation_rules: {},
    display_order: fields.length
  });

  const handleAddField = () => {
    setEditingField(createNewField());
    setIsDialogOpen(true);
  };

  const handleQuickAddField = async (template: typeof QUICK_ADD_TEMPLATES[0]) => {
    try {
      const fieldData = {
        event_id: eventId,
        field_name: template.field_name,
        field_label: template.field_label,
        field_type: template.field_type,
        is_required: template.is_required,
        field_options: template.field_options || [],
        placeholder_text: template.placeholder_text,
        display_order: fields.length,
      };

      const { data, error } = await supabase
        .from('rsvp_field_definitions')
        .insert([fieldData])
        .select()
        .single();

      if (error) throw error;

      onFieldsChange([...fields, data as RSVPField]);
      toast({
        title: 'Field added successfully',
        description: `${template.field_label} has been added to your RSVP form.`,
      });
    } catch (error) {
      console.error('Error adding quick field:', error);
      toast({
        title: 'Error adding field',
        description: 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleEditField = (field: RSVPField) => {
    setEditingField(field);
    setIsDialogOpen(true);
  };

  const handleSaveField = async (field: RSVPField) => {
    try {
      if (field.id) {
        // Update existing field
        const { error } = await supabase
          .from('rsvp_field_definitions')
          .update({
            field_name: field.field_name,
            field_label: field.field_label,
            field_type: field.field_type,
            is_required: field.is_required,
            field_options: field.field_options,
            placeholder_text: field.placeholder_text,
            validation_rules: field.validation_rules,
            display_order: field.display_order
          })
          .eq('id', field.id);

        if (error) throw error;

        const updatedFields = fields.map(f => f.id === field.id ? field : f);
        onFieldsChange(updatedFields);
      } else {
        // Create new field
        const { data, error } = await supabase
          .from('rsvp_field_definitions')
          .insert({
            event_id: eventId,
            field_name: field.field_name,
            field_label: field.field_label,
            field_type: field.field_type,
            is_required: field.is_required,
            field_options: field.field_options,
            placeholder_text: field.placeholder_text,
            validation_rules: field.validation_rules,
            display_order: field.display_order
          })
          .select()
          .single();

        if (error) throw error;

        onFieldsChange([...fields, { ...data, field_options: data.field_options || [] } as RSVPField]);
      }

      toast({ title: 'Field saved successfully!' });
      setIsDialogOpen(false);
      setEditingField(null);
    } catch (error) {
      console.error('Error saving field:', error);
      toast({ title: 'Error saving field', variant: 'destructive' });
    }
  };

  const handleDeleteField = async (fieldId: string) => {
    try {
      const { error } = await supabase
        .from('rsvp_field_definitions')
        .delete()
        .eq('id', fieldId);

      if (error) throw error;

      const updatedFields = fields.filter(f => f.id !== fieldId);
      onFieldsChange(updatedFields);
      toast({ title: 'Field deleted successfully!' });
    } catch (error) {
      console.error('Error deleting field:', error);
      toast({ title: 'Error deleting field', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Custom RSVP Fields</h3>
        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Zap className="w-4 h-4 mr-2" />
                Quick Add
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {QUICK_ADD_TEMPLATES.map((template) => (
                <DropdownMenuItem
                  key={template.id}
                  onClick={() => handleQuickAddField(template)}
                  className="flex flex-col items-start py-3"
                >
                  <div className="font-medium">{template.field_label}</div>
                  <div className="text-sm text-muted-foreground">
                    {template.field_type === 'select' ? 'Dropdown' : 
                     template.field_type === 'textarea' ? 'Long text' :
                     template.field_type === 'datetime' ? 'Date & Time' : 'Text'}
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <Button onClick={handleAddField} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Field
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {fields.map((field, index) => (
          <Card key={field.id || index} className="relative">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{field.field_label}</span>
                    <Badge variant="outline" className="text-xs">
                      {FIELD_TYPES.find(t => t.value === field.field_type)?.label}
                    </Badge>
                    {field.is_required && <Badge variant="destructive" className="text-xs">Required</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Field name: {field.field_name}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditField(field)}
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => field.id && handleDeleteField(field.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {fields.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No custom fields added yet. Click "Add Field" to create your first RSVP field.
          </div>
        )}
      </div>

      <RSVPFieldEditor
        field={editingField}
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false);
          setEditingField(null);
        }}
        onSave={handleSaveField}
      />
    </div>
  );
};

interface RSVPFieldEditorProps {
  field: RSVPField | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (field: RSVPField) => void;
}

const RSVPFieldEditor = ({ field, isOpen, onClose, onSave }: RSVPFieldEditorProps) => {
  const [editField, setEditField] = useState<RSVPField | null>(null);
  const [options, setOptions] = useState<string[]>([]);

  useEffect(() => {
    if (field) {
      setEditField({ ...field });
      if (Array.isArray(field.field_options)) {
        setOptions(field.field_options);
      } else if (field.field_options && typeof field.field_options === 'object' && 'options' in field.field_options && Array.isArray(field.field_options.options)) {
        setOptions(field.field_options.options);
      } else {
        setOptions([]);
      }
    }
  }, [field]);

  const handleSave = () => {
    if (!editField) return;

    const finalField = {
      ...editField,
      field_options: needsOptions(editField.field_type) ? options : []
    };

    onSave(finalField);
  };

  const needsOptions = (fieldType: string) => {
    return ['select', 'radio', 'checkbox'].includes(fieldType);
  };

  const addOption = () => {
    setOptions([...options, '']);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  const removeOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  if (!editField) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editField.id ? 'Edit Field' : 'Add New Field'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="field_label">Field Label *</Label>
              <Input
                id="field_label"
                value={editField.field_label}
                onChange={(e) => setEditField({ ...editField, field_label: e.target.value })}
                placeholder="e.g., Dietary Restrictions"
              />
            </div>
            <div>
              <Label htmlFor="field_name">Field Name *</Label>
              <Input
                id="field_name"
                value={editField.field_name}
                onChange={(e) => setEditField({ ...editField, field_name: e.target.value })}
                placeholder="e.g., dietary_restrictions"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="field_type">Field Type *</Label>
            <Select
              value={editField.field_type}
              onValueChange={(value) => setEditField({ ...editField, field_type: value as any })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FIELD_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="placeholder_text">Placeholder Text</Label>
            <Input
              id="placeholder_text"
              value={editField.placeholder_text || ''}
              onChange={(e) => setEditField({ ...editField, placeholder_text: e.target.value })}
              placeholder="e.g., Please specify any dietary restrictions"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is_required"
              checked={editField.is_required}
              onCheckedChange={(checked) => setEditField({ ...editField, is_required: checked as boolean })}
            />
            <Label htmlFor="is_required">Required field</Label>
          </div>

          {needsOptions(editField.field_type) && (
            <div>
              <Label>Options</Label>
              <div className="space-y-2">
                {options.map((option, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      placeholder={`Option ${index + 1}`}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addOption}>
                  Add Option
                </Button>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!editField.field_label || !editField.field_name}>
              {editField.id ? 'Update Field' : 'Add Field'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};