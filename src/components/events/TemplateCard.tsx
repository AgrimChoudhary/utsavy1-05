import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Eye } from 'lucide-react';
import { Template } from '@/types';

interface TemplateCardProps {
  template: Template;
  onSelect: (template: Template) => void;
  onPreview: (template: Template) => void;
  isSelected: boolean;
}

export const TemplateCard = ({ template, onSelect, onPreview, isSelected }: TemplateCardProps) => {
  return (
    <Card className={`cursor-pointer transition-all hover:shadow-lg hover:scale-105 ${isSelected ? 'ring-2 ring-purple-500 shadow-lg' : ''}`}>
      <CardHeader className="p-4">
        <div className="aspect-video bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
          <img 
            src={template.thumbnail_url || '/placeholder.svg'} 
            alt={template.name}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-lg">{template.name}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-2">
        <Button 
          onClick={() => onPreview(template)}
          variant="outline"
          className="w-full"
        >
          <Eye className="h-4 w-4 mr-2" />
          Preview
        </Button>
        <Button 
          onClick={() => onSelect(template)}
          variant={isSelected ? "default" : "outline"}
          className="w-full"
        >
          {isSelected ? "Selected" : "Select Template"}
        </Button>
      </CardContent>
    </Card>
  );
};