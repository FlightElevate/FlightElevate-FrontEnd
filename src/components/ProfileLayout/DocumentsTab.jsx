import React, { useState, useEffect } from 'react';
import { FiMoreVertical } from 'react-icons/fi';

/**
 * Reusable Documents Tab Component
 * @param {array} documents - Array of document objects
 * @param {boolean} loading - Loading state
 * @param {function} onDelete - Delete handler
 * @param {function} onEdit - Edit handler
 */
const DocumentsTab = ({ documents = [], loading = false, onDelete, onEdit }) => {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (index) => {
    setOpenMenu(openMenu === index ? null : index);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.menu-container')) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        No documents found
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {documents.map((doc, index) => (
        <div
          key={doc.id || index}
          className="flex items-start justify-between p-4 border border-gray-200 rounded-lg bg-white hover:bg-gray-50 transition"
        >
          {/* Left Side - Label */}
          <div className="w-1/3">
            <h4 className="text-sm font-medium text-gray-900">{doc.title}</h4>
          </div>

          {/* Right Side - Content */}
          <div className="flex-1 flex flex-col items-end pr-4">
            {doc.details && doc.details.length > 0 ? (
              doc.details.map((detail, idx) => (
                <p
                  key={idx}
                  className={`text-sm ${
                    detail.toLowerCase().includes('expired') &&
                    !detail.toLowerCase().includes('expires at')
                      ? 'text-red-600 font-medium'
                      : 'text-gray-900'
                  }`}
                >
                  {detail}
                </p>
              ))
            ) : doc.expiry_date ? (
              <p
                className={`text-sm ${
                  doc.is_expired ? 'text-red-600 font-medium' : 'text-gray-900'
                }`}
              >
                {doc.is_expired ? 'Expired: ' : 'Expires at: '}
                {doc.expiry_date}
              </p>
            ) : null}
          </div>

          {/* Far Right - Menu */}
          <button
            className="p-2 hover:bg-gray-100 rounded menu-container relative"
            onClick={() => toggleMenu(index)}
          >
            <FiMoreVertical className="text-gray-500" />

            {openMenu === index && (
              <div className="absolute right-0 top-full mt-1 w-32 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {onEdit && (
                  <button
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => {
                      onEdit(doc);
                      setOpenMenu(null);
                    }}
                  >
                    Edit
                  </button>
                )}
                {onDelete && (
                  <button
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    onClick={() => {
                      onDelete(doc.id);
                      setOpenMenu(null);
                    }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </button>
        </div>
      ))}
    </div>
  );
};

export default DocumentsTab;

