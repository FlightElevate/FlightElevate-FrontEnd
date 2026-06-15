import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../hooks/useRole';
import { settingsService } from '../../api/services/settingsService';
import { documentService } from '../../api/services/documentService';
import { authService } from '../../api/services/authService';
import { organizationService } from '../../api/services/organizationService';
import { showSuccessToast, showErrorToast, showConfirmDialog } from '../../utils/notifications';
import { FiSearch, FiEye, FiEyeOff, FiTrash2, FiCamera, FiMapPin, FiPlus } from 'react-icons/fi';
import { locationService } from '../../api/services/locationService';
import { MdFilterList } from 'react-icons/md';
import { HiDotsVertical } from 'react-icons/hi';

const Setting = () => {
  const { user, refreshUser } = useAuth();
  const { isSuperAdmin, isAdmin } = useRole();
  
  
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('settingsActiveTab');
    return savedTab || 'profile';
  });
  const [loading, setLoading] = useState(false);
  
  
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('settingsActiveTab', activeTab);
    }
  }, [activeTab]);

  useEffect(() => {
    if (isSuperAdmin() && (activeTab === 'documents' || activeTab === 'payment')) {
      setActiveTab('profile');
    }
  }, [isSuperAdmin, activeTab]);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [newDocument, setNewDocument] = useState({
    title: '',
    expiry_date: '',
    details: '',
    file: null,
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [paymentMenuOpen, setPaymentMenuOpen] = useState(null);
  const paymentMenuRefs = useRef({});
  
  
  const [organization, setOrganization] = useState(null);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationLogoFile, setOrganizationLogoFile] = useState(null);
  const [organizationLogoPreview, setOrganizationLogoPreview] = useState(null);
  const [uploadingOrgLogo, setUploadingOrgLogo] = useState(false);
  const [loadingOrganization, setLoadingOrganization] = useState(false);
  const [allOrganizations, setAllOrganizations] = useState([]);
  const [fetchingAllOrgs, setFetchingAllOrgs] = useState(false);
  const [joinOrgSearch, setJoinOrgSearch] = useState('');
  const [joiningOrgId, setJoiningOrgId] = useState(null);

  // --- Locations state (admin only) ---
  const [locationsList, setLocationsList] = useState([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [newLocationName, setNewLocationName] = useState('');
  const [newLocationAddress, setNewLocationAddress] = useState('');
  const [savingLocation, setSavingLocation] = useState(false);
  const [deletingLocationId, setDeletingLocationId] = useState(null);

  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const res = await locationService.getLocations();
      if (res.success && Array.isArray(res.data)) {
        setLocationsList(res.data);
      }
    } catch (e) {
      console.error('Error fetching locations:', e);
    } finally {
      setLoadingLocations(false);
    }
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) {
      showErrorToast('Location name is required');
      return;
    }
    setSavingLocation(true);
    try {
      const res = await locationService.createLocation({ name: newLocationName.trim(), address: newLocationAddress.trim() });
      if (res.success) {
        showSuccessToast('Location added successfully');
        setNewLocationName('');
        setNewLocationAddress('');
        fetchLocations();
      } else {
        showErrorToast(res.message || 'Failed to add location');
      }
    } catch (e) {
      showErrorToast(e.response?.data?.message || 'Failed to add location');
    } finally {
      setSavingLocation(false);
    }
  };

  const handleDeleteLocation = async (locId, locName) => {
    const confirmed = await showConfirmDialog('Delete Location', `Delete "${locName}"? This will affect students assigned to this location.`, 'Yes, delete');
    if (!confirmed) return;
    setDeletingLocationId(locId);
    try {
      const res = await locationService.deleteLocation(locId);
      if (res.success) {
        showSuccessToast('Location deleted');
        fetchLocations();
      }
    } catch (e) {
      showErrorToast('Failed to delete location');
    } finally {
      setDeletingLocationId(null);
    }
  };

  
  const [profileData, setProfileData] = useState({
    first_name: '',
    last_name: '',
    date_of_birth: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    country: '',
    city: '',
    postal_code: '',
  });

  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  
  useEffect(() => {
    const fetchOrganizationData = async () => {
      
      const orgId = user?.organization_id || user?.organization?.id;
      
      if (!isAdmin() || !orgId) {
        
        setOrganization(null);
        setOrganizationName('');
        setOrganizationLogoPreview(null);
        return;
      }
      
      
      if (user?.organization?.name) {
        setOrganization(user.organization);
        setOrganizationName(user.organization.name || '');
        if (user.organization.logo) {
          setOrganizationLogoPreview(user.organization.logo);
        }
        setLoadingOrganization(false);
        return;
      }
      
      
      if (organization?.name && organizationName) {
        return;
      }
      
      setLoadingOrganization(true);
      try {
        const response = await organizationService.getOrganization(orgId);
        if (response.success && response.data) {
          setOrganization(response.data);
          setOrganizationName(response.data.name || '');
          if (response.data.logo) {
            setOrganizationLogoPreview(response.data.logo);
          }
        }
      } catch (err) {
        console.error('Error fetching organization data:', err);
      } finally {
        setLoadingOrganization(false);
      }
    };

    if (user) {
      fetchOrganizationData();
    }
  }, [user?.organization_id, user?.organization?.id, user?.organization?.name, user?.organization?.logo, user]);

  
  useEffect(() => {
    
    const orgId = user?.organization_id || user?.organization?.id || organization?.id;
    
    if (activeTab === 'organization' && isAdmin() && orgId) {
      
      if (!organizationName && (!organization || !organization.name)) {
        const fetchData = async () => {
          setLoadingOrganization(true);
          try {
            const response = await organizationService.getOrganization(orgId);
            if (response.success && response.data) {
              setOrganization(response.data);
              setOrganizationName(response.data.name || '');
              if (response.data.logo) {
                setOrganizationLogoPreview(response.data.logo);
              }
            }
          } catch (err) {
            console.error('Error fetching organization data:', err);
          } finally {
            setLoadingOrganization(false);
          }
        };
        fetchData();
      }
    }
  }, [activeTab, user?.organization_id, user?.organization?.id, organization?.id, organizationName, organization]);

  const fetchAllOrganizations = async () => {
    setFetchingAllOrgs(true);
    try {
      const response = await organizationService.getOrganizations({
        search: joinOrgSearch
      });
      if (response.success) {
        setAllOrganizations(response.data || []);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
    } finally {
      setFetchingAllOrgs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'join-organization') {
      fetchAllOrganizations();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'locations' && isAdmin()) {
      fetchLocations();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'join-organization') {
      const timer = setTimeout(fetchAllOrganizations, 300);
      return () => clearTimeout(timer);
    }
  }, [joinOrgSearch]);

  const handleJoinOrg = async (orgId) => {
    setJoiningOrgId(orgId);
    try {
      const response = await organizationService.joinOrganization(orgId);
      if (response.success) {
        showSuccessToast(response.message || 'Join request submitted successfully');
        // Refresh to show pending status if we had one
        fetchAllOrganizations();
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to submit join request');
    } finally {
      setJoiningOrgId(null);
    }
  };

  
  useEffect(() => {
    const fetchSettingsData = async () => {
      setLoadingUserData(true);
      try {
        const response = await settingsService.getSettings();
        if (response.success && response.data) {
          const settingsData = response.data;
          
          const nameParts = (settingsData.name || '').split(' ');
          setProfileData({
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            date_of_birth: settingsData.date_of_birth || '',
            gender: settingsData.gender || '',
            email: settingsData.email || '',
            phone: settingsData.phone || '',
            address: settingsData.address || '',
            country: settingsData.country || '',
            city: settingsData.city || '',
            postal_code: settingsData.postal_code || '',
          });
          
          if (settingsData) {
            const formattedDOB = settingsData.date_of_birth ? new Date(settingsData.date_of_birth).toISOString().split('T')[0] : '';
            
            setFormData(prev => ({
              ...prev,
              ...settingsData,
              date_of_birth: formattedDOB
            }));
          }
          
          
          if (settingsData.avatar) {
            setAvatarPreview(settingsData.avatar);
          }

          
          if (isAdmin() && settingsData.organization) {
            setOrganization(settingsData.organization);
            setOrganizationName(settingsData.organization.name || '');
            if (settingsData.organization.logo) {
              setOrganizationLogoPreview(settingsData.organization.logo);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching settings data:', err);
        showErrorToast('Failed to load settings data');
        
        if (user) {
          const nameParts = (user.name || '').split(' ');
          setProfileData({
            first_name: nameParts[0] || '',
            last_name: nameParts.slice(1).join(' ') || '',
            date_of_birth: user.date_of_birth || '',
            gender: user.gender || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
            country: user.country || '',
            city: user.city || '',
            postal_code: user.postal_code || '',
          });
        }
      } finally {
        setLoadingUserData(false);
      }
    };

    fetchSettingsData();
  }, []); 

  useEffect(() => {
    if (isSuperAdmin() && activeTab === 'documents') {
      setActiveTab('profile');
      return;
    }
    if (activeTab === 'documents') {
      fetchDocuments();
    }
    if (activeTab === 'payment') {
      fetchPaymentHistory();
    }
  }, [activeTab, user, isSuperAdmin]);

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedOutsideAllMenus = Object.values(paymentMenuRefs.current).every(
        (ref) => !ref?.contains(event.target)
      );
      if (clickedOutsideAllMenus) {
        setPaymentMenuOpen(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchDocuments = async () => {
    if (!user?.id) return;
    setLoadingDocs(true);
    try {
      const response = await documentService.getUserDocuments(user.id);
      if (response.success) {
        const docs = response.data || [];
        setDocuments(docs);
        
        setSelectedDocuments(docs.map(doc => doc.id));
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleDocumentToggle = (docId) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleNewDocumentChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file' && files && files[0]) {
      setSelectedFile(files[0]);
      setNewDocument(prev => ({ ...prev, file: files[0] }));
    } else {
      setNewDocument(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAddDocument = async () => {
    if (!user?.id) return;
    if (!newDocument.title.trim()) {
      showErrorToast('Please enter document title');
      return;
    }

    setLoading(true);
    try {
      
      const formData = new FormData();
      formData.append('title', newDocument.title);
      if (newDocument.expiry_date) {
        formData.append('expiry_date', newDocument.expiry_date);
      }
      if (newDocument.details) {
        formData.append('details', newDocument.details);
      }
      if (newDocument.file) {
        formData.append('file', newDocument.file);
      }

      const response = await documentService.createDocument(user.id, formData);

      if (response.success) {
        showSuccessToast('Document added successfully');
        setNewDocument({ title: '', expiry_date: '', details: '', file: null });
        setSelectedFile(null);
        setShowAddDocument(false);
        
        await fetchDocuments();
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to add document');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDocument = async (docId, docTitle) => {
    if (!user?.id) return;

    const confirmed = await showConfirmDialog(
      'Delete Document',
      `Are you sure you want to delete "${docTitle}"? This action cannot be undone.`,
      'Yes, delete'
    );

    if (!confirmed) return;

    setDeletingDocId(docId);
    try {
      const response = await documentService.deleteDocument(user.id, docId);
      if (response.success) {
        showSuccessToast('Document deleted successfully');
        
        setSelectedDocuments(prev => prev.filter(id => id !== docId));
        
        await fetchDocuments();
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to delete document');
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      
      if (file.size > 2 * 1024 * 1024) {
        showErrorToast('Image size must be less than 2MB');
        return;
      }
      
      
      if (!file.type.startsWith('image/')) {
        showErrorToast('Please select a valid image file');
        return;
      }

      setAvatarFile(file);
      
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !(avatarFile instanceof File) || !user?.id) {
      console.error('Invalid avatar file:', avatarFile);
      showErrorToast('Please select a valid image file');
      return;
    }
    
    setUploadingAvatar(true);
    try {
      // Create FormData with avatar file
      const formData = new FormData();
      // IMPORTANT: Append file with name parameter
      formData.append('avatar', avatarFile, avatarFile.name);
      
      // Debug: Log FormData contents
      console.log('Uploading avatar:', {
        fileName: avatarFile.name,
        fileSize: avatarFile.size,
        fileType: avatarFile.type,
        hasFile: formData.has('avatar'),
      });
      
      // Debug: Log FormData entries
      console.log('FormData entries:');
      for (let pair of formData.entries()) {
        console.log(pair[0] + ': ', pair[1]);
      }
      
      const response = await settingsService.updateSettingsWithFile(formData);
      
      console.log('Avatar upload response:', response);
      
      if (response.success) {
        showSuccessToast('Profile picture updated successfully');
        setAvatarFile(null);
        setAvatarPreview(null);
        
        // Response structure: { success: true, data: { avatar: 'url', ... }, meta: 'message' }
        const avatarUrl = response.data?.avatar;
        
        if (avatarUrl) {
          const updatedUser = { 
            ...user, 
            avatar: avatarUrl
          };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Refresh user in AuthContext to update header avatar immediately
          await refreshUser();
          
          // Refresh page after short delay to ensure all components update
          setTimeout(() => window.location.reload(), 500);
        } else {
          console.error('Avatar URL not found in response:', response);
          showErrorToast('Avatar URL not received in response');
        }
      } else {
        console.error('Avatar upload failed:', response);
        showErrorToast(response.errors?.message || response.message || 'Failed to update profile picture');
      }
    } catch (err) {
      console.error('Avatar upload error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update profile picture';
      showErrorToast(errorMsg);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleProfileSave = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const fullName = `${profileData.first_name} ${profileData.last_name}`.trim();
      
      // Check if avatar file is present - if yes, use FormData, otherwise use JSON
      if (avatarFile && avatarFile instanceof File) {
        // Use FormData to include both profile data and avatar file
        const formData = new FormData();
        
        // Append all profile fields
        formData.append('name', fullName);
        formData.append('email', profileData.email || '');
        formData.append('phone', profileData.phone || '');
        formData.append('username', user.username || '');
        if (profileData.date_of_birth) formData.append('date_of_birth', profileData.date_of_birth);
        if (profileData.gender) formData.append('gender', profileData.gender);
        if (profileData.address) formData.append('address', profileData.address);
        if (profileData.country) formData.append('country', profileData.country);
        if (profileData.city) formData.append('city', profileData.city);
        if (profileData.postal_code) formData.append('postal_code', profileData.postal_code);
        
        // IMPORTANT: Append avatar file with explicit filename
        formData.append('avatar', avatarFile, avatarFile.name);
        
        // Verify file is in FormData
        if (!formData.has('avatar')) {
          console.error('ERROR: Avatar file not added to FormData!');
          showErrorToast('Failed to prepare avatar file for upload');
          setLoading(false);
          return;
        }
        
        // Debug: Log FormData contents
        console.log('Saving profile with avatar:', {
          name: fullName,
          email: profileData.email,
          hasAvatar: formData.has('avatar'),
          avatarFile: avatarFile ? {
            name: avatarFile.name,
            size: avatarFile.size,
            type: avatarFile.type,
            isFile: avatarFile instanceof File,
          } : null,
        });
        
        // Debug: Log all FormData entries
        console.log('FormData entries:');
        for (let pair of formData.entries()) {
          console.log(pair[0] + ': ', pair[1] instanceof File ? `[File: ${pair[1].name}]` : pair[1]);
        }
        
        const response = await settingsService.updateSettingsWithFile(formData);
        
        if (response.success) {
          showSuccessToast('Settings updated successfully');
          
          const updatedUser = { ...user, ...response.data };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Refresh user in AuthContext to update header avatar immediately
          await refreshUser();
          
          // Clear avatar file state after successful upload
          setAvatarFile(null);
          setAvatarPreview(null);
          
          // Small delay before reload to ensure state is updated
          setTimeout(() => window.location.reload(), 500);
        }
      } else {
        // No avatar file - use regular JSON request
        const response = await settingsService.updateSettings({
          name: fullName,
          email: profileData.email,
          phone: profileData.phone,
          username: user.username, 
          date_of_birth: profileData.date_of_birth || null,
          gender: profileData.gender || null,
          address: profileData.address || null,
          country: profileData.country || null,
          city: profileData.city || null,
          postal_code: profileData.postal_code || null,
        });
        
        if (response.success) {
          showSuccessToast('Settings updated successfully');
          
          const updatedUser = { ...user, ...response.data };
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          // Refresh user in AuthContext to update header avatar
          await refreshUser();
          
          setTimeout(() => window.location.reload(), 500);
        }
      }
    } catch (err) {
      console.error('Profile save error:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update settings';
      showErrorToast(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      showErrorToast('New passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const response = await authService.changePassword(
        passwordData.current_password,
        passwordData.new_password,
        passwordData.confirm_password
      );
      if (response.success) {
        showSuccessToast('Password updated successfully');
        
        
        try {
          const settingsResponse = await settingsService.getSettings();
          if (settingsResponse.success) {
            const updatedUser = { ...user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            setPasswordData({
              current_password: '', 
              new_password: '',
              confirm_password: '',
            });
            setShowPasswords({
              current: false,
              new: false,
              confirm: false
            });
          } else {
            // Fallback
            setPasswordData(prev => ({
              ...prev,
              current_password: '',
              new_password: '',
              confirm_password: '',
            }));
          }
        } catch (settingsErr) {
          console.error('Error refreshing settings:', settingsErr);
          
          setPasswordData(prev => ({
            ...prev,
            new_password: '',
            confirm_password: '',
          }));
        }
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileCancel = () => {
    if (user) {
      const nameParts = (user.name || '').split(' ');
      setProfileData({
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender || '',
        email: user.email || '',
        phone: user.phone || '',
        address: user.address || '',
        country: user.country || '',
        city: user.city || '',
        postal_code: user.postal_code || '',
      });
    }
  };

  const handlePasswordCancel = () => {
    setPasswordData({
      current_password: '',
      new_password: '',
      confirm_password: '',
    });
  };

  
  const handleOrganizationLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast('Image size must be less than 5MB');
        return;
      }
      
      
      if (!file.type.startsWith('image/')) {
        showErrorToast('Please select a valid image file');
        return;
      }

      setOrganizationLogoFile(file);
      
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setOrganizationLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOrganizationLogoUpload = async () => {
    
    const orgId = user?.organization_id || user?.organization?.id || organization?.id;
    
    if (!organizationLogoFile || !orgId) {
      showErrorToast('Please select a logo file');
      return;
    }
    
    setUploadingOrgLogo(true);
    try {
      
      const currentName = organizationName || organization?.name || '';
      const updateData = {
        logo_file: organizationLogoFile,
      };
      
      
      if (currentName) {
        updateData.name = currentName;
      }

      const response = await organizationService.updateOrganization(orgId, updateData);
      
      if (response.success) {
        showSuccessToast('Organization logo updated successfully');
        setOrganizationLogoFile(null);
        if (response.data?.logo) {
          setOrganizationLogoPreview(response.data.logo);
          setOrganization(prev => ({ ...prev, logo: response.data.logo }));
        }
        
        if (response.data?.name) {
          setOrganizationName(response.data.name);
        }
        
        localStorage.setItem('settingsActiveTab', 'organization');
        
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showErrorToast(response.message || 'Failed to update organization logo');
      }
    } catch (err) {
      console.error('Error updating organization logo:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update organization logo';
      showErrorToast(errorMsg);
    } finally {
      setUploadingOrgLogo(false);
    }
  };

  const handleOrganizationSave = async () => {
    
    const orgId = user?.organization_id || user?.organization?.id || organization?.id;
    
    if (!orgId) {
      showErrorToast('Organization ID not found');
      return;
    }

    
    const nameToSave = organizationName || organization?.name || '';
    if (!nameToSave.trim()) {
      showErrorToast('Organization name is required');
      return;
    }
    
    setLoading(true);
    try {
      const updateData = {
        name: nameToSave.trim(),
      };

      
      if (organizationLogoFile) {
        updateData.logo_file = organizationLogoFile;
      }

      const response = await organizationService.updateOrganization(orgId, updateData);
      
      if (response.success) {
        showSuccessToast('Organization updated successfully');
        setOrganization(response.data);
        setOrganizationName(response.data.name || '');
        setOrganizationLogoFile(null);
        if (response.data?.logo) {
          setOrganizationLogoPreview(response.data.logo);
        }
        
        localStorage.setItem('settingsActiveTab', 'organization');
        
        setTimeout(() => window.location.reload(), 1000);
      } else {
        showErrorToast(response.message || 'Failed to update organization');
      }
    } catch (err) {
      console.error('Error updating organization:', err);
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update organization';
      showErrorToast(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOrganizationCancel = () => {
    if (organization) {
      setOrganizationName(organization.name || '');
      setOrganizationLogoPreview(organization.logo || null);
    }
    setOrganizationLogoFile(null);
  };

  
  // ── Payment history (real API) ─────────────────────────────────────────
  const [paymentHistory, setPaymentHistory]     = useState([]);
  const [loadingPayments, setLoadingPayments]   = useState(false);
  const [selectedInvoice, setSelectedInvoice]   = useState(null); // for detail modal

  const fetchPaymentHistory = async () => {
    setLoadingPayments(true);
    try {
      const res = await settingsService.getPaymentHistory();
      if (res.success) {
        setPaymentHistory(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching payment history:', err);
    } finally {
      setLoadingPayments(false);
    }
  };

  const filteredPayments = paymentHistory.filter(p =>
    (p.invoice_number || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.aircraft_name  || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.flight_type    || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'password', label: 'Password' },
    ...(!isSuperAdmin() ? [{ id: 'documents', label: 'Documents' }] : []),
    ...(!isSuperAdmin() ? [{ id: 'payment', label: 'Payment' }] : []),
    // { id: 'join-organization', label: 'Join Organization' },
    ...(isAdmin() ? [{ id: 'organization', label: 'Organization' }] : []),
    ...(isAdmin() ? [{ id: 'locations', label: 'Locations' }] : []),
  ];

  return (
    <div className="md:mt-5 mx-auto max-w-full">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <h2 className="text-xl font-semibold text-gray-800 px-4 sm:px-6 py-4 border-b border-gray-200">
          Settings
        </h2>

        {}
        <div className="bg-white border-b border-gray-200">
          {}
          <div className="md:hidden">
            <div className="flex flex-col px-4 py-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full text-left py-3 px-4 rounded-md text-sm font-medium transition-colors min-h-[44px] flex items-center ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop Tab Buttons */}
          <div className="hidden md:block">
            <div className="flex gap-2 px-6 py-4 overflow-x-auto max-w-full">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-2.5 px-4 rounded-md text-sm font-medium transition-colors whitespace-nowrap flex-shrink-0 flex items-center justify-center ${
                    activeTab === tab.id
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-100 active:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {}
        <div className="p-4 sm:p-6">
          {}
          {loadingUserData && activeTab === 'profile' && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {}
          {activeTab === 'profile' && !loadingUserData && (
            <div className="bg-white rounded-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-6 sm:mb-8 gap-4">
                <h3 className="text-lg font-semibold text-gray-800">Profile</h3>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleProfileCancel}
                    className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProfileSave}
                    disabled={loading}
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 min-h-[44px]"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {}
              <div className="flex justify-center mb-8">
                <div className="text-center">
                  <div className="relative w-32 h-32 mx-auto mb-3 flex-shrink-0">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile"
                        className="w-32 h-32 rounded-full object-cover border-4 border-gray-300 shadow-md flex-shrink-0"
                        style={{ width: '128px', height: '128px', minWidth: '128px', minHeight: '128px', maxWidth: '128px', maxHeight: '128px' }}
                      />
                    ) : (
                      <div className="w-32 h-32 rounded-full bg-blue-500 flex items-center justify-center text-white text-3xl font-semibold shadow-md flex-shrink-0" style={{ width: '128px', height: '128px', minWidth: '128px', minHeight: '128px' }}>
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2.5 cursor-pointer hover:bg-blue-700 transition shadow-lg min-w-[40px] min-h-[40px] flex items-center justify-center">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </label>
                  </div>
                  {avatarFile && (
                    <div className="space-y-2">
                      <p className="text-xs text-gray-600">{avatarFile.name}</p>
                      <button
                        onClick={handleAvatarUpload}
                        disabled={uploadingAvatar}
                        className="text-sm bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {uploadingAvatar ? 'Uploading...' : 'Upload Photo'}
                      </button>
                      <button
                        onClick={() => {
                          setAvatarFile(null);
                          setAvatarPreview(user?.avatar || null);
                        }}
                        className="block text-sm text-gray-600 hover:text-gray-700 mt-1"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  {!avatarFile && (
                    <p className="text-xs text-gray-500 mt-1">Click camera icon to change photo</p>
                  )}
                </div>
              </div>

              {}
              <div className="mb-8">
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-8">
                  <h4 className="text-sm font-semibold text-gray-700 w-full sm:w-48 flex-shrink-0">Personal Information</h4>
                  <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        name="first_name"
                        value={profileData.first_name}
                        onChange={handleProfileChange}
                        placeholder="Enter..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Last Name</label>
                      <input
                        type="text"
                        name="last_name"
                        value={profileData.last_name}
                        onChange={handleProfileChange}
                        placeholder="Enter..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Date of Birth</label>
                      <div className="relative">
                        <input
                          type="date"
                          name="date_of_birth"
                          value={profileData.date_of_birth}
                          onChange={handleProfileChange}
                          placeholder="Enter..."
                          className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Gender</label>
                      <select
                        name="gender"
                        value={profileData.gender}
                        onChange={handleProfileChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[44px]"
                      >
                        <option value="">Enter...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {}
              <div>
                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-8">
                  <h4 className="text-sm font-semibold text-gray-700 w-full sm:w-48 flex-shrink-0">Contact Information</h4>
                  <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        placeholder="Enter..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Number</label>
                      <input
                        type="tel"
                        name="phone"
                        value={profileData.phone}
                        onChange={handleProfileChange}
                        placeholder="Enter..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm text-gray-700 mb-2">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={profileData.address}
                        onChange={handleProfileChange}
                        placeholder="Enter..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Country</label>
                      <input
                        type="text"
                        name="country"
                        value={profileData.country}
                        onChange={handleProfileChange}
                        list="country-list"
                        placeholder="Select or type a country..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[44px]"
                      />
                      <datalist id="country-list">
                        <option value="USA">USA</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Australia">Australia</option>
                        <option value="Germany">Germany</option>
                        <option value="France">France</option>
                        <option value="Italy">Italy</option>
                        <option value="Spain">Spain</option>
                        <option value="Netherlands">Netherlands</option>
                        <option value="Belgium">Belgium</option>
                        <option value="Switzerland">Switzerland</option>
                        <option value="Austria">Austria</option>
                        <option value="Sweden">Sweden</option>
                        <option value="Norway">Norway</option>
                        <option value="Denmark">Denmark</option>
                        <option value="Finland">Finland</option>
                        <option value="Poland">Poland</option>
                        <option value="Portugal">Portugal</option>
                        <option value="Greece">Greece</option>
                        <option value="Ireland">Ireland</option>
                        <option value="New Zealand">New Zealand</option>
                        <option value="Japan">Japan</option>
                        <option value="South Korea">South Korea</option>
                        <option value="China">China</option>
                        <option value="India">India</option>
                        <option value="Brazil">Brazil</option>
                        <option value="Mexico">Mexico</option>
                        <option value="Argentina">Argentina</option>
                        <option value="South Africa">South Africa</option>
                        <option value="Egypt">Egypt</option>
                        <option value="Turkey">Turkey</option>
                        <option value="Russia">Russia</option>
                        <option value="UAE">UAE</option>
                        <option value="Saudi Arabia">Saudi Arabia</option>
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">City</label>
                      <input
                        type="text"
                        name="city"
                        value={profileData.city}
                        onChange={handleProfileChange}
                        list="city-list"
                        placeholder="Select or type a city..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white min-h-[44px]"
                      />
                      <datalist id="city-list">
                        <option value="New York">New York</option>
                        <option value="Los Angeles">Los Angeles</option>
                        <option value="Chicago">Chicago</option>
                        <option value="Houston">Houston</option>
                        <option value="Phoenix">Phoenix</option>
                        <option value="Philadelphia">Philadelphia</option>
                        <option value="San Antonio">San Antonio</option>
                        <option value="San Diego">San Diego</option>
                        <option value="Dallas">Dallas</option>
                        <option value="San Jose">San Jose</option>
                        <option value="Austin">Austin</option>
                        <option value="Jacksonville">Jacksonville</option>
                        <option value="Fort Worth">Fort Worth</option>
                        <option value="Columbus">Columbus</option>
                        <option value="Charlotte">Charlotte</option>
                        <option value="San Francisco">San Francisco</option>
                        <option value="Indianapolis">Indianapolis</option>
                        <option value="Seattle">Seattle</option>
                        <option value="Denver">Denver</option>
                        <option value="Washington">Washington</option>
                        <option value="Boston">Boston</option>
                        <option value="El Paso">El Paso</option>
                        <option value="Nashville">Nashville</option>
                        <option value="Detroit">Detroit</option>
                        <option value="Oklahoma City">Oklahoma City</option>
                        <option value="Portland">Portland</option>
                        <option value="Las Vegas">Las Vegas</option>
                        <option value="Memphis">Memphis</option>
                        <option value="Louisville">Louisville</option>
                        <option value="Baltimore">Baltimore</option>
                        <option value="Milwaukee">Milwaukee</option>
                        <option value="Albuquerque">Albuquerque</option>
                        <option value="Tucson">Tucson</option>
                        <option value="Fresno">Fresno</option>
                        <option value="Sacramento">Sacramento</option>
                        <option value="Kansas City">Kansas City</option>
                        <option value="Mesa">Mesa</option>
                        <option value="Atlanta">Atlanta</option>
                        <option value="Omaha">Omaha</option>
                        <option value="Colorado Springs">Colorado Springs</option>
                        <option value="Raleigh">Raleigh</option>
                        <option value="Virginia Beach">Virginia Beach</option>
                        <option value="Miami">Miami</option>
                        <option value="Oakland">Oakland</option>
                        <option value="Minneapolis">Minneapolis</option>
                        <option value="Tulsa">Tulsa</option>
                        <option value="Cleveland">Cleveland</option>
                        <option value="Wichita">Wichita</option>
                        <option value="Arlington">Arlington</option>
                        <option value="London">London</option>
                        <option value="Paris">Paris</option>
                        <option value="Berlin">Berlin</option>
                        <option value="Madrid">Madrid</option>
                        <option value="Rome">Rome</option>
                        <option value="Amsterdam">Amsterdam</option>
                        <option value="Vienna">Vienna</option>
                        <option value="Brussels">Brussels</option>
                        <option value="Zurich">Zurich</option>
                        <option value="Stockholm">Stockholm</option>
                        <option value="Oslo">Oslo</option>
                        <option value="Copenhagen">Copenhagen</option>
                        <option value="Helsinki">Helsinki</option>
                        <option value="Warsaw">Warsaw</option>
                        <option value="Lisbon">Lisbon</option>
                        <option value="Athens">Athens</option>
                        <option value="Dublin">Dublin</option>
                        <option value="Toronto">Toronto</option>
                        <option value="Vancouver">Vancouver</option>
                        <option value="Montreal">Montreal</option>
                        <option value="Calgary">Calgary</option>
                        <option value="Ottawa">Ottawa</option>
                        <option value="Edmonton">Edmonton</option>
                        <option value="Winnipeg">Winnipeg</option>
                        <option value="Quebec City">Quebec City</option>
                        <option value="Sydney">Sydney</option>
                        <option value="Melbourne">Melbourne</option>
                        <option value="Brisbane">Brisbane</option>
                        <option value="Perth">Perth</option>
                        <option value="Adelaide">Adelaide</option>
                        <option value="Tokyo">Tokyo</option>
                        <option value="Seoul">Seoul</option>
                        <option value="Beijing">Beijing</option>
                        <option value="Shanghai">Shanghai</option>
                        <option value="Mumbai">Mumbai</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Bangalore">Bangalore</option>
                        <option value="São Paulo">São Paulo</option>
                        <option value="Rio de Janeiro">Rio de Janeiro</option>
                        <option value="Mexico City">Mexico City</option>
                        <option value="Buenos Aires">Buenos Aires</option>
                        <option value="Johannesburg">Johannesburg</option>
                        <option value="Cairo">Cairo</option>
                        <option value="Istanbul">Istanbul</option>
                        <option value="Moscow">Moscow</option>
                        <option value="Dubai">Dubai</option>
                        <option value="Riyadh">Riyadh</option>
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Postal Code</label>
                      <input
                        type="text"
                        name="postal_code"
                        value={profileData.postal_code}
                        onChange={handleProfileChange}
                        placeholder="Enter..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {}
          {activeTab === 'password' && (
            <div className="bg-white rounded-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start mb-6 sm:mb-8 gap-4">
                <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handlePasswordCancel}
                    className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordUpdate}
                    disabled={loading}
                    className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 min-h-[44px]"
                  >
                    {loading ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-w-3xl w-full">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    >
                      {showPasswords.current ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        name="new_password"
                        value={passwordData.new_password}
                        onChange={handlePasswordChange}
                        placeholder="Enter..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        {showPasswords.new ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? "text" : "password"}
                        name="confirm_password"
                        value={passwordData.confirm_password}
                        onChange={handlePasswordChange}
                        placeholder="Enter..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
                      >
                        {showPasswords.confirm ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-xl">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Documents</h3>
                  <p className="text-sm text-gray-500 mt-1">Manage your licenses, certifications, and other records.</p>
                </div>
                {!isSuperAdmin() && (
                  <button
                    onClick={() => setShowAddDocument(!showAddDocument)}
                    className={`w-full sm:w-auto px-5 py-2.5 rounded-xl transition-all duration-200 text-sm font-semibold flex items-center justify-center gap-2 shadow-sm ${
                      showAddDocument 
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' 
                        : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-md'
                    }`}
                  >
                    {showAddDocument ? (
                      <>Cancel</>
                    ) : (
                      <>
                        <FiPlus className="w-4 h-4" />
                        Add New Document
                      </>
                    )}
                  </button>
                )}
              </div>

              {showAddDocument && (
                <div className="mb-8 p-6 border border-blue-100 rounded-2xl bg-blue-50/30 animate-in fade-in slide-in-from-top-4 duration-300">
                  <h4 className="text-lg font-bold text-gray-800 mb-5">Upload New Document</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Document Title</label>
                        <input
                          type="text"
                          name="title"
                          value={newDocument.title}
                          onChange={handleNewDocumentChange}
                          placeholder="e.g. Private Pilot License"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all shadow-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Expiry Date (Optional)</label>
                        <input
                          type="date"
                          name="expiry_date"
                          value={newDocument.expiry_date}
                          onChange={handleNewDocumentChange}
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Details (Optional)</label>
                        <textarea
                          name="details"
                          value={newDocument.details}
                          onChange={handleNewDocumentChange}
                          placeholder="Add any specific notes about this document..."
                          rows="4"
                          className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all shadow-sm resize-none"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-700 mb-3">Upload File</label>
                      <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-8 hover:border-blue-400 transition-colors bg-white group cursor-pointer text-center">
                        <input
                          type="file"
                          name="file"
                          onChange={handleNewDocumentChange}
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                        />
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                            <FiCamera className="w-6 h-6" />
                          </div>
                          <p className="text-sm font-medium text-gray-700">
                            {selectedFile ? selectedFile.name : "Click or drag to upload document"}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG, or DOC (Max 5MB)</p>
                        </div>
                      </div>
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-3 mt-2">
                      <button
                        onClick={() => setShowAddDocument(false)}
                        className="px-6 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-800 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleAddDocument}
                        disabled={loading}
                        className="px-8 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all font-semibold shadow-sm hover:shadow-md disabled:opacity-50"
                      >
                        {loading ? 'Adding...' : 'Save Document'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loadingDocs ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-12">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-48 bg-gray-50 animate-pulse rounded-2xl"></div>
                  ))}
                </div>
              ) : documents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {documents.map((doc) => {
                    const isExpired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
                    const isExpiringSoon = doc.expiry_date && !isExpired && 
                      new Date(doc.expiry_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

                    return (
                      <div 
                        key={doc.id} 
                        className={`group relative border rounded-2xl p-5 transition-all duration-300 hover:shadow-xl hover:border-blue-200 bg-white flex flex-col h-full ${
                          selectedDocuments.includes(doc.id) ? 'ring-2 ring-blue-500 border-blue-500' : 'border-gray-100 shadow-sm'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-3 rounded-xl ${isExpired ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'} group-hover:scale-110 transition-transform duration-300`}>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDocument(doc.id, doc.title);
                              }}
                              disabled={deletingDocId === doc.id}
                              className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        </div>

                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 line-clamp-1 mb-1">{doc.title}</h4>
                          {doc.details && <p className="text-sm text-gray-500 line-clamp-2 mb-3 h-10">{doc.details}</p>}
                          
                          <div className="space-y-2 mt-auto pt-3 border-t border-gray-50">
                            {doc.expiry_date && (
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${isExpired ? 'bg-red-500' : isExpiringSoon ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                                <span className={`text-xs font-semibold ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-orange-600' : 'text-gray-500'}`}>
                                  {isExpired ? 'Expired: ' : isExpiringSoon ? 'Expiring soon: ' : 'Expires: '}
                                  {new Date(doc.expiry_date).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="mt-5 flex gap-3">
                          {doc.file_path ? (
                            <a 
                              href={doc.file_path} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex-1 py-2 px-4 bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 text-xs font-bold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
                            >
                              <FiEye size={14} />
                              View
                            </a>
                          ) : (
                            <div className="flex-1 py-2 px-4 bg-gray-50 text-gray-400 text-xs font-bold rounded-xl flex items-center justify-center italic">
                              No file
                            </div>
                          )}
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedDocuments.includes(doc.id)}
                              onChange={() => handleDocumentToggle(doc.id)}
                              className="h-5 w-5 text-blue-600 border-gray-300 rounded-lg focus:ring-blue-500 cursor-pointer shadow-sm"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-100">
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h7a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">No documents yet</h3>
                  <p className="text-gray-500 max-w-xs mx-auto">Upload your licenses and certifications to keep them organized.</p>
                </div>
              )}
            </div>
          )}

          {}
          {activeTab === 'payment' && (
            <div className="bg-white rounded-lg">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5 gap-3">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Payment History</h3>
                  <p className="text-sm text-gray-500 mt-0.5">All your flight reservation invoices</p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg min-h-[40px] w-full sm:w-auto sm:min-w-[220px]">
                    <FiSearch className="text-gray-400 mr-2 flex-shrink-0" size={15} />
                    <input
                      type="text"
                      placeholder="Search by invoice, aircraft, type…"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full min-w-0"
                    />
                  </div>
                </div>
              </div>

              {/* Loading */}
              {loadingPayments && (
                <div className="flex justify-center items-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-200 border-t-blue-600" />
                </div>
              )}

              {/* Empty state */}
              {!loadingPayments && filteredPayments.length === 0 && (
                <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl">
                  <div className="text-4xl mb-3">🧾</div>
                  <h4 className="text-sm font-semibold text-gray-600">No invoices found</h4>
                  <p className="text-xs text-gray-400 mt-1">Your flight lesson invoices will appear here once billed.</p>
                </div>
              )}

              {/* Summary cards */}
              {!loadingPayments && paymentHistory.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
                  {[
                    {
                      label: 'Total Invoices',
                      value: paymentHistory.length,
                      color: 'bg-blue-50 text-blue-600',
                    },
                    {
                      label: 'Paid',
                      value: paymentHistory.filter(p => p.status_raw === 'paid').length,
                      color: 'bg-[#E1FAEA] text-[#016626]',
                    },
                    {
                      label: 'Pending',
                      value: paymentHistory.filter(p => p.status_raw === 'sent').length,
                      color: 'bg-yellow-50 text-yellow-700',
                    },
                    {
                      label: 'Total Spent',
                      value: '$' + paymentHistory.filter(p => p.status_raw === 'paid').reduce((s, p) => s + p.total, 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }),
                      color: 'bg-purple-50 text-purple-700',
                    },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="border border-gray-200 rounded-xl p-3.5">
                      <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-md mb-2 ${color}`}>{label}</span>
                      <p className="text-xl font-bold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Desktop table */}
              {!loadingPayments && filteredPayments.length > 0 && (
                <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        {['Invoice #', 'Aircraft', 'Flight Type', 'Date', 'Hobbs', 'Total', 'Method', 'Status', ''].map(h => (
                          <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredPayments.map((payment) => (
                        <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3.5 font-mono text-xs font-semibold text-blue-600">{payment.invoice_number}</td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-gray-800 text-xs">{payment.aircraft_tail}</div>
                            <div className="text-gray-400 text-xs">{payment.aircraft_name}</div>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-600">{payment.flight_type}</td>
                          <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">{payment.date}</td>
                          <td className="px-4 py-3.5 text-xs text-gray-600">{payment.hobbs_block_time?.toFixed(1)} hrs</td>
                          <td className="px-4 py-3.5">
                            <span className="text-sm font-bold text-gray-900">${payment.total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-gray-500 capitalize">{payment.charge_method}</td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              payment.status === 'Paid'     ? 'bg-[#E1FAEA] text-[#016626]' :
                              payment.status === 'Pending'  ? 'bg-yellow-50 text-yellow-700' :
                              payment.status === 'Refunded' ? 'bg-purple-50 text-purple-700' :
                                                              'bg-gray-100 text-gray-600'
                            }`}>{payment.status}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <button
                              onClick={() => setSelectedInvoice(payment)}
                              className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap"
                            >
                              View Invoice
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Mobile cards */}
              {!loadingPayments && filteredPayments.length > 0 && (
                <div className="md:hidden space-y-3">
                  {filteredPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="border border-gray-200 rounded-xl p-4 bg-white shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedInvoice(payment)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <span className="font-mono text-xs font-bold text-blue-600">{payment.invoice_number}</span>
                          <p className="text-sm font-semibold text-gray-800 mt-0.5">{payment.aircraft_tail} · {payment.flight_type}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{payment.date}</p>
                        </div>
                        <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          payment.status === 'Paid'     ? 'bg-[#E1FAEA] text-[#016626]' :
                          payment.status === 'Pending'  ? 'bg-yellow-50 text-yellow-700' :
                          payment.status === 'Refunded' ? 'bg-purple-50 text-purple-700' :
                                                          'bg-gray-100 text-gray-600'
                        }`}>{payment.status}</span>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-400">{payment.hobbs_block_time?.toFixed(1)} hrs · {payment.charge_method}</span>
                        <span className="text-base font-bold text-gray-900">${payment.total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Invoice Detail Modal */}
              {selectedInvoice && (
                <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-md w-full overflow-hidden">
                    {/* Modal header */}
                    <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
                      <div>
                        <p className="text-xs font-mono font-bold text-blue-600">{selectedInvoice.invoice_number}</p>
                        <h3 className="text-base font-bold text-gray-900 mt-0.5">{selectedInvoice.aircraft_tail} · {selectedInvoice.flight_type}</h3>
                        <p className="text-xs text-gray-400 mt-0.5">{selectedInvoice.date}</p>
                      </div>
                      <button
                        onClick={() => setSelectedInvoice(null)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                      >
                        <FiEye size={16} className="hidden" />
                        <span className="text-lg leading-none">×</span>
                      </button>
                    </div>

                    {/* Line items */}
                    <div className="px-6 py-4 space-y-1">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Line Items</p>

                      {/* Aircraft */}
                      <div className="flex justify-between items-center py-2 border-b border-gray-50">
                        <div>
                          <p className="text-sm text-gray-700">Aircraft ({selectedInvoice.hobbs_block_time?.toFixed(1)} hrs × ${selectedInvoice.aircraft_rate?.toFixed(0)}/hr)</p>
                          <p className="text-xs text-gray-400">Hobbs block time</p>
                        </div>
                        <span className="text-sm font-semibold text-gray-900">${selectedInvoice.aircraft_charge?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>

                      {/* Instruction */}
                      {(selectedInvoice.instruction_dual_hours > 0 || selectedInvoice.instruction_ground_hours > 0) && (
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                          <div>
                            <p className="text-sm text-gray-700">Instruction ({((selectedInvoice.instruction_dual_hours || 0) + (selectedInvoice.instruction_ground_hours || 0)).toFixed(1)} hrs × ${selectedInvoice.instructor_rate?.toFixed(0)}/hr)</p>
                            <p className="text-xs text-gray-400">Dual: {selectedInvoice.instruction_dual_hours?.toFixed(1)} hrs · Ground: {selectedInvoice.instruction_ground_hours?.toFixed(1)} hrs</p>
                          </div>
                          <span className="text-sm font-semibold text-gray-900">${selectedInvoice.instructor_charge?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      )}

                      {/* Subtotal / Tax / Total */}
                      <div className="pt-3 space-y-1.5">
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Subtotal</span>
                          <span>${selectedInvoice.subtotal?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>Tax ({selectedInvoice.tax_percent?.toFixed(1)}%)</span>
                          <span>${selectedInvoice.tax_amount?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-100">
                          <span>Total</span>
                          <span>${selectedInvoice.total?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </div>

                      {/* Meta */}
                      <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Payment Method</span>
                          <span className="text-gray-700 font-medium">{selectedInvoice.charge_method}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Status</span>
                          <span className={`font-bold ${
                            selectedInvoice.status === 'Paid'     ? 'text-[#016626]' :
                            selectedInvoice.status === 'Pending'  ? 'text-yellow-700' :
                            selectedInvoice.status === 'Refunded' ? 'text-purple-700' : 'text-gray-700'
                          }`}>{selectedInvoice.status}</span>
                        </div>
                        {selectedInvoice.paid_at && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-400">Paid On</span>
                            <span className="text-gray-700">{selectedInvoice.paid_at}</span>
                          </div>
                        )}
                        {selectedInvoice.is_refunded && (
                          <div className="mt-2 p-2.5 bg-purple-50 border border-purple-100 rounded-lg">
                            <p className="text-xs font-semibold text-purple-700">Refunded: ${selectedInvoice.refund_amount?.toFixed(2)}</p>
                            {selectedInvoice.refund_reason && (
                              <p className="text-xs text-purple-500 mt-0.5">{selectedInvoice.refund_reason}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
                      <button
                        onClick={() => { showSuccessToast('Invoice download started…'); }}
                        className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:underline"
                      >
                        Download PDF
                      </button>
                      <button
                        onClick={() => setSelectedInvoice(null)}
                        className="px-4 py-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'join-organization' && (
            <div className="bg-white rounded-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <h3 className="text-lg font-semibold text-gray-800">Discover Organizations</h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg min-h-[44px] w-full sm:w-auto sm:min-w-[250px]">
                    <FiSearch className="text-gray-400 mr-2 flex-shrink-0" size={16} />
                    <input
                      type="text"
                      placeholder="Search organizations..."
                      value={joinOrgSearch}
                      onChange={(e) => setJoinOrgSearch(e.target.value)}
                      className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full min-w-0"
                    />
                  </div>
                </div>
              </div>

              {fetchingAllOrgs ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : allOrganizations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {allOrganizations.map((org) => {
                    const isMember = user?.organization_id === org.id || 
                                    user?.organization_memberships?.some(m => m.org_id === org.id && m.status === 'active');
                    const isPending = user?.organization_memberships?.some(m => m.org_id === org.id && m.status === 'pending');
                    
                    return (
                      <div key={org.id} className="border border-gray-200 rounded-xl p-4 flex flex-col items-center text-center hover:shadow-md transition-shadow">
                        <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4 overflow-hidden border border-gray-100 flex-shrink-0 text-white font-bold text-xl">
                          {org.logo ? (
                            <img src={org.logo} alt={org.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="bg-blue-600 w-full h-full flex items-center justify-center">{org.name.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        <h4 className="font-semibold text-gray-800 mb-1 truncate w-full">{org.name}</h4>
                        <p className="text-xs text-gray-500 mb-4 truncate w-full">{org.address || 'No address provided'}</p>
                        
                        <button
                          onClick={() => handleJoinOrg(org.id)}
                          disabled={isMember || isPending || joiningOrgId === org.id}
                          className={`w-full py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px] flex items-center justify-center ${
                            isMember 
                              ? 'bg-green-50 text-green-700 cursor-default' 
                              : isPending
                                ? 'bg-orange-50 text-orange-700 cursor-default'
                                : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                          }`}
                        >
                          {joiningOrgId === org.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : isMember ? (
                            'Member'
                          ) : isPending ? (
                            'Pending Approval'
                          ) : (
                            'Join Organization'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">No organizations found matching "{joinOrgSearch}"</p>
                </div>
              )}
            </div>
          )}
          {activeTab === 'organization' && isAdmin() && (
            <div className="bg-white rounded-lg">
              {loadingOrganization ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row justify-between items-start mb-6 sm:mb-8 gap-4">
                    <h3 className="text-lg font-semibold text-gray-800">Organization Profile</h3>
                    <div className="flex gap-2 w-full sm:w-auto">
                      <button
                        onClick={handleOrganizationCancel}
                        className="flex-1 sm:flex-none px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition min-h-[44px]"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleOrganizationSave();
                        }}
                        disabled={loading || loadingOrganization}
                        className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>

                  {}
                  <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
                    {}
                    <div className="w-full md:w-1/2 lg:w-2/5">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={organizationName || organization?.name || ''}
                        onChange={(e) => setOrganizationName(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm min-h-[44px]"
                        placeholder="Enter organization name"
                      />
                    </div>

                    {}
                    <div className="flex-shrink-0 w-full md:w-auto">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Logo
                      </label>
                      <div className="flex flex-col items-center md:items-start">
                        <div className="relative inline-block">
                          <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden border-2 border-gray-300 flex-shrink-0" style={{ width: '96px', height: '96px', minWidth: '96px', minHeight: '96px', maxWidth: '96px', maxHeight: '96px' }}>
                            {organizationLogoPreview ? (
                              <img
                                src={organizationLogoPreview}
                                alt="Organization Logo"
                                className="w-full h-full object-cover flex-shrink-0"
                                style={{ 
                                  width: '100%', 
                                  height: '100%', 
                                  minWidth: '100%', 
                                  minHeight: '100%',
                                  maxWidth: '100%',
                                  maxHeight: '100%',
                                  objectFit: 'cover'
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <span className="text-2xl text-white font-bold flex-shrink-0" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {organizationName?.charAt(0)?.toUpperCase() || 'O'}
                              </span>
                            )}
                          </div>
                          <label
                            htmlFor="org-logo-upload"
                            className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2.5 cursor-pointer hover:bg-blue-700 transition min-w-[40px] min-h-[40px] flex items-center justify-center shadow-lg"
                          >
                            <FiCamera size={18} />
                            <input
                              id="org-logo-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleOrganizationLogoChange}
                              className="hidden"
                            />
                          </label>
                        </div>
                        <p className="mt-2 text-sm text-gray-600 text-center md:text-left">Click camera icon to change logo</p>
                        {organizationLogoFile && (
                          <button
                            onClick={handleOrganizationLogoUpload}
                            disabled={uploadingOrgLogo}
                            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm min-h-[44px] w-full md:w-auto"
                          >
                            {uploadingOrgLogo ? 'Uploading...' : 'Upload Logo'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
          {/* === Locations Tab (Admin Only) === */}
          {activeTab === 'locations' && isAdmin() && (
              <div className="bg-white rounded-lg">
                <div className="flex items-center gap-2 mb-6">
                  <FiMapPin className="text-blue-600" size={20} />
                  <h3 className="text-lg font-semibold text-gray-800">Manage Locations</h3>
                </div>
                <p className="text-sm text-gray-500 mb-6">
                  Add and manage locations for your organization. These locations will appear when assigning a location to a student and when creating reservations.
                </p>

                {/* Add new location */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Add New Location</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <input
                      type="text"
                      value={newLocationName}
                      onChange={(e) => setNewLocationName(e.target.value)}
                      placeholder="Location name (e.g. Main Airport)*"
                      className="col-span-1 sm:col-span-5 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                    />
                    <input
                      type="text"
                      value={newLocationAddress}
                      onChange={(e) => setNewLocationAddress(e.target.value)}
                      placeholder="Address (optional)"
                      className="col-span-1 sm:col-span-4 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onKeyDown={(e) => e.key === 'Enter' && handleAddLocation()}
                    />
                    <button
                      onClick={handleAddLocation}
                      disabled={savingLocation || !newLocationName.trim()}
                      className="col-span-1 sm:col-span-3 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiPlus size={16} />
                      {savingLocation ? 'Adding...' : 'Add Location'}
                    </button>
                  </div>
                </div>

                {/* Locations list */}
                {loadingLocations ? (
                  <div className="flex justify-center items-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : locationsList.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <FiMapPin size={32} className="mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No locations added yet. Add your first location above.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {locationsList.map((loc) => (
                      <div key={loc.id} className="flex items-center justify-between bg-white border border-gray-200 rounded-lg px-4 py-3 hover:bg-gray-50 transition">
                        <div className="flex items-center gap-3">
                          <FiMapPin className="text-blue-500 flex-shrink-0" size={16} />
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{loc.name}</p>
                            {loc.address && <p className="text-xs text-gray-500">{loc.address}</p>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteLocation(loc.id, loc.name)}
                          disabled={deletingLocationId === loc.id}
                          className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                          title="Delete location"
                        >
                          {deletingLocationId === loc.id
                            ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></div>
                            : <FiTrash2 size={16} />}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Setting;
