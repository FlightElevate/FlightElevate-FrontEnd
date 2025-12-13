/**
 * Reusable date and time formatting utilities
 */

/**
 * Format date to "Jun 15" or "15 Jun" format
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  } catch (error) {
    return dateString;
  }
};

/**
 * Format time to "9 AM" or "3 PM" format
 */
export const formatTime = (timeString) => {
  if (!timeString) return 'N/A';
  
  try {
    // If it's a full datetime
    if (timeString.includes('T') || timeString.includes(' ')) {
      const date = new Date(timeString);
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric',
        minute: timeString.includes(':') && !timeString.endsWith(':00') ? '2-digit' : undefined,
        hour12: true 
      });
    }
    
    // If it's just time (HH:MM:SS)
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    
    return `${displayHour} ${ampm}`;
  } catch (error) {
    return timeString;
  }
};

/**
 * Format full datetime
 */
export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    return dateString;
  }
};

/**
 * Format date with year
 */
export const formatFullDate = (dateString) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
};

