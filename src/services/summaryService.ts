import { api } from './api';

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
  impact?: string;
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
  impact?: string;
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
    impact?: string;
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

// Service functions
export const generateSummary = async (data: GenerateSummaryRequest): Promise<GenerateSummaryResponse> => {
  try {
    const requestData = {
      ...data,
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

export const getUpcomingForecasts = async (days: number = 7, location?: string, alertCategory?: string, impact?: string): Promise<ForecastResponse> => {
  try {
    const params = new URLSearchParams();
    if (days) params.append('days', days.toString());
    if (location) params.append('location', location);
    if (alertCategory) params.append('alertCategory', alertCategory);
    if (impact) params.append('impact', impact);
    
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
          alertCategory,
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

// Update the downloadPdf function to handle backend URLs properly
export const downloadPdf = async (pdfUrl: string, filename: string = 'forecast.pdf'): Promise<boolean> => {
  try {
    // Validate inputs
    if (!pdfUrl) {
      console.error('downloadPdf called with empty URL');
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
