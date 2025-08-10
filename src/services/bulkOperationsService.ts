import { supabase } from '@/integrations/supabase/client';
import { Guest } from '@/types';

type GuestStatus = 'pending' | 'viewed' | 'accepted' | 'submitted';

interface BulkOperationOptions {
  format: 'csv' | 'excel' | 'pdf';
  statusFilter?: GuestStatus[];
  includeCustomFields: boolean;
}
import { generateCSVContent, generatePDFContent, downloadFile, ExportOptions, ExportData } from '@/utils/rsvpExportUtils';

export class BulkOperationsService {
  /**
   * Reset all guest status to pending
   */
  static async resetAllGuestStatus(eventId: string): Promise<void> {
    const { error } = await supabase
      .from('guests')
      .update({ 
        viewed: false,
        accepted: false,
        rsvp_data: null,
        viewed_at: null,
        accepted_at: null
      })
      .eq('event_id', eventId);

    if (error) {
      throw new Error(`Failed to reset guest status: ${error.message}`);
    }
  }

  /**
   * Export RSVP data with filters
   */
  static async exportRSVPData(
    eventId: string, 
    eventName: string,
    options: BulkOperationOptions
  ): Promise<void> {
    try {
      // Build query based on filters
      let query = supabase
        .from('guests')
        .select('*')
        .eq('event_id', eventId);

      // Apply status filter if specified - now using simple logic
      if (options.statusFilter && options.statusFilter.length > 0) {
        // Since we simplified status, filter based on accepted and rsvp_data fields
        const needsAccepted = options.statusFilter.includes('accepted' as any) || options.statusFilter.includes('submitted' as any);
        const needsSubmitted = options.statusFilter.includes('submitted' as any);
        
        if (needsAccepted) {
          query = query.eq('accepted', true);
          if (needsSubmitted) {
            query = query.not('rsvp_data', 'is', null);
          }
        }
      }

      const { data: guests, error } = await query.order('created_at', { ascending: true });

      if (error) {
        throw new Error(`Failed to fetch guest data: ${error.message}`);
      }

      if (!guests || guests.length === 0) {
        throw new Error('No guests found matching the filter criteria');
      }

      // Get custom fields if needed
      let customFields: any[] = [];
      if (options.includeCustomFields) {
        const { data: fields } = await supabase
          .from('rsvp_field_definitions')
          .select('*')
          .eq('event_id', eventId)
          .order('display_order', { ascending: true });
        
        customFields = fields || [];
      }

      const exportData: ExportData = {
        guests: guests as any[],
        customFields,
        eventName
      };

      // Convert BulkOperationOptions to ExportOptions format
      const exportOptions: ExportOptions = {
        format: options.format === 'excel' ? 'csv' : options.format, // Excel maps to CSV for existing utils
        filter: options.statusFilter?.length ? 
          (options.statusFilter.includes('submitted') ? 'submitted' : 
           options.statusFilter.includes('accepted') ? 'accepted' : 'all') : 'all',
        includeCustomFields: options.includeCustomFields
      };

      // Generate export based on format
      let blob: Blob;
      let filename: string;
      let mimeType: string;

      switch (options.format) {
        case 'csv':
          const csvContent = generateCSVContent(exportData, exportOptions);
          blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          filename = `${eventName}_rsvp_export_${new Date().toISOString().split('T')[0]}.csv`;
          mimeType = 'text/csv';
          break;

        case 'excel':
          // For Excel, we'll use CSV format with Excel-friendly headers
          const excelContent = generateCSVContent(exportData, exportOptions);
          blob = new Blob(['\ufeff' + excelContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
          filename = `${eventName}_rsvp_export_${new Date().toISOString().split('T')[0]}.xlsx`;
          mimeType = 'application/vnd.ms-excel';
          break;

        case 'pdf':
          blob = await generatePDFContent(exportData, exportOptions);
          filename = `${eventName}_rsvp_export_${new Date().toISOString().split('T')[0]}.pdf`;
          mimeType = 'application/pdf';
          break;

        default:
          throw new Error('Invalid export format');
      }

      // Download the file
      downloadFile(blob, filename, mimeType);

    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  /**
   * Bulk delete selected guests
   */
  static async bulkDeleteGuests(guestIds: string[]): Promise<void> {
    if (guestIds.length === 0) {
      throw new Error('No guests selected for deletion');
    }

    const { error } = await supabase
      .from('guests')
      .delete()
      .in('id', guestIds);

    if (error) {
      throw new Error(`Failed to delete guests: ${error.message}`);
    }
  }

  /**
   * Bulk update guest status
   */
  static async bulkUpdateGuestStatus(
    guestIds: string[], 
    status: GuestStatus
  ): Promise<void> {
    if (guestIds.length === 0) {
      throw new Error('No guests selected for update');
    }

    const updates: any = {};

    // Set appropriate boolean flags based on status
    switch (status) {
      case 'pending':
        updates.viewed = false;
        updates.accepted = false;
        updates.rsvp_data = null;
        break;
      case 'viewed':
        updates.viewed = true;
        updates.accepted = false;
        updates.viewed_at = new Date().toISOString();
        break;
      case 'accepted':
        updates.viewed = true;
        updates.accepted = true;
        updates.viewed_at = new Date().toISOString();
        updates.accepted_at = new Date().toISOString();
        break;
      case 'submitted':
        updates.viewed = true;
        updates.accepted = true;
        updates.viewed_at = new Date().toISOString();
        updates.accepted_at = new Date().toISOString();
        // Note: rsvp_data should be set separately when actual data is provided
        break;
    }

    const { error } = await supabase
      .from('guests')
      .update(updates)
      .in('id', guestIds);

    if (error) {
      throw new Error(`Failed to update guest status: ${error.message}`);
    }
  }

  /**
   * Get filtered guest count for export preview
   */
  static async getFilteredGuestCount(
    eventId: string, 
    statusFilter?: GuestStatus[]
  ): Promise<number> {
    let query = supabase
      .from('guests')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', eventId);

    if (statusFilter && statusFilter.length > 0) {
      // Since we simplified status, filter based on accepted and rsvp_data fields
      const needsAccepted = statusFilter.includes('accepted' as any) || statusFilter.includes('submitted' as any);
      const needsSubmitted = statusFilter.includes('submitted' as any);
      
      if (needsAccepted) {
        query = query.eq('accepted', true);
        if (needsSubmitted) {
          query = query.not('rsvp_data', 'is', null);
        }
      }
    }

    const { count, error } = await query;

    if (error) {
      throw new Error(`Failed to count guests: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Check if bulk operation is allowed
   */
  static validateBulkOperation(
    guestIds: string[], 
    operation: 'delete' | 'update' | 'export'
  ): { valid: boolean; message?: string } {
    if (operation !== 'export' && guestIds.length === 0) {
      return { valid: false, message: 'No guests selected' };
    }

    if (operation === 'delete' && guestIds.length > 100) {
      return { valid: false, message: 'Cannot delete more than 100 guests at once' };
    }

    if (operation === 'update' && guestIds.length > 500) {
      return { valid: false, message: 'Cannot update more than 500 guests at once' };
    }

    return { valid: true };
  }
}