import { api } from './api';
import { jsPDF } from 'jspdf';

// Types for the summary/forecast feature
export interface SummaryLocation {
  city?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  placeId?: string;
}

export interface SummaryParameters {
  startDate?: string;
  endDate?: string;
  locations?: SummaryLocation[];
  alertTypes?: string[];
  alertCategory?: string;
  impact?: string | string[];
  includeDuplicates?: boolean;
}

export interface Summary {
  _id: string;
  userId: string;
  title: string;
  description?: string;
  summaryType: 'custom' | 'automated' | 'forecast';
  parameters: SummaryParameters;
  timeRange: {
    startDate?: string;
    endDate?: string;
  };
  locations?: SummaryLocation[];
  includedAlerts?: string[] | unknown[];
  htmlContent?: string;
  pdfUrl?: string;
  emailDelivery?: {
    scheduled: boolean;
    frequency: 'once' | 'daily' | 'weekly';
    lastSent?: string;
    recipients?: string[];
  };
  createdAt: string;
  updatedAt: string;
}

export interface GenerateSummaryRequest {
  title: string;
  description?: string;
  summaryType?: 'custom' | 'automated' | 'forecast';
  startDate?: string;
  endDate?: string;
  locations?: SummaryLocation[];
  alertTypes?: string[];
  alertCategory?: string;
  impact?: string | string[];
  includeDuplicates?: boolean;
  generatePDF?: boolean;
  autoSave?: boolean;
  emailTo?: string[];
}

export interface GenerateSummaryResponse {
  success: boolean;
  summary: {
    title: string;
    description?: string;
    alerts: unknown[];
    duplicates: unknown[][];
    htmlContent: string;
    pdfUrl?: string;
    savedSummaryId?: string;
    _id?:string;
  };
}

export interface SummaryListResponse {
  success: boolean;
  summaries: Summary[];
}

export interface SummaryDetailResponse {
  success: boolean;
  summary: Summary;
}

export interface ForecastResponse {
  success: boolean;
  forecast: {
    title: string;
    description?: string;
    timeRange: {
      startDate: string;
      endDate: string;
    };
    location?: string;
    locations?: SummaryLocation[];
    alertCategory?: string;
    impact?: string | string[];
    alerts: unknown[];
    htmlContent: string;
    pdfUrl?: string;
    userRegions?: {
      name: string;
      latitude?: number;
      longitude?: number;
    }[];
  };
}

// Interface for alert items used in PDF generation
export interface AlertItem {
  title?: string;
  originCity?: string;
  city?: string;
  alertCategory?: string;
  alertType?: string;
  impact?: string;
  expectedStart?: string | Date;
  expectedEnd?: string | Date;
  description?: string;
}

