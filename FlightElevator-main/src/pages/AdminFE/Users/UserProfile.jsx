import React, { useState, useEffect } from "react";
import { FiSearch, FiMoreVertical } from "react-icons/fi";
import { useParams } from "react-router-dom";
import gear_filler from "../../../assets/SVG/gear-filled.svg";
import profileImg from "../../../assets/img/profile.jpg";
import { userService } from "../../../api/services/userService";
import { documentService } from "../../../api/services/documentService";
import { lessonService } from "../../../api/services/lessonService";
import { showDeleteConfirm, showSuccessToast, showErrorToast, showBlockUserConfirm } from "../../../utils/notifications";
import { formatDate, formatTime } from "../../../utils/dateFormatter";

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
        setUser(response.data);
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
        fetchUser(); // Refresh user data
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

  // Filter flight logs based on search
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
        
        {/* Header */}
        <div className="px-6 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-gray-200">
          <div className="flex items-center gap-4">
            <img src={profileImg} alt="User Avatar" className="w-16 h-16 rounded-full object-cover" />
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

        {/* Tabs */}
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

        {/* Content */}
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
                    <button className="p-2 hover:bg-gray-100 rounded menu-container relative" onClick={() => toggleMenu(index)}>
                      <FiMoreVertical className="text-gray-500" />
                      {openMenu === index && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                          <button className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100" onClick={() => alert(`Edit: ${doc.title}`)}>Edit</button>
                          <button className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100" onClick={() => handleDeleteDocument(doc.id, doc.title)}>Delete</button>
                        </div>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
