// Utility functions for date handling and filtering

// Convert a date to start and end of day for Firestore queries
export const getDateRange = (date) => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return { startOfDay, endOfDay };
};

// Format date for display
export const formatDate = (date) => {
  if (!date) return '';
  try {
    let dateObj;
    if (date.toDate) {
      // Firestore Timestamp
      dateObj = date.toDate();
    } else if (date.seconds) {
      // Firestore Timestamp in object form
      dateObj = new Date(date.seconds * 1000);
    } else if (typeof date === 'string') {
      // ISO string or other date string
      dateObj = new Date(date);
    } else if (date instanceof Date) {
      // Already a Date object
      dateObj = date;
    } else {
      return 'Invalid date';
    }

    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(dateObj);
  } catch (error) {
    console.error('Date formatting error:', error);
    return 'Invalid date';
  }
};

// Check if two dates are the same day
export const isSameDay = (date1, date2) => {
  if (!date1 || !date2) return false;
  
  const d1 = date1 instanceof Date ? date1 : new Date(date1);
  const d2 = date2 instanceof Date ? date2 : new Date(date2);
  
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
};

// Convert Firestore timestamp to Date object
export const convertFirestoreDate = (firestoreDate) => {
  if (!firestoreDate) return null;
  
  if (firestoreDate.toDate) {
    return firestoreDate.toDate();
  } else if (firestoreDate.seconds) {
    return new Date(firestoreDate.seconds * 1000);
  } else if (typeof firestoreDate === 'string') {
    return new Date(firestoreDate);
  } else if (firestoreDate instanceof Date) {
    return firestoreDate;
  }
  
  return null;
};

