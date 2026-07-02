import React, { useState, useEffect } from "react";
import { FiSearch, FiMoreVertical, FiMapPin, FiPlusCircle, FiDollarSign, FiArrowUpCircle, FiArrowDownCircle, FiEdit2 } from "react-icons/fi";
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

const UserProfile = () => {
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
      showErrorToast(err?.response?.data?.message || 'Deposit failed');
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
        setEditDocumentData({ title: '', expiry_date: '', details: '', file: null });
        setSelectedEditFile(null);
        setEditingDocument(null);
        setShowEditDocument(false);
        await fetchDocuments();
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to update document');
    } finally {
      setUpdatingDoc(false);
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
  }, []);

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
            <button onClick={() => setEditModalOpen(true)} className="px-5 py-2.5 flex items-center gap-2 rounded-lg transition bg-blue-50 text-blue-600 hover:bg-blue-100">
              <FiEdit2 className="w-4 h-4" />
              <span className="text-sm font-medium">Edit Profile</span>
            </button>
            <button onClick={handleBlockUser} className={`px-5 py-2.5 flex items-center gap-2 rounded-lg transition ${
              user?.status === 'blocked' 
                ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                : 'bg-red-50 text-red-600 hover:bg-red-100'
            }`}>
              <img src={gear_filler} alt="Settings" className="w-4 h-4" />
              <span className="text-sm font-medium">{user?.status === 'blocked' ? 'Unblock User' : 'Block User'}</span>
            </button>
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

            <div className="border-t border-gray-200 pt-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <FiMapPin className="text-blue-600" size={18} />
                <h3 className="text-lg font-semibold text-gray-900">Assigned Location</h3>
              </div>
              <p className="text-sm text-gray-500 mb-4">
                Assign one location to this user. During reservation creation, only this location will be available for selection.
              </p>
              <div className="max-w-sm">
                <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                {locationOptions.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">
                    No locations available. An admin must first add locations in the Settings page.
                  </p>
                ) : (
                  <select
                    value={locationForm.default_location_id}
                    onChange={(e) => setLocationForm(prev => ({ ...prev, default_location_id: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— No location assigned —</option>
                    {locationOptions.map((loc) => (
                      <option key={loc.id} value={String(loc.id)}>{loc.name}{loc.address ? ` – ${loc.address}` : ''}</option>
                    ))}
                  </select>
                )}
              </div>
              <div className="mt-4 flex justify-start">
                <button
                  onClick={handleSaveLocationSettings}
                  disabled={locationSaving}
                  className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {locationSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving…
                    </>
                  ) : 'Save Location'}
                </button>
              </div>
            </div>

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
            {loadingDocs ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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

      <EditUserModal 
        isOpen={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
        onSuccess={handleEditSuccess} 
        initialData={user} 
      />

      {showEditDocument && editingDocument && (
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
      )}
    </div>
  );
};

export default UserProfile;
