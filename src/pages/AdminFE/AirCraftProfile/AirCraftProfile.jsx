import React, { useState, useRef, useEffect } from "react";
import { FiSearch, FiX, FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import { HiChevronDown } from "react-icons/hi";
import { useNavigate } from "react-router-dom";
import { aircraftService } from "../../../api/services/aircraftService";
import { showSuccessToast, showErrorToast, showDeleteConfirm } from "../../../utils/notifications";
import { useAuth } from "../../../context/AuthContext";

const AirCraftProfile = () => {

  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState("Newest");
  const sortRef = useRef(null);
  const [aircrafts, setAircrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAircraft, setEditingAircraft] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const menuRefs = useRef({});
  
  
  const [formData, setFormData] = useState({
    name: '',
    model: '',
    category: '',
    additional_attributes: {},
    serial_number: '',
    image: '',
    status: 'in_service',
    total_hours: 0,
    total_cycles: 0,
  });
  const [additionalAttributes, setAdditionalAttributes] = useState([{ key: '', value: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  
  useEffect(() => {
    fetchAircraft();
  }, []);

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sortRef.current && !sortRef.current.contains(event.target)) {
        setSortOpen(false);
      }
      
      const clickedOutsideAllMenus = Object.values(menuRefs.current).every(
        (ref) => !ref?.contains(event.target)
      );
      if (clickedOutsideAllMenus) {
        setMenuOpenId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchAircraft = async () => {
    setLoading(true);
    try {
      const response = await aircraftService.getAircraft({ per_page: 100 });
      if (response.success) {
        const aircraftList = Array.isArray(response.data) ? response.data : [];
        setAircrafts(aircraftList);
      }
    } catch (err) {
      console.error('Error fetching aircraft:', err);
      showErrorToast('Failed to load aircraft');
      setAircrafts([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAircrafts = aircrafts
    .filter((aircraft) =>
      aircraft.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      aircraft.model?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) =>
      sortBy === "Newest" 
        ? new Date(b.created_at) - new Date(a.created_at)
        : new Date(a.created_at) - new Date(b.created_at)
    );

  const handleCardClick = (aircraft) => {
    const status = aircraft.status === 'in_service' ? 'In Service' : aircraft.status;
    if (status === "In Service") {
      navigate(`/air-craft-profile/aircraft/${aircraft.id}`); 
    }
  };

  const handleAdd = () => {
    setEditingAircraft(null);
    setFormData({
      name: '',
      model: '',
      category: '',
      additional_attributes: {},
      serial_number: '',
      image: '',
      status: 'in_service',
      total_hours: 0,
      total_cycles: 0,
    });
    setAdditionalAttributes([{ key: '', value: '' }]);
    setImageFile(null);
    setImagePreview(null);
    setShowModal(true);
  };

  const handleEdit = (aircraft, e) => {
    e.stopPropagation();
    setEditingAircraft(aircraft);
    const attrs = aircraft.additional_attributes || {};
    const attrArray = Object.keys(attrs).length > 0 
      ? Object.entries(attrs).map(([key, value]) => ({ key, value: String(value) }))
      : [{ key: '', value: '' }];
    
    setFormData({
      name: aircraft.name || '',
      model: aircraft.model || '',
      category: aircraft.category || '',
      additional_attributes: attrs,
      serial_number: aircraft.serial_number || '',
      image: aircraft.image || '',
      status: aircraft.status || 'in_service',
      total_hours: aircraft.total_hours || 0,
      total_cycles: aircraft.total_cycles || 0,
    });
    
    // Set existing image preview if available
    if (aircraft.image) {
      setImagePreview(aircraft.image);
    } else {
      setImagePreview(null);
    }
    setAdditionalAttributes(attrArray);
    setImageFile(null);
    setImagePreview(aircraft.image || null);
    setMenuOpenId(null);
    setShowModal(true);
  };

  const handleDelete = async (aircraft, e) => {
    e.stopPropagation();
    setMenuOpenId(null);
    
    const confirmed = await showDeleteConfirm(`"${aircraft.name}"`);
    if (!confirmed) return;

    try {
      const response = await aircraftService.deleteAircraft(aircraft.id);
      if (response.success) {
        showSuccessToast('Aircraft deleted successfully');
        fetchAircraft();
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to delete aircraft');
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      
      if (!file.type.startsWith('image/')) {
        showErrorToast('Please select a valid image file');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        showErrorToast('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Convert additional attributes array to object
      const attrsObject = {};
      additionalAttributes.forEach(attr => {
        if (attr.key && attr.key.trim()) {
          attrsObject[attr.key.trim()] = attr.value.trim() || '';
        }
      });
      
      const finalFormData = {
        ...formData,
        additional_attributes: Object.keys(attrsObject).length > 0 ? attrsObject : null,
      };
      
      const dataToSend = imageFile ? new FormData() : { ...finalFormData };
      
      if (imageFile) {
        Object.keys(finalFormData).forEach(key => {
          if (key === 'additional_attributes' && finalFormData[key]) {
            dataToSend.append(key, JSON.stringify(finalFormData[key]));
          } else if (key !== 'image' || !finalFormData.image) {
            if (finalFormData[key] !== null && finalFormData[key] !== undefined) {
              dataToSend.append(key, finalFormData[key]);
            }
          }
        });
        dataToSend.append('image_file', imageFile);
      }

      if (editingAircraft) {
        const response = imageFile 
          ? await aircraftService.updateAircraft(editingAircraft.id, dataToSend)
          : await aircraftService.updateAircraft(editingAircraft.id, finalFormData);
        if (response.success) {
          showSuccessToast('Aircraft updated successfully');
          setShowModal(false);
          setImageFile(null);
          setImagePreview(null);
          fetchAircraft();
        }
      } else {
        const response = imageFile
          ? await aircraftService.createAircraft(dataToSend)
          : await aircraftService.createAircraft(finalFormData);
        if (response.success) {
          showSuccessToast('Aircraft created successfully');
          setShowModal(false);
          setImageFile(null);
          setImagePreview(null);
          fetchAircraft();
        }
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || `Failed to ${editingAircraft ? 'update' : 'create'} aircraft`);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusDisplay = (status) => {
    const statusMap = {
      'in_service': 'In Service',
      'not_in_service': 'Not In Service',
      'maintenance': 'Maintenance'
    };
    return statusMap[status] || status;
  };

  const getStatusColor = (status) => {
    if (status === 'in_service') {
      return 'bg-[#FFF1DA] text-[#C47E0A]';
    }
    return 'bg-[#FFE3E3] text-[#961616]';
  };

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white shadow-sm rounded-lg">
        {}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#F3F4F6] p-4 gap-4">
          <h2 className="text-xl font-semibold text-gray-800">Aircraft</h2>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {}
            {user?.permissions?.includes('create aircraft') && (
              <button
                onClick={handleAdd}
                className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-sm text-sm font-medium hover:bg-blue-700 transition-colors min-h-[44px] whitespace-nowrap"
              >
                <FiPlus size={18} className="flex-shrink-0" />
                <span>Add Aircraft</span>
              </button>
            )}
            
            {}
            <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm w-full sm:w-[250px] min-h-[44px]">
              <FiSearch className="text-gray-400 mr-2 flex-shrink-0" size={16} />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full min-w-0"
              />
              <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded flex-shrink-0 hidden sm:inline">
                ⌘
              </span>
            </div>
            
            {}
            <div className="relative w-full sm:w-auto" ref={sortRef}>
              <button
                onClick={() => setSortOpen(!sortOpen)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm text-sm text-gray-700 min-h-[44px] whitespace-nowrap hover:bg-gray-50 transition-colors"
              >
                <MdFilterList className="w-5 h-5 flex-shrink-0" />
                <span className="hidden sm:inline">Sort by</span>
                <HiChevronDown 
                  size={16} 
                  className={`transition-transform flex-shrink-0 ${sortOpen ? 'transform rotate-180' : ''}`}
                />
              </button>
       
              {sortOpen && (
                <div className="absolute right-0 mt-2 w-full sm:w-48 md:w-56 bg-white border border-gray-200 rounded-lg shadow-xl z-50 overflow-hidden">
                  <div className="py-1">
                    {["Newest", "Oldest"].map((option) => (
                      <button
                        key={option}
                        onClick={() => {
                          setSortBy(option);
                          setSortOpen(false);
                        }}
                        className={`block w-full text-left px-4 py-3 text-sm hover:bg-gray-100 active:bg-gray-200 transition-colors min-h-[44px] flex items-center justify-between ${
                          sortBy === option
                            ? "text-blue-600 font-medium"
                            : "text-gray-700"
                        }`}
                      >
                        <span>{option}</span>
                        {sortBy === option && (
                          <span className="text-xs text-gray-500">{sortBy === "Newest" ? '↓' : '↑'}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {}
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredAircrafts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No aircraft found</p>
          </div>
        ) : (
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {filteredAircrafts.map((aircraft) => {
                const statusDisplay = getStatusDisplay(aircraft.status);
                const isInService = aircraft.status === 'in_service';
                
                return (
                  <div
                    key={aircraft.id}
                    className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all duration-200 relative group hover:shadow-md"
                  >
                    <div
                      onClick={(e) => {
                        
                        if (e.target.closest('.action-menu-container')) {
                          return;
                        }
                        handleCardClick(aircraft);
                      }}
                      className={`cursor-pointer ${isInService ? 'hover:shadow-md' : 'cursor-not-allowed opacity-75'}`}
                    >
                      <div className="w-full h-44 bg-gray-100 overflow-hidden">
                        <img
                          src={aircraft.image || 'https://via.placeholder.com/400x300?text=No+Image'}
                          alt={aircraft.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/400x300?text=No+Image';
                          }}
                        />
                      </div>
                      <div className="p-4 flex items-center justify-between border-t border-gray-100">
                        <h3 className="text-base font-medium text-gray-800 truncate flex-1">
                          {aircraft.name}
                        </h3>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded ml-2 whitespace-nowrap ${getStatusColor(aircraft.status)}`}>
                          {statusDisplay}
                        </span>
                      </div>
                    </div>
                    
                    {}
                    {(user?.permissions?.includes('edit aircraft') || user?.permissions?.includes('delete aircraft')) && (
                    <div 
                      className="action-menu-container absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="relative" ref={(el) => (menuRefs.current[aircraft.id] = el)}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setMenuOpenId(menuOpenId === aircraft.id ? null : aircraft.id);
                          }}
                          className="p-2 bg-white rounded-lg shadow-md hover:bg-gray-50 transition"
                        >
                          <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                       
                        {menuOpenId === aircraft.id &&  (
                          <div 
                            className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-50"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {user?.permissions?.includes('edit aircraft') && (
                            <button
                              onClick={(e) => handleEdit(aircraft, e)}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <FiEdit2 size={14} />
                              Edit
                            </button>
                            )}
                            {user?.permissions?.includes('delete aircraft') && (
                            <button
                              onClick={(e) => handleDelete(aircraft, e)}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2"
                            >
                              <FiTrash2 size={14} />
                              Delete
                            </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {}
      {showModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800">
                {editingAircraft ? 'Edit Aircraft' : 'Add New Aircraft'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setImageFile(null);
                  setImagePreview(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <FiX size={24} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., Airplane, Rotorcraft, Glider"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Serial Number *</label>
                  <input
                    type="text"
                    value={formData.serial_number}
                    onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Additional Attributes</label>
                  <div className="space-y-2">
                    {additionalAttributes.map((attr, index) => (
                      <div key={index} className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          placeholder="Attribute Key"
                          value={attr.key}
                          onChange={(e) => {
                            const newAttrs = [...additionalAttributes];
                            newAttrs[index].key = e.target.value;
                            setAdditionalAttributes(newAttrs);
                          }}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="Attribute Value"
                            value={attr.value}
                            onChange={(e) => {
                              const newAttrs = [...additionalAttributes];
                              newAttrs[index].value = e.target.value;
                              setAdditionalAttributes(newAttrs);
                            }}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          {additionalAttributes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setAdditionalAttributes(additionalAttributes.filter((_, i) => i !== index));
                              }}
                              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                            >
                              <FiX size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setAdditionalAttributes([...additionalAttributes, { key: '', value: '' }])}
                      className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition"
                    >
                      <FiPlus size={16} />
                      Add Attribute
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Aircraft Image</label>
                  
                  {}
                  {(imagePreview || formData.image) && (
                    <div className="mb-3 flex-shrink-0">
                      <img
                        src={imagePreview || formData.image}
                        alt="Preview"
                        className="object-cover rounded-lg border border-gray-300 flex-shrink-0"
                        style={{ 
                          width: '128px', 
                          height: '128px', 
                          minWidth: '128px', 
                          minHeight: '128px',
                          maxWidth: '128px',
                          maxHeight: '128px'
                        }}
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {}
                  <div className="mb-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">Upload an image file (max 5MB) or use URL below</p>
                  </div>

                  {}
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">OR</span>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => {
                        setFormData({ ...formData, image: e.target.value });
                        if (e.target.value) {
                          setImagePreview(e.target.value);
                        }
                      }}
                      className="w-full border border-gray-300 rounded-lg pl-12 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter image URL"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="in_service">In Service</option>
                    <option value="not_in_service">Not In Service</option>
                    <option value="maintenance">Maintenance</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Hours</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.total_hours}
                      onChange={(e) => setFormData({ ...formData, total_hours: parseFloat(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Total Cycles</label>
                    <input
                      type="number"
                      value={formData.total_cycles}
                      onChange={(e) => setFormData({ ...formData, total_cycles: parseInt(e.target.value) || 0 })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : editingAircraft ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AirCraftProfile;