// Service functions
export const generateSummary = async (data: GenerateSummaryRequest): Promise<GenerateSummaryResponse> => {
  try {
    // Handle alertTypes array for categories
    // If alertTypes is provided, use it directly without modifying based on alertCategory
    const requestData = {
      ...data,
      // If alertTypes is explicitly provided, use it; otherwise, leave it as is
      alertTypes: data.alertTypes || [],
      // We're now primarily using alertTypes array, so alertCategory is less important
      alertCategory: data.alertCategory === 'All' ? undefined : data.alertCategory,
      // Handle impact which can be string or string[]
      impact: Array.isArray(data.impact) 
        ? (data.impact.includes('All') ? undefined : data.impact) 
        : (data.impact === 'All' ? undefined : data.impact),
      generatePDF: true,
      autoSave: data.autoSave === true
    };
    
    const response = await api.post<GenerateSummaryResponse>('/api/summaries/generate', requestData);
    
    // If no alerts were found, return a friendly empty state
    if (!response.data.summary.alerts?.length) {
      const location = data.locations && data.locations.length > 0 
        ? data.locations[0].city 
        : 'Selected Region';
      
      return {
        success: true,
        summary: {
          ...response.data.summary,
          title: data.title || `No Alerts Found for ${location}`,
          description: `No disruptions were found for ${location} matching your criteria.`,
          alerts: [],
          duplicates: [],
          htmlContent: `
            <div class="no-alerts-message" style="text-align: center; padding: 30px; margin: 20px 0; background-color: #f5f5f5; border-radius: 8px; border-left: 4px solid #2196f3;">
              <h2 style="color: #333; margin-bottom: 20px;">No Alerts Found</h2>
              <p style="color: #666; margin-bottom: 15px;">Your selected area is currently clear of any reported disruptions matching your criteria.</p>
              <p style="color: #666; margin-bottom: 10px;">This means there are no significant events to report at this time.</p>
              <p style="color: #666;">Please check back later for updates or modify your search criteria.</p>
            </div>
          `
        }
      };
    }
    
    return response.data;
  } catch (error: unknown) {
    console.error('Error generating summary:', error);
    
    // Try to determine if this is a "no alerts" response misrepresented as an error
    const errorObj = error as { response?: { data?: { message?: string, success?: boolean } } };
    const errorMessage = errorObj.response?.data?.message || '';
    
    if (errorMessage.toLowerCase().includes('no alerts') || 
        errorMessage.toLowerCase().includes('no disruptions')) {
      // This is actually a "no data" situation, not an error
      const location = data.locations && data.locations.length > 0 
        ? data.locations[0].city 
        : 'Selected Region';
      
      return {
        success: true,
        summary: {
          title: data.title || `No Alerts Found for ${location}`,
          description: `No disruptions were found for ${location} matching your criteria.`,
          alerts: [],
          duplicates: [],
          htmlContent: `
            <div class="no-alerts-message" style="text-align: center; padding: 30px; margin: 20px 0; background-color: #f5f5f5; border-radius: 8px; border-left: 4px solid #2196f3;">
              <h2 style="color: #333; margin-bottom: 20px;">No Alerts Found</h2>
              <p style="color: #666; margin-bottom: 15px;">Your selected area is currently clear of any reported disruptions matching your criteria.</p>
              <p style="color: #666; margin-bottom: 10px;">This means there are no significant events to report at this time.</p>
              <p style="color: #666;">Please check back later for updates or modify your search criteria.</p>
            </div>
          `
        }
      };
    }
    
    // Create a more detailed error message for logging
    const errorDetail = errorObj.response?.data?.message || (error as Error).message || 'Unknown error';
    console.error(`Summary generation failed: ${errorDetail}`);
    
    // Return a user-friendly error state that can be displayed
    return {
      success: true, // Changed to true to handle gracefully in UI
      summary: {
        title: data.title || 'Alert Summary',
        description: 'We encountered an issue while preparing your summary.',
        alerts: [],
        duplicates: [],
        htmlContent: `
          <div class="error-message" style="text-align: center; padding: 30px; margin: 20px 0; background-color: #fff0f0; border-radius: 8px; border-left: 4px solid #f44336;">
            <h2 style="color: #d32f2f;">Unable to Generate Summary</h2>
            <p style="color: #666; margin-bottom: 10px;">We couldn't generate a complete report at this time.</p>
            <p style="color: #666;">Please try again in a few moments. If the issue persists, contact support.</p>
          </div>
        `
      }
    };
  }
};

export const getSavedSummaries = async (): Promise<SummaryListResponse> => {
  try {
    const response = await api.get<SummaryListResponse>('/api/summaries/saved');
    return response.data;
  } catch (error) {
    console.error('Error fetching saved summaries:', error);
    throw error;
  }
};

