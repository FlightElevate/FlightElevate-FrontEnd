import React, { useState, useEffect } from "react";
import { FiSearch, FiMoreVertical } from "react-icons/fi";
import { useParams } from "react-router-dom";
import gear_filler from "../../../assets/SVG/gear-filled.svg";
import profileImg from "../../../assets/img/profile.jpg";
import { userService } from "../../../api/services/userService";
import { documentService } from "../../../api/services/documentService";
import { lessonService } from "../../../api/services/lessonService";
import { settingsService } from "../../../api/services/settingsService";
import { showDeleteConfirm, showSuccessToast, showErrorToast, showBlockUserConfirm } from "../../../utils/notifications";
import { formatDate, formatTime } from "../../../utils/dateFormatter";
import { getImageUrl } from "../../../utils/imageUtils";

const UserProfile = () => {
  const { id } = useParams();
  
  const [user, setUser] = useState(null);
  const [loadingUser, setLoadingUser] = useState(true);
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

  useEffect(() => {
    if (id) {
      fetchUser();
      fetchDocuments();
      fetchFlightLogs();
    }
  }, [id]);

  const fetchUser = async () => {
    setLoadingUser(true);
    try {
      const response = await userService.getUser(id);
      if (response.success) {
        const userData = response.data;
        setUser(userData);
        
        // Debug: Log user data to see what fields are available
        console.log('User data:', userData);
        console.log('Avatar fields:', {
          avatar: userData?.avatar,
          profile_image: userData?.profile_image,
          avatar_url: userData?.avatar_url,
        });
        
        // Try to get profile image from user object, fallback to organization logo
        const avatarUrl = userData?.avatar || userData?.profile_image || userData?.avatar_url || userData?.organization?.logo;
        if (avatarUrl) {
          const fullImageUrl = getImageUrl(avatarUrl);
          console.log('Profile image URL:', fullImageUrl);
          setProfileImage(avatarUrl);
        } else {
          console.log('No profile image found in user object');
          setProfileImage(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoadingUser(false);
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
      const response = await lessonService.getUserLessons(id, { per_page: 10 });
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
      log.date?.toLowerCase().includes(searchLower) ||
      log.time?.toLowerCase().includes(searchLower) ||
      log.instructor?.toLowerCase().includes(searchLower) ||
      log.status?.toLowerCase().includes(searchLower) ||
      log.flight_type?.toLowerCase().includes(searchLower)
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
        
        {}
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
          <button onClick={handleBlockUser} className={`mt-4 sm:mt-0 px-5 py-2.5 flex items-center gap-2 rounded-lg transition ${
            user?.status === 'blocked' 
              ? 'bg-green-50 text-green-600 hover:bg-green-100' 
              : 'bg-red-50 text-red-600 hover:bg-red-100'
          }`}>
            <img src={gear_filler} alt="Settings" className="w-4 h-4" />
            <span className="text-sm font-medium">{user?.status === 'blocked' ? 'Unblock User' : 'Block User'}</span>
          </button>
        </div>

        {}
        <div className="border-b border-gray-200">
          <div className="px-6 flex gap-2">
            <button className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "profile" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`} onClick={() => setActiveTab("profile")}>
              Profile Details
            </button>
            <button className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === "documents" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-600 hover:text-gray-900"}`} onClick={() => setActiveTab("documents")}>
              Documents
            </button>
          </div>
        </div>

        {}
        {activeTab === "profile" ? (
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 mb-8">
              <div><p className="text-sm text-gray-500 mb-1">Name</p><p className="text-sm font-medium text-gray-900">{user?.name || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Certificates</p><div className="flex gap-2">{certificates.map((cert, i) => (<span key={i} className={`px-2 py-0.5 text-xs font-medium rounded ${cert.color}`}>{cert.name}</span>))}</div></div>
              <div><p className="text-sm text-gray-500 mb-1">Location</p><p className="text-sm font-medium text-gray-900">{user?.organization?.name || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Phone</p><p className="text-sm font-medium text-gray-900">{user?.phone || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Email</p><p className="text-sm font-medium text-gray-900">{user?.email || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Username</p><p className="text-sm font-medium text-gray-900">{user?.username || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Balance</p><p className="text-sm font-medium text-gray-900">$0.00</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Company</p><p className="text-sm font-medium text-gray-900">{user?.organization?.name || 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Created</p><p className="text-sm font-medium text-gray-900">{user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Last Flight</p><p className="text-sm font-medium text-gray-900">{user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500 mb-1">Last Login</p><p className="text-sm font-medium text-gray-900">{user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'N/A'}</p></div>
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
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Instructor</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Flight Type</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFlightLogs.map((log, index) => (
                        <tr key={index} className="border-t border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3">{log.date || formatDate(log.full_date)}</td>
                          <td className="px-4 py-3">{log.time || formatTime(log.full_time)}</td>
                          <td className="px-4 py-3">{log.instructor}</td>
                          <td className="px-4 py-3">
                            <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">{log.status}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-600">{log.flight_type}</td>
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

      {/* Edit Document Modal */}
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
