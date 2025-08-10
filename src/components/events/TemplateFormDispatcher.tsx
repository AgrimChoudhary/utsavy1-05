import { Template } from '@/types';
import { z } from 'zod';
import { eventSchema } from '@/lib/validations';
import { WeddingTemplateForm } from './forms/WeddingTemplateForm';
import { RoyalWeddingTemplateForm } from './forms/RoyalWeddingTemplateForm';
import { BirthdayTemplateForm } from './forms/BirthdayTemplateForm';
import { CorporateTemplateForm } from './forms/CorporateTemplateForm';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface TemplateFormDispatcherProps {
  template: Template | null;
  onSubmit: (data: z.infer<typeof eventSchema>) => void;
  onBack: () => void;
  isLoading?: boolean;
  initialData?: any; // For edit mode
}

export const TemplateFormDispatcher = ({ 
  template, 
  onSubmit, 
  onBack, 
  isLoading, 
  initialData 
}: TemplateFormDispatcherProps) => {
  if (!template) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          No template selected. Please go back and select a template.
        </AlertDescription>
      </Alert>
    );
  }

  // Common props for all form components
  const formProps = {
    template,
    onSubmit,
    onBack,
    isLoading,
    initialData
  };

  // Dispatch to the appropriate form component based on template type
  switch (template.component_name) {
    case 'WeddingTemplate':
      return <WeddingTemplateForm {...formProps} />;
    
    case 'RoyalWeddingTemplate':
      return <RoyalWeddingTemplateForm {...formProps} />;
    
    case 'BirthdayTemplate':
      return <BirthdayTemplateForm {...formProps} />;
    
    case 'CorporateTemplate':
      return <CorporateTemplateForm {...formProps} />;
    
    default:
      // Fallback to the standard wedding template form for unknown templates
      return (
        <>
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Unknown Template Type</AlertTitle>
            <AlertDescription>
              Using default form for template: {template.name} ({template.component_name})
            </AlertDescription>
          </Alert>
          <WeddingTemplateForm {...formProps} />
        </>
      );
  }
};