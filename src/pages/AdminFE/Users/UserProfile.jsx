import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiSearch, FiMoreVertical, FiMapPin, FiPlusCircle, FiDollarSign, FiArrowUpCircle, FiArrowDownCircle, FiEdit2, FiX, FiChevronDown, FiCheck } from "react-icons/fi";
import { useParams } from "react-router-dom";
import gear_filler from "../../../assets/SVG/gear-filled.svg";
import profileImg from "../../../assets/img/profile.jpg";
import { userService } from "../../../api/services/userService";
import { documentService } from "../../../api/services/documentService";
import { lessonService } from "../../../api/services/lessonService";
import { settingsService } from "../../../api/services/settingsService";
import { locationService } from "../../../api/services/locationService";
import { logbookService } from "../../../api/services/logbookService";
import { showDeleteConfirm, showSuccessToast, showErrorToast, showBlockUserConfirm } from "../../../utils/notifications";
import { formatDate, formatTime } from "../../../utils/dateFormatter";
import { getImageUrl } from "../../../utils/imageUtils";
import { safeDisplay } from "../../../utils/safeDisplay";
import EditUserModal from "../../../components/User/EditUserModal";
import { useAuth } from "../../../context/AuthContext";

const UserProfile = () => {
  const { user: currentUser } = useAuth();
  const { id } = useParams();
  
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [flightLogs, setFlightLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [searchLogs, setSearchLogs] = useState("");
  const [activeTab, setActiveTab] = useState("profile");
  const [openMenu, setOpenMenu] = useState(null);
  const [showEditDocument, setShowEditDocument] = useState(false);
  const [editingDocument, setEditingDocument] = useState(null);
  const [editDocumentData, setEditDocumentData] = useState({
    title: '',
    expiry_date: '',
    details: '',
    file: null,
  });
  const [selectedEditFile, setSelectedEditFile] = useState(null);
  const [updatingDoc, setUpdatingDoc] = useState(false);
  const [showAddDocument, setShowAddDocument] = useState(false);
  const [addingDoc, setAddingDoc] = useState(false);
  const [addDocumentData, setAddDocumentData] = useState({
    title: '',
    expiry_date: '',
    details: '',
    file: null,
  });
  const [selectedAddFile, setSelectedAddFile] = useState(null);
  const [profileImage, setProfileImage] = useState(null);

  // Location settings state
  const [locationOptions, setLocationOptions] = useState([]);
  const [locationForm, setLocationForm] = useState({
    default_location_id: '',
    calendar_location_ids: [],
  });
  const [locationSaving, setLocationSaving] = useState(false);

  // Wallet state
  const [walletTxns, setWalletTxns] = useState([]);
  const [loadingWallet, setLoadingWallet] = useState(false);
  const [depositForm, setDepositForm] = useState({ amount: '', payment_method: 'card', description: '' });
  const [depositLoading, setDepositLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchUser();
      fetchDocuments();
      fetchFlightLogs();
      fetchLocations();
      fetchWalletTxns();
    }
  }, [id]);

  const fetchUser = async () => {
    setLoadingUser(true);
    try {
      const response = await userService.getUser(id);
      if (response.success) {
        const userData = response.data;
        setUser(userData);
        // Populate location form from user data
        setLocationForm({
          default_location_id: userData?.default_location_id ? String(userData.default_location_id) : '',
          calendar_location_ids: Array.isArray(userData?.calendar_location_ids)
            ? userData.calendar_location_ids.map(String)
            : [],
        });
        const avatarUrl = userData?.avatar || userData?.profile_image || userData?.avatar_url || userData?.organization?.logo;
        setProfileImage(avatarUrl || null);
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoadingUser(false);
    }
  };

  const handleEditSuccess = () => {
    fetchUser();
  };

  const fetchLocations = async () => {
    try {
      const res = await locationService.getLocations();
      if (res.success && Array.isArray(res.data)) {
        setLocationOptions(res.data.filter((l) => l.id != null));
      }
    } catch (e) {
      console.error('Error fetching locations:', e);
    }
  };

  const handleSaveLocationSettings = async () => {
    setLocationSaving(true);
    try {
      const payload = {
        default_location_id: locationForm.default_location_id ? parseInt(locationForm.default_location_id, 10) : null,
        calendar_location_ids: locationForm.calendar_location_ids.map(id => parseInt(id, 10)).filter(n => !Number.isNaN(n)),
      };
      const response = await userService.updateUser(id, payload);
      if (response.success) {
        showSuccessToast('Location saved successfully');
        setUser(prev => ({ ...prev, ...payload }));
      } else {
        showErrorToast(response.message || 'Failed to save location');
      }
    } catch (err) {
      showErrorToast('Failed to save location');
    } finally {
      setLocationSaving(false);
    }
  };

  const toggleCalendarLocation = (locId) => {
    const idStr = String(locId);
    setLocationForm(prev => ({
      ...prev,
      calendar_location_ids: prev.calendar_location_ids.includes(idStr)
        ? prev.calendar_location_ids.filter(id => id !== idStr)
        : [...prev.calendar_location_ids, idStr],
    }));
  };

  const fetchWalletTxns = async () => {
    if (!id) return;
    setLoadingWallet(true);
    try {
      const res = await userService.getWalletTransactions(id);
      if (res.success) setWalletTxns(res.data || []);
    } catch (e) {
      console.error('Error fetching wallet txns:', e);
    } finally {
      setLoadingWallet(false);
    }
  };

  const handleDeposit = async (e) => {
    e.preventDefault();
    if (!depositForm.amount || parseFloat(depositForm.amount) <= 0) return;
    setDepositLoading(true);
    try {
      const res = await userService.walletDeposit(id, {
        amount: parseFloat(depositForm.amount),
        payment_method: depositForm.payment_method,
        description: depositForm.description || undefined,
      });
      if (res.success) {
        showSuccessToast(`$${parseFloat(depositForm.amount).toFixed(2)} deposited successfully!`);
        setDepositForm({ amount: '', payment_method: 'card', description: '' });
        setUser(prev => ({ ...prev, account_balance: res.data.account_balance }));
        fetchWalletTxns();
      } else {
        showErrorToast(res.message || 'Deposit failed');
      }
    } catch (err) {
      showErrorToast(err?.message || .response?.data?.message || 'Deposit failed');
    } finally {
      setDepositLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!id) return;
    setLoadingDocs(true);
    try {
      const response = await documentService.getUserDocuments(id);
      if (response.success) {
        setDocuments(response.data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const fetchFlightLogs = async () => {
    if (!id) return;
    setLoadingLogs(true);
    try {
      const response = await logbookService.getUserEntries(id, { per_page: 10 });
      if (response.success) {
        setFlightLogs(response.data);
      }
    } catch (error) {
      console.error('Error fetching flight logs:', error);
      setFlightLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleEditDocument = (doc) => {
    setEditingDocument(doc);
    setEditDocumentData({
      title: doc.title || '',
      expiry_date: doc.expiry_date || '',
      details: doc.details || '',
      file: null,
    });
    setSelectedEditFile(null);
    setShowEditDocument(true);
    setOpenMenu(null);
  };

  const handleEditDocumentChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file' && files && files[0]) {
      setSelectedEditFile(files[0]);
      setEditDocumentData(prev => ({ ...prev, file: files[0] }));
    } else {
      setEditDocumentData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleUpdateDocument = async () => {
    if (!id || !editingDocument?.id) return;
    if (!editDocumentData.title.trim()) {
      showErrorToast('Please enter document title');
      return;
    }

    setUpdatingDoc(true);
    try {
      const formData = new FormData();
      formData.append('title', editDocumentData.title);
      if (editDocumentData.expiry_date) {
        formData.append('expiry_date', editDocumentData.expiry_date);
      }
      if (editDocumentData.details) {
        formData.append('details', editDocumentData.details);
      }
      if (editDocumentData.file) {
        formData.append('file', editDocumentData.file);
      }

      const response = await documentService.updateDocument(id, editingDocument.id, formData);

      if (response.success) {
        showSuccessToast('Document updated successfully');
        setShowEditDocument(false);
        await fetchDocuments();
      } else {
        showErrorToast(response.message || 'Failed to update document');
      }
    } catch (error) {
      console.error('Error updating document:', error);
      showErrorToast(error?.message || .response?.data?.message || 'Error updating document');
    } finally {
      setUpdatingDoc(false);
    }
  };

  const handleAddDocumentChange = (e) => {
    const { name, value, files } = e.target;
    if (name === 'file' && files && files[0]) {
      setSelectedAddFile(files[0]);
      setAddDocumentData(prev => ({ ...prev, file: files[0] }));
    } else {
      setAddDocumentData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleCreateDocument = async () => {
    if (!id) return;
    if (!addDocumentData.title.trim()) {
      showErrorToast('Please enter document title');
      return;
    }

    setAddingDoc(true);
    try {
      const formData = new FormData();
      formData.append('title', addDocumentData.title);
      if (addDocumentData.expiry_date) {
        formData.append('expiry_date', addDocumentData.expiry_date);
      }
      if (addDocumentData.details) {
        formData.append('details', addDocumentData.details);
      }
      if (addDocumentData.file) {
        formData.append('file', addDocumentData.file);
      }

      const response = await documentService.createDocument(id, formData);
      if (response.success) {
        showSuccessToast('Document added successfully');
        setShowAddDocument(false);
        setAddDocumentData({ title: '', expiry_date: '', details: '', file: null });
        setSelectedAddFile(null);
        await fetchDocuments();
      } else {
        showErrorToast(response.message || 'Failed to add document');
      }
    } catch (error) {
      console.error('Error adding document:', error);
      showErrorToast(error?.message || .response?.data?.message || 'Error adding document');
    } finally {
      setAddingDoc(false);
    }
  };

  const handleDeleteDocument = async (documentId, docTitle) => {
    const confirmed = await showDeleteConfirm(docTitle || 'this document');
    if (!confirmed) return;
    
    try {
      await documentService.deleteDocument(id, documentId);
      showSuccessToast('Document deleted successfully');
      fetchDocuments();
    } catch (error) {
      showErrorToast('Failed to delete document');
    }
  };

  const handleBlockUser = async () => {
    const confirmed = await showBlockUserConfirm(user?.name);
    if (!confirmed) return;
    
    try {
      const response = await userService.blockUser(id);
      if (response.success) {
        showSuccessToast(response.data.message || 'User status updated');
        fetchUser(); 
      }
    } catch (error) {
      showErrorToast('Failed to update user status');
    }
  };

  const toggleMenu = (index) => {
    setOpenMenu(openMenu === index ? null : index);
  };

  const certificates = [
    { name: "CFI", color: "bg-blue-100 text-blue-700" },
    { name: "CFII", color: "bg-red-100 text-red-700" },
    { name: "MEI", color: "bg-yellow-100 text-yellow-700" },
  ];

  
  const filteredFlightLogs = flightLogs.filter((log) => {
    if (!searchLogs) return true;
    const searchLower = searchLogs.toLowerCase();
    return (
      (log.flight_date_formatted || log.flight_date || "")?.toLowerCase().includes(searchLower) ||
      (log.flight_time || "")?.toLowerCase().includes(searchLower) ||
      ((user?.roles?.some(r => r.toLowerCase() === 'instructor') ? log.student : log.instructor) || "")?.toLowerCase().includes(searchLower) ||
      (log.status || "")?.toLowerCase().includes(searchLower) ||
      (log.lesson_type || "")?.toLowerCase().includes(searchLower)
    );
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".menu-container")) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openMenu]);

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">User Not Found</h2>
          <p className="text-gray-600">The user with ID {id} could not be found.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white inset-shadow-sm shadow-sm rounded-lg">
        
        <div className="px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold overflow-hidden flex-shrink-0 text-xl relative" style={{ minWidth: '64px', minHeight: '64px', width: '64px', height: '64px' }}>
              {getImageUrl(profileImage || user?.avatar || user?.profile_image || user?.avatar_url || user?.organization?.logo) ? (
                <img
                  src={getImageUrl(profileImage || user?.avatar || user?.profile_image || user?.avatar_url || user?.organization?.logo)}
                  alt={user?.name || 'User'}
                  className="w-full h-full object-cover rounded-full flex-shrink-0 absolute inset-0"
                  style={{ 
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover', 
                    minWidth: '100%', 
                    minHeight: '100%',
                    maxWidth: '100%',
                    maxHeight: '100%',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 2
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    const parent = e.target.parentElement;
                    if (parent) {
                      const initial = parent.querySelector('.user-initial');
                      if (initial) {
                        initial.style.display = 'flex';
                        initial.classList.remove('hidden');
                        initial.style.zIndex = '1';
                      }
                    }
                  }}
                  onLoad={(e) => {
                    e.target.style.display = 'block';
                    e.target.style.zIndex = '2';
                    const parent = e.target.parentElement;
                    if (parent) {
                      const initial = parent.querySelector('.user-initial');
                      if (initial) {
                        initial.style.display = 'none';
                        initial.classList.add('hidden');
                        initial.style.zIndex = '0';
                      }
                    }
                  }}
                />
              ) : null}
              <span 
                className={`user-initial ${getImageUrl(profileImage || user?.avatar || user?.profile_image || user?.avatar_url || user?.organization?.logo) ? 'hidden' : 'flex'} items-center justify-center absolute inset-0 rounded-full`}
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  minWidth: '100%', 
                  minHeight: '100%',
                  maxWidth: '100%',
                  maxHeight: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  zIndex: getImageUrl(profileImage || user?.avatar || user?.profile_image || user?.avatar_url || user?.organization?.logo) ? 0 : 1
                }}
              >
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-bold text-gray-900">{user?.name}</h1>
              <p className="text-gray-600 text-sm">{user?.email}</p>
              <div className="mt-2 flex gap-2">
                <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                  {user?.roles?.[0] || 'Student Pilot'}
                </span>
                {documents.length > 0 && (
                  <span className="px-3 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded-full">
                    {documents.length} Documents
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
            <button onClick={() => setEditModalOpen(true)} className="px-5 py-2.5 bg-blue-50 text-blue-600 font-medium rounded-lg hover:bg-blue-100 transition flex items-center gap-2">
              <FiEdit2 size={16} />
              <span className="text-sm font-medium">Edit Profile</span>
            </button>
            {String(user?.id) !== String(currentUser?.id) && (
              <button onClick={handleBlockUser} className={`px-5 py-2.5 flex items-center gap-2 rounded-lg transition ${
                user?.status === 'blocked' 
                  ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                  : 'bg-red-50 text-red-600 hover:bg-red-100'
              }`}>
                <img src={gear_filler} alt="Settings" className="w-4 h-4" />
                <span className="text-sm font-medium">{user?.status === 'blocked' ? 'Unblock User' : 'Block User'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="border-b border-gray-200">
          <div className="px-6 flex gap-2">
            <button className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "profile" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`} onClick={() => setActiveTab("profile")}>
              Profile Details
            </button>
            <button className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "documents" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`} onClick={() => setActiveTab("documents")}>
              Documents
            </button>
            <button className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "wallet" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`} onClick={() => { setActiveTab("wallet"); fetchWalletTxns(); }}>
              💳 Wallet
            </button>
          </div>
        </div>

        {activeTab === "profile" ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 mb-8">
              <div><p className="text-sm text-gray-500 mb-1">Name</p><p className="text-sm font-medium text-gray-900">{user?.name || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Certificate Level</p><p className="text-sm font-medium text-gray-900">{user?.certificate_level || '—'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Certificates</p><div className="flex gap-2">{certificates.map((cert, i) => (<span key={i} className={`px-2 py-0.5 text-xs font-medium rounded ${cert.color}`}>{cert.name}</span>))}</div></div>
              <div><p className="text-sm text-gray-500 mb-1">Location</p><p className="text-sm font-medium text-gray-900">{locationOptions.find(l => l.id == user?.default_location_id)?.name || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Phone</p><p className="text-sm font-medium text-gray-900">{user?.phone || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Email</p><p className="text-sm font-medium text-gray-900">{user?.email || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Username</p><p className="text-sm font-medium text-gray-900">{user?.username || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Balance</p><p className="text-sm font-bold text-green-700">${Number(user?.account_balance || 0).toFixed(2)}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Company</p><p className="text-sm font-medium text-gray-900">{user?.organization?.name || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Created</p><p className="text-sm font-medium text-gray-900">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Last Flight</p><p className="text-sm font-medium text-gray-900">{user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Last Login</p><p className="text-sm font-medium text-gray-900">{user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'N/A'}</p></div>
            </div>

            {String(user?.id) !== String(currentUser?.id) && (
              <LocationAssignmentSection
                locationOptions={locationOptions}
                locationForm={locationForm}
                setLocationForm={setLocationForm}
                locationSaving={locationSaving}
                onSave={handleSaveLocationSettings}
              />
            )}

            <div className="border-t border-gray-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Flight Logs</h3>
                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-gray-300 bg-white px-3 py-2 rounded-lg w-64">
                    <FiSearch className="text-gray-400 mr-2" size={16} />
                    <input 
                      type="text" 
                      placeholder="Search flights..." 
                      value={searchLogs}
                      onChange={(e) => setSearchLogs(e.target.value)}
                      className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full" 
                    />
                  </div>
                </div>
              </div>
              <div className="overflow-x-auto">
                {loadingLogs ? (
                  <div className="flex justify-center items-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : filteredFlightLogs.length > 0 ? (
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Date</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Time</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">
                          {user?.roles?.some(r => r.toLowerCase() === 'instructor') ? 'Student' : 'Instructor'}
                        </th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Flight Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFlightLogs.map((log, index) => (
                        <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3">{safeDisplay(log.flight_date_formatted || log.flight_date)}</td>
                          <td className="px-4 py-3">{safeDisplay(log.flight_time)}</td>
                          <td className="px-4 py-3">
                            {user?.roles?.some(r => r.toLowerCase() === 'instructor') 
                              ? safeDisplay(log.student) 
                              : safeDisplay(log.instructor)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">{safeDisplay(log.status)}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{safeDisplay(log.lesson_type || log.flight_type)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="text-center py-8 text-gray-500">No flight logs found</div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'wallet' ? (
          <div className="p-6">
            <div className="flex items-center justify-between bg-slate-800 rounded-xl px-6 py-5 mb-6">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-1">{user?.name} — Wallet Balance</p>
                <p className="text-3xl font-bold text-white">${Number(user?.account_balance || 0).toFixed(2)}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                <FiDollarSign size={22} className="text-blue-400" />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
              <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <FiPlusCircle size={15} className="text-green-500" /> Add Funds
              </h4>
              <form onSubmit={handleDeposit} className="flex flex-col md:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Amount ($)</label>
                  <input
                    type="number" min="0.01" step="0.01"
                    value={depositForm.amount}
                    onChange={e => setDepositForm(f => ({ ...f, amount: e.target.value }))}
                    placeholder="0.00"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Mode</label>
                  <select
                    value={depositForm.payment_method}
                    onChange={e => setDepositForm(f => ({ ...f, payment_method: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="card">Card</option>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="check">Check</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="flex-[2]">
                  <label className="block text-xs font-medium text-gray-500 mb-1">Note (optional)</label>
                  <input
                    type="text"
                    value={depositForm.description}
                    onChange={e => setDepositForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="e.g. Loan disbursement, Upfront deposit"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    disabled={depositLoading}
                    className="h-9 px-5 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50 flex items-center gap-2"
                  >
                    {depositLoading
                      ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                      : <FiPlusCircle size={14} />}
                    Add
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                <h4 className="text-sm font-semibold text-gray-700">Transaction History</h4>
                <span className="text-xs text-gray-400">{walletTxns.length} records</span>
              </div>
              {loadingWallet ? (
                <div className="flex justify-center items-center py-10">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
                </div>
              ) : walletTxns.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <FiDollarSign size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No transactions yet</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Type / Mode</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Note</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">By</th>
                      <th className="px-5 py-2.5 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Amount</th>
                      <th className="px-5 py-2.5 text-right text-xs font-semibold text-gray-500 uppercase">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {walletTxns.map(txn => (
                      <tr key={txn.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                            txn.type === 'deposit' ? 'bg-green-100 text-green-700' :
                            txn.type === 'refund'  ? 'bg-blue-100 text-blue-700'  :
                            'bg-red-100 text-red-700'
                          }`}>
                            {txn.type === 'deposit' || txn.type === 'refund'
                              ? <FiArrowUpCircle size={11} />
                              : <FiArrowDownCircle size={11} />}
                            {txn.type.charAt(0).toUpperCase() + txn.type.slice(1)}
                          </span>
                          {txn.payment_method && (
                            <span className="ml-2 inline-flex text-[10px] font-semibold text-gray-500 capitalize bg-gray-200 px-2 py-0.5 rounded-full">
                              {txn.payment_method.replace('_', ' ')}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-gray-600 max-w-[180px] truncate">{txn.description || '—'}</td>
                        <td className="px-5 py-3 text-gray-600">{txn.performed_by || '—'}</td>
                        <td className="px-5 py-3 text-gray-500">{new Date(txn.created_at).toLocaleDateString()}</td>
                        <td className={`px-5 py-3 text-right font-bold ${ txn.type === 'deduction' ? 'text-red-600' : 'text-green-600' }`}>
                          {txn.type === 'deduction' ? '−' : '+'}${Number(txn.amount).toFixed(2)}
                        </td>
                        <td className="px-5 py-3 text-right text-gray-500 font-mono text-xs">${Number(txn.balance_after).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">User Documents</h3>
              <button
                onClick={() => setShowAddDocument(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition shadow-sm"
              >
                <FiPlusCircle size={16} />
                Add Document
              </button>
            </div>
            
            {loadingDocs ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-gray-500 mb-4">No documents have been uploaded for this user yet.</p>
                <button
                  onClick={() => setShowAddDocument(true)}
                  className="inline-flex items-center gap-2 text-blue-600 font-medium hover:text-blue-700"
                >
                  <FiPlusCircle size={18} />
                  Upload their first document
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc, index) => (
                  <div key={index} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition">
                    <div className="w-1/3">
                      <h4 className="text-sm font-medium text-gray-900">{doc.title}</h4>
                    </div>
                    <div className="flex-1 flex flex-col items-end pr-4">
                      {doc.details && doc.details.length > 0 ? (
                        doc.details.map((detail, idx) => (
                          <p key={idx} className={`text-sm ${detail.toLowerCase().includes('expired') && !detail.toLowerCase().includes('expires at') ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                            {detail}
                          </p>
                        ))
                      ) : doc.expiry_date ? (
                        <p className={`text-sm ${doc.is_expired ? 'text-red-600 font-medium' : 'text-gray-900'}`}>
                          {doc.is_expired ? 'Expired: ' : 'Expires at: '}{doc.expiry_date}
                        </p>
                      ) : null}
                    </div>
                    <div className="relative menu-container">
                      <button 
                        className="p-2 hover:bg-gray-100 rounded" 
                        onClick={() => toggleMenu(index)}
                        aria-label="Document menu"
                      >
                        <FiMoreVertical className="text-gray-500" />
                      </button>
                      {openMenu === index && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <button 
                            className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100 min-h-[44px]" 
                            onClick={() => handleEditDocument(doc)}
                          >
                            Edit
                          </button>
                          <button 
                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 min-h-[44px]" 
                            onClick={() => handleDeleteDocument(doc.id, doc.title)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- ADD DOCUMENT MODAL --- */}
      {showAddDocument && createPortal(
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-900">Add New Document</h3>
                <button onClick={() => setShowAddDocument(false)} className="text-gray-400 hover:text-gray-600 focus:outline-none">
                  <FiX size={24} />
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document Title <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      name="title"
                      value={addDocumentData.title}
                      onChange={handleAddDocumentChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Medical Certificate"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      name="expiry_date"
                      value={addDocumentData.expiry_date}
                      onChange={handleAddDocumentChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description / Details (Optional)</label>
                    <textarea
                      name="details"
                      value={addDocumentData.details}
                      onChange={handleAddDocumentChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter any additional details..."
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Document File</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                      <div className="space-y-1 text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="flex text-sm text-gray-600 justify-center">
                          <label htmlFor="add-file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Upload a file</span>
                            <input id="add-file-upload" name="file" type="file" className="sr-only" onChange={handleAddDocumentChange} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
                          </label>
                        </div>
                        <p className="text-xs text-gray-500">PDF, DOC, JPG, PNG up to 10MB</p>
                      </div>
                    </div>
                    {selectedAddFile && (
                      <p className="mt-2 text-sm text-green-600 flex items-center">
                        <FiCheck className="mr-1" /> {selectedAddFile.name}
                      </p>
                    )}
                  </div>
                </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
              <button
                type="button"
                disabled={addingDoc}
                onClick={() => setShowAddDocument(false)}
                className="w-full inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={addingDoc}
                onClick={handleCreateDocument}
                className="w-full inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:w-auto sm:text-sm disabled:opacity-50"
              >
                {addingDoc ? 'Adding...' : 'Add Document'}
              </button>
            </div>
          </div>
        </div>
      , document.body)}

      {/* --- EDIT DOCUMENT MODAL --- */}
      {showEditDocument && editingDocument && createPortal(
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Edit Document</h3>
                <button
                  onClick={() => {
                    setShowEditDocument(false);
                    setEditingDocument(null);
                    setEditDocumentData({ title: '', expiry_date: '', details: '', file: null });
                    setSelectedEditFile(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={editDocumentData.title}
                    onChange={handleEditDocumentChange}
                    placeholder="Enter document title..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    name="expiry_date"
                    value={editDocumentData.expiry_date}
                    onChange={handleEditDocumentChange}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Details (Optional)
                  </label>
                  <textarea
                    name="details"
                    value={editDocumentData.details}
                    onChange={handleEditDocumentChange}
                    placeholder="Enter document details..."
                    rows="3"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    File (Optional - Leave empty to keep current file)
                  </label>
                  <input
                    type="file"
                    name="file"
                    onChange={handleEditDocumentChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.jpg,.jpeg,.png,.gif,.webp"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[44px]"
                  />
                  {selectedEditFile && (
                    <p className="mt-2 text-sm text-gray-600">
                      Selected: {selectedEditFile.name}
                    </p>
                  )}
                  {!selectedEditFile && editingDocument.file_path && (
                    <p className="mt-2 text-sm text-gray-500 italic">
                      Current file will be kept
                    </p>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowEditDocument(false);
                    setEditingDocument(null);
                    setEditDocumentData({ title: '', expiry_date: '', details: '', file: null });
                    setSelectedEditFile(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition min-h-[44px]"
                  disabled={updatingDoc}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateDocument}
                  disabled={updatingDoc}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition min-h-[44px] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updatingDoc ? 'Updating...' : 'Update Document'}
                </button>
              </div>
            </div>
          </div>
        </div>
      , document.body)}

      {editModalOpen && (
        <EditUserModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          onSuccess={(updatedUser) => {
            setUser(updatedUser);
            setEditModalOpen(false);
          }}
          initialData={user}
        />
      )}
    </div>
  );
};

// ── Searchable Location Assignment Component ──────────────────────────────────
const LocationAssignmentSection = ({ locationOptions, locationForm, setLocationForm, locationSaving, onSave }) => {
  const [defaultSearch, setDefaultSearch] = useState('');
  const [defaultOpen, setDefaultOpen] = useState(false);
  const [multiSearch, setMultiSearch] = useState('');
  const defaultRef = React.useRef(null);

  // Close dropdown on outside click
  React.useEffect(() => {
    const handler = (e) => {
      if (defaultRef.current && !defaultRef.current.contains(e.target)) {
        setDefaultOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredDefault = locationOptions.filter(loc =>
    loc.name.toLowerCase().includes(defaultSearch.toLowerCase()) ||
    (loc.address || '').toLowerCase().includes(defaultSearch.toLowerCase())
  );

  const filteredMulti = locationOptions.filter(loc =>
    loc.name.toLowerCase().includes(multiSearch.toLowerCase()) ||
    (loc.address || '').toLowerCase().includes(multiSearch.toLowerCase())
  );

  const selectedDefaultName = locationOptions.find(l => String(l.id) === locationForm.default_location_id)?.name;

  const toggleCalendar = (idStr) => {
    setLocationForm(prev => ({
      ...prev,
      calendar_location_ids: prev.calendar_location_ids.includes(idStr)
        ? prev.calendar_location_ids.filter(id => id !== idStr)
        : [...prev.calendar_location_ids, idStr],
    }));
  };

  const selectedCalendarLocations = locationOptions.filter(l =>
    locationForm.calendar_location_ids.includes(String(l.id))
  );

  if (locationOptions.length === 0) {
    return (
      <div className="border-t border-gray-200 pt-6 mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
            <FiMapPin className="text-blue-600" size={16} />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Assigned Locations</h3>
        </div>
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 max-w-2xl mt-4">
          <FiMapPin className="text-amber-500 flex-shrink-0" size={16} />
          <p className="text-sm text-amber-700">No locations available. An admin must first add locations in Settings.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-200 pt-6 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
          <FiMapPin className="text-blue-600" size={16} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">Assigned Locations</h3>
      </div>
      <p className="text-sm text-gray-500 mb-5">Assign locations to this user for scheduling and reservations.</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-4xl">

        {/* ── Default Location ── */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Default Location <span className="text-gray-400 font-normal normal-case">(single)</span>
          </label>
          <div className="relative" ref={defaultRef}>
            <button
              type="button"
              onClick={() => { setDefaultOpen(o => !o); setDefaultSearch(''); }}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 border border-gray-300 rounded-xl bg-white text-sm hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <span className="flex items-center gap-2 truncate">
                {selectedDefaultName ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <span className="font-medium text-gray-800 truncate">{selectedDefaultName}</span>
                  </>
                ) : (
                  <span className="text-gray-400">— No location assigned —</span>
                )}
              </span>
              <FiChevronDown size={16} className={`text-gray-400 flex-shrink-0 transition-transform ${defaultOpen ? 'rotate-180' : ''}`} />
            </button>

            {defaultOpen && (
              <div className="absolute z-30 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
                {/* Search */}
                <div className="p-2 border-b border-gray-100">
                  <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
                    <FiSearch size={14} className="text-gray-400 flex-shrink-0" />
                    <input
                      autoFocus
                      type="text"
                      value={defaultSearch}
                      onChange={e => setDefaultSearch(e.target.value)}
                      placeholder="Search locations..."
                      className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
                    />
                  </div>
                </div>
                {/* List */}
                <ul className="max-h-52 overflow-y-auto py-1">
                  <li>
                    <button
                      type="button"
                      onClick={() => { setLocationForm(p => ({ ...p, default_location_id: '' })); setDefaultOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${!locationForm.default_location_id ? 'text-blue-600 font-medium' : 'text-gray-500'}`}
                    >
                      <span className="w-4 h-4 flex items-center justify-center">
                        {!locationForm.default_location_id && <FiCheck size={13} className="text-blue-500" />}
                      </span>
                      — None —
                    </button>
                  </li>
                  {filteredDefault.length === 0 ? (
                    <li className="px-4 py-3 text-sm text-gray-400 text-center">No locations found</li>
                  ) : filteredDefault.map(loc => {
                    const isSel = locationForm.default_location_id === String(loc.id);
                    return (
                      <li key={loc.id}>
                        <button
                          type="button"
                          onClick={() => { setLocationForm(p => ({ ...p, default_location_id: String(loc.id) })); setDefaultOpen(false); }}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm hover:bg-blue-50 transition-colors ${isSel ? 'text-blue-700 bg-blue-50' : 'text-gray-700'}`}
                        >
                          <span className="w-4 h-4 flex items-center justify-center flex-shrink-0">
                            {isSel && <FiCheck size={13} className="text-blue-500" />}
                          </span>
                          <span className="flex flex-col items-start min-w-0">
                            <span className={`font-medium truncate ${isSel ? 'text-blue-700' : ''}`}>{loc.name}</span>
                            {loc.address && <span className="text-xs text-gray-400 truncate">{loc.address}</span>}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
          {selectedDefaultName && (
            <p className="mt-1.5 text-xs text-blue-600 font-medium flex items-center gap-1">
              <FiMapPin size={10} /> Primary: {selectedDefaultName}
            </p>
          )}
        </div>

        {/* ── Additional Locations ── */}
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Additional Schedule Locations <span className="text-gray-400 font-normal normal-case">(multi-select)</span>
          </label>

          {/* Selected tags */}
          {selectedCalendarLocations.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedCalendarLocations.map(loc => (
                <span key={loc.id} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium rounded-full">
                  {loc.name}
                  <button
                    type="button"
                    onClick={() => toggleCalendar(String(loc.id))}
                    className="ml-0.5 w-4 h-4 rounded-full hover:bg-indigo-200 flex items-center justify-center transition-colors"
                  >
                    <FiX size={9} />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search box */}
          <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 mb-1 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100 transition-all">
            <FiSearch size={14} className="text-gray-400 flex-shrink-0" />
            <input
              type="text"
              value={multiSearch}
              onChange={e => setMultiSearch(e.target.value)}
              placeholder="Search and select locations..."
              className="flex-1 bg-transparent text-sm outline-none text-gray-700 placeholder-gray-400"
            />
            {multiSearch && (
              <button type="button" onClick={() => setMultiSearch('')} className="text-gray-400 hover:text-gray-600">
                <FiX size={13} />
              </button>
            )}
          </div>

          {/* Checklist */}
          <div className="border border-gray-200 rounded-xl overflow-hidden">
            {filteredMulti.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-400 text-center">No locations found</div>
            ) : (
              <ul className="max-h-48 overflow-y-auto divide-y divide-gray-50">
                {filteredMulti.map(loc => {
                  const isChecked = locationForm.calendar_location_ids.includes(String(loc.id));
                  return (
                    <li key={loc.id}>
                      <label className={`flex items-center gap-3 px-3.5 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors ${isChecked ? 'bg-indigo-50/60' : ''}`}>
                        <span className={`w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 transition-all ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300 bg-white'}`}>
                          {isChecked && <FiCheck size={10} className="text-white" strokeWidth={3} />}
                        </span>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleCalendar(String(loc.id))}
                          className="sr-only"
                        />
                        <span className="flex flex-col min-w-0">
                          <span className={`text-sm font-medium truncate ${isChecked ? 'text-indigo-700' : 'text-gray-700'}`}>{loc.name}</span>
                          {loc.address && <span className="text-xs text-gray-400 truncate">{loc.address}</span>}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {selectedCalendarLocations.length > 0 && (
            <p className="mt-1.5 text-xs text-indigo-600 font-medium">
              {selectedCalendarLocations.length} location{selectedCalendarLocations.length > 1 ? 's' : ''} selected
            </p>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-5 flex items-center gap-3">
        <button
          onClick={onSave}
          disabled={locationSaving}
          className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
        >
          {locationSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              Saving…
            </>
          ) : (
            <>
              <FiMapPin size={14} />
              Save Locations
            </>
          )}
        </button>
        {!locationSaving && (
          <span className="text-xs text-gray-400">Changes apply immediately upon saving.</span>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
