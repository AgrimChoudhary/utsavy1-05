import { Guest, RSVPField } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export interface ExportOptions {
  format: 'csv' | 'pdf';
  filter: 'all' | 'accepted' | 'submitted';
  includeCustomFields: boolean;
}

export interface ExportData {
  guests: Guest[];
  customFields: RSVPField[];
  eventName: string;
}

export const fetchRSVPFields = async (eventId: string): Promise<RSVPField[]> => {
  const { data, error } = await supabase
    .from('rsvp_field_definitions')
    .select('*')
    .eq('event_id', eventId)
    .order('display_order');

  if (error) {
    console.error('Error fetching RSVP fields:', error);
    return [];
  }

  return data as RSVPField[];
};

export const filterGuestsByStatus = (guests: Guest[], filter: string): Guest[] => {
  switch (filter) {
    case 'accepted':
      return guests.filter(guest => guest.accepted);
    case 'submitted':
      return guests.filter(guest => guest.accepted && guest.rsvp_data);
    default:
      return guests;
  }
};

export const generateCSVContent = (data: ExportData, options: ExportOptions): string => {
  const { guests, customFields } = data;
  const filteredGuests = filterGuestsByStatus(guests, options.filter);

  // Base headers
  const baseHeaders = [
    'Guest Name',
    'Mobile Number',
    'Status',
    'Response Date',
    'Accepted',
    'Has Custom Response'
  ];

  // Add custom field headers if requested
  const customFieldHeaders = options.includeCustomFields 
    ? customFields.map(field => field.field_label)
    : [];

  const headers = [...baseHeaders, ...customFieldHeaders];

  // Generate rows
  const rows = filteredGuests.map(guest => {
    const baseData = [
      `"${guest.name}"`,
      `"${guest.mobile_number}"`,
      getGuestStatus(guest),
      getResponseDate(guest),
      guest.accepted ? 'Yes' : 'No',
      guest.rsvp_data ? 'Yes' : 'No'
    ];

    // Add custom field data if requested
    const customFieldData = options.includeCustomFields
      ? customFields.map(field => {
          if (!guest.rsvp_data) return '""';
          const value = (guest.rsvp_data as any)[field.field_name];
          if (value === undefined || value === null) return '""';
          if (typeof value === 'boolean') return value ? 'Yes' : 'No';
          return `"${String(value)}"`;
        })
      : [];

    return [...baseData, ...customFieldData];
  });

  // Combine headers and rows
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
};

export const generatePDFContent = async (data: ExportData, options: ExportOptions): Promise<Blob> => {
  // For now, we'll create a simple HTML content that can be converted to PDF
  // In a real application, you might want to use a library like jsPDF or puppeteer
  const { guests, customFields, eventName } = data;
  const filteredGuests = filterGuestsByStatus(guests, options.filter);

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>RSVP Report - ${eventName}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 20px;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .title {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 16px;
          color: #666;
          margin-bottom: 5px;
        }
        .summary {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin-bottom: 20px;
        }
        .summary-item {
          display: inline-block;
          margin-right: 30px;
          font-weight: bold;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
          font-size: 12px;
        }
        th, td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        th {
          background-color: #f8f9fa;
          font-weight: bold;
        }
        .status-accepted {
          background-color: #d4edda;
          color: #155724;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
        }
        .status-submitted {
          background-color: #cce7ff;
          color: #0056b3;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
        }
        .status-viewed {
          background-color: #fff3cd;
          color: #856404;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
        }
        .status-pending {
          background-color: #f8d7da;
          color: #721c24;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
        }
        .footer {
          margin-top: 30px;
          text-align: center;
          font-size: 12px;
          color: #666;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="title">RSVP Report</div>
        <div class="subtitle">${eventName}</div>
        <div class="subtitle">Generated on ${new Date().toLocaleDateString()}</div>
      </div>

      <div class="summary">
        <span class="summary-item">Total Guests: ${guests.length}</span>
        <span class="summary-item">Accepted: ${guests.filter(g => g.accepted).length}</span>
        <span class="summary-item">Submitted: ${guests.filter(g => g.accepted && g.rsvp_data).length}</span>
        <span class="summary-item">Pending: ${guests.filter(g => !g.viewed).length}</span>
      </div>

      <table>
        <thead>
          <tr>
            <th>Guest Name</th>
            <th>Mobile</th>
            <th>Status</th>
            <th>Response Date</th>
            ${options.includeCustomFields ? customFields.map(field => `<th>${field.field_label}</th>`).join('') : ''}
          </tr>
        </thead>
        <tbody>
          ${filteredGuests.map(guest => `
            <tr>
              <td>${guest.name}</td>
              <td>${guest.mobile_number}</td>
              <td><span class="status-${getGuestStatusClass(guest)}">${getGuestStatus(guest)}</span></td>
              <td>${getResponseDate(guest)}</td>
              ${options.includeCustomFields ? customFields.map(field => {
                if (!guest.rsvp_data) return '<td>-</td>';
                const value = (guest.rsvp_data as any)[field.field_name];
                if (value === undefined || value === null) return '<td>-</td>';
                if (typeof value === 'boolean') return `<td>${value ? 'Yes' : 'No'}</td>`;
                return `<td>${String(value)}</td>`;
              }).join('') : ''}
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="footer">
        Report generated by Event Management System
      </div>
    </body>
    </html>
  `;

  return new Blob([html], { type: 'text/html' });
};

export const downloadFile = (content: string | Blob, filename: string, type: string) => {
  const blob = typeof content === 'string' 
    ? new Blob([content], { type }) 
    : content;
    
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

const getGuestStatus = (guest: Guest): string => {
  if (guest.accepted && guest.rsvp_data) {
    return 'Submitted';
  } else if (guest.accepted) {
    return 'Accepted';
  } else if (guest.viewed) {
    return 'Viewed';
  } else {
    return 'Pending';
  }
};

const getGuestStatusClass = (guest: Guest): string => {
  if (guest.accepted && guest.rsvp_data) {
    return 'submitted';
  } else if (guest.accepted) {
    return 'accepted';
  } else if (guest.viewed) {
    return 'viewed';
  } else {
    return 'pending';
  }
};

const getResponseDate = (guest: Guest): string => {
  if ((guest as any).custom_fields_submitted_at) {
    return new Date((guest as any).custom_fields_submitted_at).toLocaleDateString();
  } else if (guest.accepted_at) {
    return new Date(guest.accepted_at).toLocaleDateString();
  } else if (guest.viewed_at) {
    return new Date(guest.viewed_at).toLocaleDateString();
  }
  return '-';
};