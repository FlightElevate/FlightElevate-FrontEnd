import { api } from '../apiClient';
import { ENDPOINTS } from '../config';


export const organizationService = {
  
  async getOrganizations(params = {}) {
    try {
      return await api.get(ENDPOINTS.ORGANIZATIONS.LIST, params);
    } catch (error) {
      console.error('Error fetching organizations:', error);
      throw error;
    }
  },

  
  async getOrganization(id) {
    try {
      return await api.get(ENDPOINTS.ORGANIZATIONS.SHOW(id));
    } catch (error) {
      console.error('Error fetching organization:', error);
      throw error;
    }
  },

  
  async updateOrganization(id, data) {
    try {
      // Check if we have a file to upload
      const hasFile = data.logo_file instanceof File;
      
      let requestData;
      
      if (hasFile) {
        // Use FormData for file uploads
        const formData = new FormData();
        
        // Append name if provided
        if (data.name !== undefined && data.name !== null) {
          formData.append('name', String(data.name).trim());
        }
        
        // Append logo file
        formData.append('logo_file', data.logo_file);
        
        if (import.meta.env.DEV) {
          console.log('Updating organization with FormData:', {
            id,
            name: data.name,
            hasLogoFile: true,
            fileName: data.logo_file.name,
            fileSize: data.logo_file.size,
            fileType: data.logo_file.type,
          });
        }
        
        requestData = formData;
      } else {
        // Use regular JSON for non-file updates
        requestData = {};
        if (data.name !== undefined && data.name !== null) {
          requestData.name = String(data.name).trim();
        }
        
        if (import.meta.env.DEV) {
          console.log('Updating organization with JSON:', {
            id,
            name: data.name,
            hasLogoFile: false,
          });
        }
      }
      
      // Use PUT which will handle FormData conversion to POST with _method=PUT
      return await api.put(ENDPOINTS.ORGANIZATIONS.UPDATE(id), requestData);
    } catch (error) {
      console.error('Error updating organization:', error);
      throw error;
    }
  },
};

