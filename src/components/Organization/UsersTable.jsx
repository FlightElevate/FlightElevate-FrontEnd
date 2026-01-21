import React, { memo } from 'react';
import Pagination from '../Pagination';


export const UsersTable = memo(({
  users = [],
  loading = false,
  currentPage = 1,
  setPage,
  itemsPerPage = 10,
  totalItems = 0,
  emptyMessage = 'No users found',
}) => {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">{emptyMessage}</div>
    );
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { bg: 'bg-green-100', text: 'text-green-600' },
      blocked: { bg: 'bg-red-100', text: 'text-red-600' },
      inactive: { bg: 'bg-yellow-100', text: 'text-yellow-600' },
    };

    const config = statusConfig[status] || statusConfig.active;

    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}
      >
        {status || 'Active'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-b border-gray-200">
          <thead className="bg-gray-50 text-gray-700 font-medium">
            <tr>
              <th className="px-6 py-3">Name</th>
              <th className="px-6 py-3">Email</th>
              <th className="px-6 py-3">Phone</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Joined Date</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="border-b border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <td className="px-6 py-4 font-medium text-gray-800">
                  {user.name}
                </td>
                <td className="px-6 py-4 text-gray-600">{user.email}</td>
                <td className="px-6 py-4 text-gray-600">
                  {user.phone || 'N/A'}
                </td>
                <td className="px-6 py-4">{getStatusBadge(user.status)}</td>
                <td className="px-6 py-4 text-gray-600">
                  {formatDate(user.created_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalItems > itemsPerPage && (
        <div className="mt-6 flex justify-center">
          <Pagination
            page={currentPage}
            setPage={setPage}
            perPage={itemsPerPage}
            setPerPage={() => {}}
            totalItems={totalItems}
          />
        </div>
      )}
    </>
  );
});

UsersTable.displayName = 'UsersTable';

