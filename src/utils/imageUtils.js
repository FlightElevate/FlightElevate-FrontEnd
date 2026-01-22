import { API_BASE_URL } from '../api/config';

/**
 * Get full image URL from a path or URL
 * @param {string|null|undefined} imagePath - The image path or URL
 * @returns {string|null} - Full URL or null if no path provided
 */
export const getImageUrl = (imagePath) => {
  if (!imagePath) {
    return null;
  }

  // If already a full URL (http:// or https://), return as is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // If starts with /storage, prepend API base URL
  if (imagePath.startsWith('/storage')) {
    return `${API_BASE_URL}${imagePath}`;
  }

  // If it's a relative path, prepend API base URL with /storage
  if (imagePath.startsWith('/')) {
    return `${API_BASE_URL}${imagePath}`;
  }

  // Otherwise, assume it's a storage path and prepend /storage
  return `${API_BASE_URL}/storage/${imagePath}`;
};
