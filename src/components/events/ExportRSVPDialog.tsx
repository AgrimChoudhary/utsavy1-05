import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, FileText, Table } from 'lucide-react';
import { Guest, RSVPField } from '@/types';
import { 
  ExportOptions, 
  generateCSVContent, 
  generatePDFContent, 
  downloadFile,
  filterGuestsByStatus
} from '@/utils/rsvpExportUtils';
import { toast } from '@/hooks/use-toast';

interface ExportRSVPDialogProps {
  isOpen: boolean;
  onClose: () => void;
  guests: Guest[];
  customFields: RSVPField[];
  eventName: string;
}

export const ExportRSVPDialog = ({ 
  isOpen, 
  onClose, 
  guests, 
  customFields, 
  eventName 
}: ExportRSVPDialogProps) => {
  const [format, setFormat] = useState<'csv' | 'pdf'>('csv');
  const [filter, setFilter] = useState<'all' | 'accepted' | 'submitted'>('all');
  const [includeCustomFields, setIncludeCustomFields] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const options: ExportOptions = {
        format,
        filter,
        includeCustomFields: includeCustomFields && customFields.length > 0
      };

      const data = {
        guests,
        customFields,
        eventName
      };

      const filteredGuests = filterGuestsByStatus(guests, filter);
      
      if (filteredGuests.length === 0) {
        toast({
          title: "No data to export",
          description: "No guests match the selected filter criteria.",
          variant: "destructive"
        });
        return;
      }

      const timestamp = new Date().toISOString().split('T')[0];
      
      if (format === 'csv') {
        const csvContent = generateCSVContent(data, options);
        downloadFile(
          csvContent, 
          `rsvp-data-${filter}-${timestamp}.csv`, 
          'text/csv'
        );
      } else {
        const pdfBlob = await generatePDFContent(data, options);
        downloadFile(
          pdfBlob, 
          `rsvp-report-${filter}-${timestamp}.html`, 
          'text/html'
        );
      }

      toast({
        title: "Export successful",
        description: `RSVP data exported successfully as ${format.toUpperCase()}.`
      });

      onClose();
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export failed",
        description: "There was an error exporting the data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getFilteredCount = (filterType: string) => {
    return filterGuestsByStatus(guests, filterType).length;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export RSVP Data
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Format</Label>
            <RadioGroup value={format} onValueChange={(value: 'csv' | 'pdf') => setFormat(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex items-center gap-2 cursor-pointer">
                  <Table className="h-4 w-4" />
                  CSV (Spreadsheet)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="flex items-center gap-2 cursor-pointer">
                  <FileText className="h-4 w-4" />
                  PDF Report (HTML)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Filter Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Filter Guests</Label>
            <RadioGroup value={filter} onValueChange={(value: 'all' | 'accepted' | 'submitted') => setFilter(value)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="all" id="all" />
                <Label htmlFor="all" className="cursor-pointer">
                  All Guests ({getFilteredCount('all')})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="accepted" id="accepted" />
                <Label htmlFor="accepted" className="cursor-pointer">
                  Accepted Only ({getFilteredCount('accepted')})
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="submitted" id="submitted" />
                <Label htmlFor="submitted" className="cursor-pointer">
                  Submitted RSVP Only ({getFilteredCount('submitted')})
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Custom Fields Option */}
          {customFields.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Include Custom Fields</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="custom-fields"
                  checked={includeCustomFields}
                  onCheckedChange={(checked) => setIncludeCustomFields(checked === true)}
                />
                <Label htmlFor="custom-fields" className="cursor-pointer">
                  Include custom RSVP fields as separate columns ({customFields.length} fields)
                </Label>
              </div>
              {includeCustomFields && (
                <div className="text-sm text-muted-foreground bg-muted p-3 rounded-lg">
                  <strong>Custom fields to include:</strong>
                  <ul className="mt-1 space-y-1">
                    {customFields.map(field => (
                      <li key={field.id} className="text-xs">• {field.field_label}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Preview Info */}
          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg text-sm">
            <p className="font-medium mb-1">Export Preview:</p>
            <p>• {getFilteredCount(filter)} guests will be included</p>
            <p>• Format: {format.toUpperCase()}</p>
            {includeCustomFields && customFields.length > 0 && (
              <p>• {customFields.length} custom fields included</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancel
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || getFilteredCount(filter) === 0}
            className="min-w-[120px]"
          >
            {isExporting ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Exporting...
              </div>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};