export const getSummaryById = async (summaryId: string): Promise<SummaryDetailResponse> => {
  try {
    const response = await api.get<SummaryDetailResponse>(`/api/summaries/${summaryId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching summary details:', error);
    throw error;
  }
};

export const deleteSummary = async (summaryId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const response = await api.delete<{ success: boolean; message: string }>(`/api/summaries/${summaryId}`);
    return response.data;
  } catch (error) {
    console.error('Error deleting summary:', error);
    throw error;
  }
};

export const getUpcomingForecasts = async (
  days: number = 7, 
  location?: string, 
  alertCategories?: string | string[], 
  impact?: string | string[], 
  generatePdfOnLoad: boolean = false
): Promise<ForecastResponse> => {
  try {
    const params = new URLSearchParams();
    if (days) params.append('days', days.toString());
    if (location) params.append('location', location);
    
    // Handle multiple alert categories
    if (alertCategories) {
      // If it's an array, append each category separately
      if (Array.isArray(alertCategories)) {
        // Skip if it contains 'All' or is empty
        if (!alertCategories.includes('All') && alertCategories.length > 0) {
          alertCategories.forEach(category => {
            params.append('alertCategory', category);
          });
        }
      } 
      // If it's a string and not 'All', append it
      else if (alertCategories !== 'All') {
        params.append('alertCategory', alertCategories);
      }
    }
    
    // Handle impact parameter that can be string or string array
    if (impact) {
      if (Array.isArray(impact)) {
        // Skip if it contains 'All' or is empty
        if (!impact.includes('All') && impact.length > 0) {
          impact.forEach(impactLevel => {
            params.append('impact', impactLevel);
          });
        }
      } 
      // If it's a string and not 'All', append it
      else if (impact !== 'All') {
        params.append('impact', impact);
      }
    }
    
    if (!generatePdfOnLoad) params.append('skipPdfGeneration', 'true');
    
    const query = params.toString();
    const url = query ? `/api/summaries/forecasts/upcoming?${query}` : '/api/summaries/forecasts/upcoming';
    
    const response = await api.get<ForecastResponse>(url);
    
    // Handle empty forecasts gracefully
    if (!response.data.success || !response.data.forecast || !response.data.forecast.alerts?.length) {
      return {
        success: true, // Changed to true since this is a valid state
        forecast: {
          title: `${days}-Day Alert Forecast`,
          timeRange: { 
            startDate: new Date().toISOString(), 
            endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() 
          },
          location: location || 'Your Operating Regions',
          alertCategory: Array.isArray(alertCategories) ? alertCategories.join(', ') : alertCategories,
          impact,
          alerts: [],
          htmlContent: '<div class="no-alerts-message"><p>No alerts found for this period. Your selected regions are currently clear of any reported disruptions.</p></div>',
          userRegions: [] // Empty array for no regions
        }
      };
    }
    
    return response.data;
  } catch (error) {
    console.error('Error generating forecast:', error);
    // Return a more user-friendly error state
    return {
      success: true, // Changed to true to handle this gracefully in UI
      forecast: {
        title: 'Temporary Service Disruption',
        timeRange: { 
          startDate: new Date().toISOString(), 
          endDate: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString() 
        },
        location: location || 'Your Operating Regions',
        alerts: [],
        htmlContent: '<div class="error-message"><p>We\'re having trouble accessing the forecast data. Please try again in a few moments.</p></div>',
        userRegions: []
      }
    };
  }
};

export const scheduleSummary = async (data: {
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  startDate?: string;
  endDate?: string;
  locations?: SummaryLocation[];
  alertTypes?: string[];
  includeDuplicates?: boolean;
  emailTo: string[];
}): Promise<{ success: boolean; message: string; scheduledSummaryId: string }> => {
  try {
    const response = await api.post<{ 
      success: boolean; 
      message: string; 
      scheduledSummaryId: string 
    }>('/api/summaries/schedule', data);
    return response.data;
  } catch (error) {
    console.error('Error scheduling summary:', error);
    throw error;
  }
};

// Update the generateClientPdf function to use autoTable as a separate import
export const generateClientPdf = async (alerts: AlertItem[], options: {
  title: string;
  startDate?: string | Date;
  endDate?: string | Date;
  location?: string;
  alertCategory?: string;
  impact?: string | string[];
}): Promise<Blob> => {
  try {
    const doc = new jsPDF();
    const { title, startDate, endDate, location, alertCategory, impact } = options;
    
    // Format dates for display
    const formatDate = (date: string | Date | undefined) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    };
    
    // Add header
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(title || 'Alert Summary', 105, 15, { align: 'center' });
    
    // Add subtitle with date range and location
    doc.setFontSize(11);
    const dateRange = startDate && endDate 
      ? `${formatDate(startDate)} - ${formatDate(endDate)}`
      : 'Custom Date Range';
    doc.text(dateRange, 105, 25, { align: 'center' });
    
    if (location) {
      doc.text(`Location: ${location}`, 105, 32, { align: 'center' });
    }
    
    // Add filters if applicable
    let filterText = '';
    if (alertCategory && alertCategory !== 'All') {
      filterText += `Category: ${alertCategory} | `;
    }
    if (impact && impact !== 'All') {
      filterText += `Impact: ${impact} | `;
    }
    
    if (filterText) {
      filterText = filterText.slice(0, -3); // Remove trailing " | "
      doc.text(filterText, 105, 39, { align: 'center' });
    }
    
    // Add horizontal line
    doc.setDrawColor(70, 70, 70);
    doc.line(20, 45, 190, 45);
    
    // If no alerts, add a message
    if (!alerts || alerts.length === 0) {
      doc.setFontSize(14);
      doc.text('No Alerts Found', 105, 60, { align: 'center' });
      doc.setFontSize(11);
      doc.text('There are currently no disruptions matching your criteria.', 105, 70, { align: 'center' });
    } else {
      // Remove table and display alerts in a card-like format
      let yPos = 55;
      
      // Add alert count
      doc.setFontSize(12);
      doc.setTextColor(100, 100, 100);
      doc.text(`${alerts.length} ${alerts.length === 1 ? 'alert' : 'alerts'} found`, 20, yPos);
      yPos += 10;
      
      alerts.forEach((alert: AlertItem) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }
        
        // Card background (light gray rectangle)
        doc.setFillColor(248, 248, 248);
        doc.rect(20, yPos, 170, 55, 'F');
        
        // Add impact color bar
        const getImpactColor = (impact: string) => {
          switch(impact) {
            case 'Severe': return [211, 47, 47]; // Red
            case 'Moderate': return [245, 124, 0]; // Orange
            case 'Minor': return [76, 175, 80]; // Green
            default: return [117, 117, 117]; // Gray
          }
        };
        
        const impactColor = getImpactColor(alert.impact || 'Moderate');
        doc.setFillColor(impactColor[0], impactColor[1], impactColor[2]);
        doc.rect(20, yPos, 1, 55, 'F');
        
        // Alert title
        doc.setFontSize(13);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        const title = alert.title || 'Untitled Alert';
        doc.text(title, 30, yPos + 10);
        
        // Location
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        const location = alert.originCity || alert.city || 'Location not specified';
        doc.text(`${location}`, 30, yPos + 20);
        
        // Type & Impact
        let typeText = '';
        if (alert.alertCategory) {
          typeText += `${alert.alertCategory}`;
        }
        if (alert.alertType && alert.alertType !== alert.alertCategory) {
          typeText += typeText ? `${alert.alertType}` : alert.alertType;
        }
        if (!typeText) {
          typeText = 'Type not specified';
        }
        
        doc.text(`${typeText} (${alert.impact || 'Impact not specified'})`, 30, yPos + 28);
        
        // Date range
        let dateText = '';
        if (alert.expectedStart) {
          const formattedStart = formatDate(alert.expectedStart);
          dateText += `From: ${formattedStart}`;
        }
        if (alert.expectedEnd) {
          const formattedEnd = formatDate(alert.expectedEnd);
          dateText += dateText ? ` To: ${formattedEnd}` : `To: ${formattedEnd}`;
        }
        if (dateText) {
          doc.text(`${dateText}`, 30, yPos + 36);
        }
        
        // Description (smaller font)
        doc.setFontSize(9);
        doc.setTextColor(60, 60, 60);
        
        // Handle long descriptions with word wrapping
        const description = alert.description || 'No description available';
        const splitDescription = doc.splitTextToSize(description, 150);
        
        // Only show first 2 lines of description in the card
        const displayLines = splitDescription.slice(0, 2);
        doc.text(displayLines, 30, yPos + 45);
        
        // Add ellipsis if there are more lines
        if (splitDescription.length > 2) {
          doc.text("...", 30, yPos + 52);
        }
        
        // Move y position for next alert
        yPos += 65; // Card height + margin
      });
    }
    
    // Add footer
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Generated by Tourprism | ${new Date().toLocaleDateString()}`, 
        105, 
        285, 
        { align: 'center' }
      );
      doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: 'right' });
    }
    
    // Return the PDF as a blob
    return doc.output('blob');
  } catch (error) {
    console.error('Error generating client-side PDF:', error);
    throw error;
  }
};

