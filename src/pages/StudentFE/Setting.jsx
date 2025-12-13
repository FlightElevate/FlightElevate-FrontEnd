import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { settingsService } from '../../api/services/settingsService';
import { documentService } from '../../api/services/documentService';
import { authService } from '../../api/services/authService';
import { showSuccessToast, showErrorToast, showConfirmDialog } from '../../utils/notifications';
import { FiSearch, FiEye, FiEyeOff, FiTrash2 } from 'react-icons/fi';
import { MdFilterList } from 'react-icons/md';
import { HiDotsVertical } from 'react-icons/hi';

const Setting = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
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
  ];

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        <h2 className="text-xl font-semibold text-gray-800 px-6 py-4 border-b border-gray-200">
          Settings
        </h2>

        {/* Tabs */}
        <div className="bg-white px-6 py-4 border-b border-gray-200">
          <div className="flex space-x-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-gray-700 font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {/* Loading State */}
          {loadingUserData && activeTab === 'profile' && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && !loadingUserData && (
            <div className="bg-white rounded-lg">
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-lg font-semibold text-gray-800">Profile</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleProfileCancel}
                    className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProfileSave}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </div>

              {/* Profile Picture - Centered */}
              <div className="flex justify-center mb-8">
                <div className="text-center">
                  <div className="w-24 h-24 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-semibold mx-auto mb-3 overflow-hidden">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <button className="text-sm text-green-600 hover:text-green-700 font-medium">
                    Change photo
                  </button>
                </div>
              </div>

              {/* Personal Information */}
              <div className="mb-8">
                <div className="flex items-start gap-8">
                  <h4 className="text-sm font-semibold text-gray-700 w-48 flex-shrink-0">Personal Information</h4>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">First Name</label>
                      <input
                        type="text"
                        name="first_name"
                        value={profileData.first_name}
                        onChange={handleProfileChange}
                        placeholder="Enter..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      <div className="relative">
                        <select
                          name="gender"
                          value={profileData.gender}
                          onChange={handleProfileChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Enter...</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                          ▼
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <div className="flex items-start gap-8">
                  <h4 className="text-sm font-semibold text-gray-700 w-48 flex-shrink-0">Contact Information</h4>
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={profileData.email}
                        onChange={handleProfileChange}
                        placeholder="Enter..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Country</label>
                      <div className="relative">
                        <select
                          name="country"
                          value={profileData.country}
                          onChange={handleProfileChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Enter...</option>
                          <option value="USA">USA</option>
                          <option value="Canada">Canada</option>
                          <option value="UK">UK</option>
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                          ▼
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">City</label>
                      <div className="relative">
                        <select
                          name="city"
                          value={profileData.city}
                          onChange={handleProfileChange}
                          className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Enter...</option>
                          <option value="New York">New York</option>
                          <option value="Los Angeles">Los Angeles</option>
                          <option value="Chicago">Chicago</option>
                        </select>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                          ▼
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Postal Code</label>
                      <input
                        type="text"
                        name="postal_code"
                        value={profileData.postal_code}
                        onChange={handleProfileChange}
                        placeholder="Enter..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <div className="flex justify-between items-start mb-8">
                <h3 className="text-lg font-semibold text-gray-800">Change Password</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handlePasswordCancel}
                    className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePasswordUpdate}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                  >
                    {loading ? 'Updating...' : 'Update'}
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-w-3xl">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">Current Password</label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      name="current_password"
                      value={passwordData.current_password}
                      onChange={handlePasswordChange}
                      placeholder="Enter..."
                      className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPasswords.current ? <FiEye size={18} /> : <FiEyeOff size={18} />}
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? "text" : "password"}
                        name="new_password"
                        value={passwordData.new_password}
                        onChange={handlePasswordChange}
                        placeholder="Enter..."
                        className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                        className="w-full border border-gray-300 rounded-md px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Documents</h3>
                <button
                  onClick={() => setShowAddDocument(!showAddDocument)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                >
                  {showAddDocument ? 'Cancel' : '+ Add New Document'}
                </button>
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
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-2">Expiry Date (Optional)</label>
                      <input
                        type="date"
                        name="expiry_date"
                        value={newDocument.expiry_date}
                        onChange={handleNewDocumentChange}
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 text-sm font-medium"
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
                          className="ml-2 p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Payment History</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg">
                    <FiSearch className="text-gray-400 mr-2" size={16} />
                    <input
                      type="text"
                      placeholder="Search"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-48"
                    />
                  </div>
                  <button className="flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg text-sm text-gray-700">
                    <MdFilterList className="w-5 h-5" />
                    <span>Filter</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
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
                        <td className="px-6 py-4">
                          <button className="text-gray-600 hover:text-gray-900">
                            <HiDotsVertical className="w-5 h-5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Setting;
