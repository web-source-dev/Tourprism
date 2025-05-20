import { Summary } from '@/services/summaryService';
import { subDays, parseISO, isAfter, isBefore } from 'date-fns';

export interface FilterOptions {
  reportType: string;
  location: string;
  dateCreated: string;
  customDateStart?: string;
  customDateEnd?: string;
  deliveryMethod: string;
}

/**
 * Filters an array of summaries based on the given filter options
 * @param summaries Array of summaries to filter
 * @param filters Filter options to apply
 * @returns Filtered array of summaries
 */
export const filterSummaries = (
  summaries: Summary[],
  filters: FilterOptions
): Summary[] => {
  return summaries.filter((summary) => {
    // Filter by report type
    if (filters.reportType && summary.summaryType !== filters.reportType) {
      return false;
    }

    // Filter by location
    if (filters.location && filters.location !== 'Current Location') {
      const hasMatchingLocation = summary.locations?.some(
        (loc) => loc.city && loc.city.includes(filters.location)
      );
      if (!hasMatchingLocation) {
        return false;
      }
    }

    // Filter by date created
    if (filters.dateCreated) {
      const createdAt = parseISO(summary.createdAt);
      const now = new Date();
      
      if (filters.dateCreated === 'This Week') {
        // Start of current week (Sunday)
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - now.getDay());
        startOfWeek.setHours(0, 0, 0, 0);
        if (!isAfter(createdAt, startOfWeek)) {
          return false;
        }
      } else if (filters.dateCreated === 'Last 7 Days') {
        const sevenDaysAgo = subDays(now, 7);
        if (!isAfter(createdAt, sevenDaysAgo)) {
          return false;
        }
      } else if (filters.dateCreated === 'Last 30 Days') {
        const thirtyDaysAgo = subDays(now, 30);
        if (!isAfter(createdAt, thirtyDaysAgo)) {
          return false;
        }
      } else if (filters.dateCreated === 'Custom') {
        // Handle custom date range
        if (filters.customDateStart || filters.customDateEnd) {
          // If start date is provided, check if created date is after or equal to start date
          if (filters.customDateStart) {
            const startDate = parseISO(filters.customDateStart);
            startDate.setHours(0, 0, 0, 0); // Set to beginning of day
            if (isBefore(createdAt, startDate)) {
              return false;
            }
          }
          
          // If end date is provided, check if created date is before or equal to end date
          if (filters.customDateEnd) {
            const endDate = parseISO(filters.customDateEnd);
            endDate.setHours(23, 59, 59, 999); // Set to end of day
            if (isAfter(createdAt, endDate)) {
              return false;
            }
          }
        }
      }
    }

    // Filter by delivery method
    if (filters.deliveryMethod) {
      if (filters.deliveryMethod === 'Email') {
        if (!summary.emailDelivery?.recipients || summary.emailDelivery.recipients.length === 0) {
          return false;
        }
      } else if (filters.deliveryMethod === 'Auto-delivery') {
        if (!summary.emailDelivery?.scheduled) {
          return false;
        }
      } else if (filters.deliveryMethod === 'Manual only') {
        if (summary.emailDelivery?.scheduled || 
            (summary.emailDelivery?.recipients && summary.emailDelivery.recipients.length > 0)) {
          return false;
        }
      }
    }

    return true;
  });
};

/**
 * Extracts all unique locations from an array of summaries
 * @param summaries Array of summaries
 * @returns Array of unique location names
 */
export const extractLocations = (summaries: Summary[]): string[] => {
  const locationSet = new Set<string>();
  
  summaries.forEach(summary => {
    if (summary.locations && summary.locations.length > 0) {
      summary.locations.forEach(location => {
        if (location.city) {
          locationSet.add(location.city);
        }
      });
    }
  });
  
  return Array.from(locationSet);
}; 