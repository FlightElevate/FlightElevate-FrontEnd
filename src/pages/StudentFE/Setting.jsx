import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRole } from '../../hooks/useRole';
import { settingsService } from '../../api/services/settingsService';
import { documentService } from '../../api/services/documentService';
import { authService } from '../../api/services/authService';
import { organizationService } from '../../api/services/organizationService';
import { showSuccessToast, showErrorToast, showConfirmDialog } from '../../utils/notifications';
import { FiSearch, FiEye, FiEyeOff, FiTrash2, FiCamera } from 'react-icons/fi';
import { MdFilterList } from 'react-icons/md';
import { HiDotsVertical } from 'react-icons/hi';

const Setting = () => {
  const { user } = useAuth();
  const { isSuperAdmin, isAdmin } = useRole();
  
  // Initialize activeTab from localStorage or default to 'profile'
  const [activeTab, setActiveTab] = useState(() => {
    const savedTab = localStorage.getItem('settingsActiveTab');
    return savedTab || 'profile';
  });
  const [loading, setLoading] = useState(false);
  
  // Update localStorage when tab changes (for persistence across reloads)
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('settingsActiveTab', activeTab);
    }
  }, [activeTab]);
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
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [paymentMenuOpen, setPaymentMenuOpen] = useState(null);
  const paymentMenuRefs = useRef({});
  
  // Organization profile state (for Admin only)
  const [organization, setOrganization] = useState(null);
  const [organizationName, setOrganizationName] = useState('');
  const [organizationLogoFile, setOrganizationLogoFile] = useState(null);
  const [organizationLogoPreview, setOrganizationLogoPreview] = useState(null);
  const [uploadingOrgLogo, setUploadingOrgLogo] = useState(false);
  const [loadingOrganization, setLoadingOrganization] = useState(false);

  // Profile form state
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

  // Password form state
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

  // Fetch organization data for Admin users
  useEffect(() => {
    const fetchOrganizationData = async () => {
      // Get organization ID from multiple possible sources
      const orgId = user?.organization_id || user?.organization?.id;
      
      if (!isAdmin() || !orgId) {
        // Reset if not admin or no organization_id
        setOrganization(null);
        setOrganizationName('');
        setOrganizationLogoPreview(null);
        return;
      }
      
      // Check if user already has organization data
      if (user?.organization?.name) {
        setOrganization(user.organization);
        setOrganizationName(user.organization.name || '');
        if (user.organization.logo) {
          setOrganizationLogoPreview(user.organization.logo);
        }
        setLoadingOrganization(false);
        return;
      }
      
      // If we already have organization data with name, don't refetch
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

  // Also fetch when organization tab becomes active (if data not loaded)
  useEffect(() => {
    // Get organization ID from multiple possible sources
    const orgId = user?.organization_id || user?.organization?.id || organization?.id;
    
    if (activeTab === 'organization' && isAdmin() && orgId) {
      // If we don't have organization name yet, fetch it
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

  // Fetch settings data when component mounts
  useEffect(() => {
    const fetchSettingsData = async () => {
      setLoadingUserData(true);
      try {
        const response = await settingsService.getSettings();
        if (response.success && response.data) {
          const settingsData = response.data;
          // Split name into first and last name
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
          
          // Populate password data with current password from API
          if (settingsData.password) {
            setPasswordData(prev => ({
              ...prev,
              current_password: settingsData.password,
            }));
          }
          
          // Set avatar preview if available
          if (settingsData.avatar) {
            setAvatarPreview(settingsData.avatar);
          }

          // Extract organization data from settings response (for Admin users)
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
        // Fallback to context user if API fails
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
  }, []); // Run once on mount

  useEffect(() => {
    if (activeTab === 'documents') {
      fetchDocuments();
    }
  }, [activeTab, user]);

  // Close payment menu when clicking outside
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
        // Pre-select all documents by default
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
      // Create FormData for file upload
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
        // Refresh documents list
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
        // Remove from selected documents if it was selected
        setSelectedDocuments(prev => prev.filter(id => id !== docId));
        // Refresh documents list
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
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showErrorToast('Image size must be less than 2MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showErrorToast('Please select a valid image file');
        return;
      }

      setAvatarFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile || !user?.id) return;
    
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('avatar', avatarFile);
      
      const response = await settingsService.updateSettingsWithFile(formData);
      
      if (response.success) {
        showSuccessToast('Profile picture updated successfully');
        setAvatarFile(null);
        // Update local user data
        const updatedUser = { ...user, avatar: response.data?.avatar || avatarPreview };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // Refresh page to update context
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update profile picture';
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
      const response = await settingsService.updateSettings({
        name: fullName,
        email: profileData.email,
        phone: profileData.phone,
        username: user.username, // Keep existing username
        date_of_birth: profileData.date_of_birth || null,
        gender: profileData.gender || null,
        address: profileData.address || null,
        country: profileData.country || null,
        city: profileData.city || null,
        postal_code: profileData.postal_code || null,
      });
      if (response.success) {
        showSuccessToast('Settings updated successfully');
        // Update local user data
        const updatedUser = { ...user, ...response.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        // Refresh page to update context
        setTimeout(() => window.location.reload(), 1000);
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update settings';
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
        
        // Refresh settings data to show updated password
        try {
          const settingsResponse = await settingsService.getSettings();
          if (settingsResponse.success && settingsResponse.data) {
            // Update local user data with new password
            const updatedUser = { ...user, password: settingsResponse.data.password };
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Update passwordData - set new password as current and clear new/confirm fields
            if (settingsResponse.data.password) {
              setPasswordData({
                current_password: settingsResponse.data.password, // Show new password as current
                new_password: '',
                confirm_password: '',
              });
            }
          }
        } catch (settingsErr) {
          console.error('Error refreshing settings:', settingsErr);
          // If settings API fails, still clear new password fields
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

  // Organization profile handlers
  const handleOrganizationLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast('Image size must be less than 5MB');
        return;
      }
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showErrorToast('Please select a valid image file');
        return;
      }

      setOrganizationLogoFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setOrganizationLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOrganizationLogoUpload = async () => {
    // Get organization ID from multiple possible sources
    const orgId = user?.organization_id || user?.organization?.id || organization?.id;
    
    if (!organizationLogoFile || !orgId) {
      showErrorToast('Please select a logo file');
      return;
    }
    
    setUploadingOrgLogo(true);
    try {
      // Include current organization name to preserve it when uploading logo only
      const currentName = organizationName || organization?.name || '';
      const updateData = {
        logo_file: organizationLogoFile,
      };
      
      // Include name if available to preserve it
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
        // Update organization name if it was included in response
        if (response.data?.name) {
          setOrganizationName(response.data.name);
        }
        // Save active tab to localStorage before reload
        localStorage.setItem('settingsActiveTab', 'organization');
        // Refresh page to update sidebar
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
    // Get organization ID from multiple possible sources
    const orgId = user?.organization_id || user?.organization?.id || organization?.id;
    
    if (!orgId) {
      showErrorToast('Organization ID not found');
      return;
    }

    // Validate organization name
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

      // Only include logo_file if a new file was selected
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
        // Save active tab to localStorage before reload
        localStorage.setItem('settingsActiveTab', 'organization');
        // Refresh page to update sidebar
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

  // Mock payment history data (replace with API call later)
  const mockPayments = [
    { id: 1, invoice: 'Piper 100', amount: '$600.37', date: '7/1/19', status: 'Paid' },
    { id: 2, invoice: 'Piper 200', amount: '$718.36', date: '5/10/17', status: 'Paid' },
    { id: 3, invoice: 'Piper 300', amount: '$446.61', date: '12/4/17', status: 'Not Paid' },
    { id: 4, invoice: 'Piper 400', amount: '$356.54', date: '6/10/14', status: 'Paid' },
    { id: 5, invoice: 'Piper 500', amount: '$450.54', date: '10/28/12', status: 'Not Paid' },
  ];

  const filteredPayments = mockPayments.filter(payment =>
    payment.invoice.toLowerCase().includes(searchTerm.toLowerCase()) ||
    payment.amount.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const tabs = [
    { id: 'profile', label: 'Profile' },
    { id: 'password', label: 'Password' },
    { id: 'documents', label: 'Documents' },
    { id: 'payment', label: 'Payment' },
    ...(isAdmin() ? [{ id: 'organization', label: 'Organization' }] : []),
  ];

  return (
    <div className="md:mt-5 mx-auto max-w-full">
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <h2 className="text-xl font-semibold text-gray-800 px-4 sm:px-6 py-4 border-b border-gray-200">
          Settings
        </h2>

        {/* Tabs - Vertical on Mobile, Horizontal on Desktop */}
        <div className="bg-white border-b border-gray-200">
          {/* Mobile: Vertical Tabs */}
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

          {/* Desktop: Horizontal Tabs */}
          <div className="hidden md:block">
            <div className="flex gap-2 px-6 py-4">
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

        {/* Tab Content */}
        <div className="p-4 sm:p-6">
          {/* Loading State */}
          {loadingUserData && activeTab === 'profile' && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Profile Tab */}
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

              {/* Profile Picture - Centered */}
              <div className="flex justify-center mb-8">
                <div className="text-center">
                  <div className="relative w-24 h-24 mx-auto mb-3">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-300"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    )}
                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-2 cursor-pointer hover:bg-blue-700 transition shadow-lg">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              {/* Personal Information */}
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

              {/* Contact Information */}
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

          {/* Password Tab */}
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

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="bg-white rounded-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h3 className="text-lg font-semibold text-gray-800">Documents</h3>
                {!isSuperAdmin() && (
                  <button
                    onClick={() => setShowAddDocument(!showAddDocument)}
                    className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium min-h-[44px]"
                  >
                    {showAddDocument ? 'Cancel' : '+ Add New Document'}
                  </button>
                )}
              </div>

              {/* Add New Document Form */}
              {showAddDocument && (
                <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <h4 className="text-md font-semibold text-gray-700 mb-4">Add New Document</h4>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Document Title</label>
                      <input
                        type="text"
                        name="title"
                        value={newDocument.title}
                        onChange={handleNewDocumentChange}
                        placeholder="Enter document title..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Expiry Date (Optional)</label>
                      <input
                        type="date"
                        name="expiry_date"
                        value={newDocument.expiry_date}
                        onChange={handleNewDocumentChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Details (Optional)</label>
                      <textarea
                        name="details"
                        value={newDocument.details}
                        onChange={handleNewDocumentChange}
                        placeholder="Enter document details..."
                        rows="3"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Upload File (Optional)</label>
                      <input
                        type="file"
                        name="file"
                        onChange={handleNewDocumentChange}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                      {selectedFile && (
                        <p className="text-sm text-gray-600 mt-1">
                          Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                    </div>
                    <div className="flex justify-end">
                      <button
                        onClick={handleAddDocument}
                        disabled={loading}
                        className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium min-h-[44px]"
                      >
                        {loading ? 'Adding...' : 'Add Document'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {loadingDocs ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              ) : documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div 
                      key={doc.id} 
                      className={`border rounded-lg p-4 transition-colors ${
                        selectedDocuments.includes(doc.id) 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedDocuments.includes(doc.id)}
                          onChange={() => handleDocumentToggle(doc.id)}
                          className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                        />
                        <div 
                          className="flex-1 cursor-pointer"
                          onClick={() => handleDocumentToggle(doc.id)}
                        >
                          <h4 className="font-medium text-gray-800">{doc.title}</h4>
                          {doc.expiry_date && (
                            <p className="text-sm text-gray-500 mt-1">
                              Expires: {new Date(doc.expiry_date).toLocaleDateString()}
                            </p>
                          )}
                          {doc.details && (
                            <p className="text-sm text-gray-600 mt-1">{doc.details}</p>
                          )}
                          {doc.file_path && (
                            <a 
                              href={doc.file_path} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-blue-600 hover:text-blue-800 mt-1 inline-block"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View Document
                            </a>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDocument(doc.id, doc.title);
                          }}
                          disabled={deletingDocId === doc.id}
                          className="ml-2 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50 min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
                          title="Delete document"
                        >
                          {deletingDocId === doc.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <FiTrash2 size={18} />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No documents found</p>
              )}
            </div>
          )}

          {/* Payment Tab */}
          {activeTab === 'payment' && (
            <div className="bg-white rounded-lg">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
                <h3 className="text-lg font-semibold text-gray-800">Payment History</h3>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg min-h-[44px] w-full sm:w-auto sm:min-w-[200px]">
                    <FiSearch className="text-gray-400 mr-2 flex-shrink-0" size={16} />
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full min-w-0"
                    />
                  </div>
                  <button className="flex items-center justify-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg text-sm text-gray-700 min-h-[44px] whitespace-nowrap">
                    <MdFilterList className="w-5 h-5 flex-shrink-0" />
                    <span>Filter</span>
                  </button>
                </div>
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm text-left border-b border-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-gray-700 font-medium">Invoice Number</th>
                      <th className="px-6 py-3 text-gray-700 font-medium">Amount</th>
                      <th className="px-6 py-3 text-gray-700 font-medium">Date</th>
                      <th className="px-6 py-3 text-gray-700 font-medium">Status</th>
                      <th className="px-6 py-3 text-gray-700 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="px-6 py-4">{payment.invoice}</td>
                        <td className="px-6 py-4">{payment.amount}</td>
                        <td className="px-6 py-4">{payment.date}</td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.status === 'Paid'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {payment.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 relative">
                          <div className="relative" ref={(el) => (paymentMenuRefs.current[payment.id] = el)}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPaymentMenuOpen(paymentMenuOpen === payment.id ? null : payment.id);
                              }}
                              className="text-gray-600 hover:text-gray-900 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                            >
                              <HiDotsVertical className="w-5 h-5" />
                            </button>
                            {paymentMenuOpen === payment.id && (
                              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPaymentMenuOpen(null);
                                    // Add view action here
                                    showSuccessToast('View payment details');
                                  }}
                                  className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px]"
                                >
                                  View Details
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPaymentMenuOpen(null);
                                    // Add download action here
                                    showSuccessToast('Downloading invoice...');
                                  }}
                                  className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px]"
                                >
                                  Download Invoice
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-800 truncate">{payment.invoice}</h4>
                        <p className="text-sm text-gray-600">{payment.amount}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ml-2 ${
                          payment.status === 'Paid'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {payment.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{payment.date}</span>
                      <div className="relative" ref={(el) => (paymentMenuRefs.current[`mobile-${payment.id}`] = el)}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setPaymentMenuOpen(paymentMenuOpen === `mobile-${payment.id}` ? null : `mobile-${payment.id}`);
                          }}
                          className="text-gray-600 hover:text-gray-900 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <HiDotsVertical className="w-5 h-5" />
                        </button>
                            {paymentMenuOpen === `mobile-${payment.id}` && (
                          <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPaymentMenuOpen(null);
                                // Add view action here
                                showSuccessToast('View payment details');
                              }}
                              className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px]"
                            >
                              View Details
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setPaymentMenuOpen(null);
                                // Add download action here
                                showSuccessToast('Downloading invoice...');
                              }}
                              className="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px]"
                            >
                              Download Invoice
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Organization Tab - Admin Only */}
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

                  {/* Organization Profile - Desktop: Name Left, Logo Right | Mobile: Stacked */}
                  <div className="flex flex-col md:flex-row gap-6 md:gap-8 mb-8">
                    {/* Left Side - Organization Name (Desktop) / Top (Mobile) */}
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

                    {/* Right Side - Organization Logo (Desktop) / Bottom (Mobile) */}
                    <div className="flex-shrink-0 w-full md:w-auto">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Organization Logo
                      </label>
                      <div className="flex flex-col items-center md:items-start">
                        <div className="relative inline-block">
                          <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                            {organizationLogoPreview ? (
                              <img
                                src={organizationLogoPreview}
                                alt="Organization Logo"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-2xl text-white font-bold">
                                {organizationName?.charAt(0)?.toUpperCase() || 'O'}
                              </span>
                            )}
                          </div>
                          <label
                            htmlFor="org-logo-upload"
                            className="absolute bottom-0 right-0 bg-blue-600 text-white rounded-full p-1.5 cursor-pointer hover:bg-blue-700 transition min-w-[36px] min-h-[36px] flex items-center justify-center shadow-lg"
                          >
                            <FiCamera size={16} />
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
        </div>
      </div>
    </div>
  );
};

export default Setting;