// Update the downloadPdf function to use client-side generation when possible
export const downloadPdf = async (pdfUrl: string | null, filename: string = 'forecast.pdf', alerts?: AlertItem[], options?: {
  title: string;
  startDate?: string | Date;
  endDate?: string | Date;
  location?: string;
  alertCategory?: string;
  impact?: string | string[];
}): Promise<boolean> => {
  try {
    // If we have alerts and options, generate PDF on the client side
    if (alerts && options) {
      try {
        const pdfBlob = await generateClientPdf(alerts, options);
        
        // Create a download link for the blob
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        
        // Trigger the download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the URL object
        URL.revokeObjectURL(url);
        
        return true;
      } catch (clientPdfError) {
        console.error('Error generating client-side PDF:', clientPdfError);
        // Fall back to server PDF if available
        if (!pdfUrl) return false;
      }
    }
    
    // Fall back to using the backend URL if client-side generation isn't possible
    // or we don't have alert data
    if (!pdfUrl) {
      console.error('downloadPdf called with empty URL and no alert data');
      return false;
    }
    
    // Make sure we have a complete URL
    const fullPdfUrl = pdfUrl.startsWith('http') 
      ? pdfUrl 
      : `${process.env.NEXT_PUBLIC_BACKEND_URL || ''}${pdfUrl}`;
    
    // Create a temporary anchor element to trigger the download
    const link = document.createElement('a');
    link.href = fullPdfUrl;
    link.setAttribute('download', filename);
    
    // Test that the URL is accessible before trying to download
    try {
      const response = await fetch(fullPdfUrl, { method: 'HEAD' });
      if (!response.ok) {
        console.error(`PDF URL returned status ${response.status}: ${fullPdfUrl}`);
        return false;
      }
    } catch (fetchError) {
      console.error('Error testing PDF URL:', fetchError);
      // Continue anyway - some servers don't support HEAD requests
    }
    
    // Trigger the download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    return true;
  } catch (error) {
    console.error('Error downloading PDF:', error);
    return false;
  }
};

// Add a function to generate PDF on-demand if not available
export const generatePdfOnDemand = async (summaryId: string): Promise<string | null> => {
  try {
    // Special endpoint to specifically generate a PDF for an existing summary
    const response = await api.post<{success: boolean; pdfUrl: string; message?: string}>(`/api/summaries/${summaryId}/generate-pdf`);
    
    if (response.data.success && response.data.pdfUrl) {
      return response.data.pdfUrl;
    }
    
    console.warn('PDF generation responded with success=true but no PDF URL', response.data);
    return null;
  } catch (error: unknown) {
    // Log the detailed error for debugging
    console.error('Error generating PDF on demand:', error);
    
    // Check if this is a "no alerts" situation (which isn't actually an error)
    const errorMessage = (error as { response?: { data?: { message?: string } } }).response?.data?.message || '';
    if (errorMessage.toLowerCase().includes('no alerts') || 
        errorMessage.toLowerCase().includes('no disruptions')) {
      console.log('Detected "no alerts" situation during PDF generation');
    }
    
    // Return null to let the caller handle the fallback
    return null;
  }
};
