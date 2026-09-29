import React, { memo } from 'react';
import Pagination from '../Pagination';

export const UsersTable = memo(({
  users = [],
  locations = [],
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
      <div className="text-center py-12 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: {
        bg: 'bg-green-100',
        text: 'text-green-600',
      },
      blocked: {
        bg: 'bg-red-100',
        text: 'text-red-600',
      },
      inactive: {
        bg: 'bg-yellow-100',
        text: 'text-yellow-600',
      },
    };

    const config = statusConfig[status] || statusConfig.active;

    return (
      <span
        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold capitalize ${config.bg} ${config.text}`}
      >
        <span
          className="h-1.5 w-1.5 rounded-full bg-current"
          aria-hidden="true"
        />
        {status || 'Active'}
      </span>
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';

    const date = new Date(dateString);

    return Number.isNaN(date.getTime())
      ? 'N/A'
      : date.toLocaleDateString();
  };

  const getDefaultLocationName = (user) => {
    const directName =
      user.default_location?.name ||
      user.default_location_name ||
      user.defaultLocation?.name;

    if (directName) return directName;

    const locationId =
      user.default_location_id ?? user.defaultLocationId;

    if (locationId == null || locationId === '') {
      return 'N/A';
    }

    return (
      locations.find(
        (location) =>
          String(location.id) === String(locationId)
      )?.name || 'N/A'
    );
  };

  return (
    <>
      <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-gray-50/80 text-gray-600">
              <tr>
                <th className="px-6 py-4 font-semibold">
                  Name
                </th>
                <th className="px-6 py-4 font-semibold">
                  Email
                </th>
                <th className="px-6 py-4 font-semibold">
                  Phone
                </th>
                <th className="px-6 py-4 font-semibold">
                  Default Location
                </th>
                <th className="px-6 py-4 font-semibold">
                  Status
                </th>
                <th className="px-6 py-4 font-semibold">
                  Joined Date
                </th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-gray-200 transition-colors duration-150 hover:bg-blue-50/40"
                >
                  <td className="px-6 py-5 font-semibold text-gray-800">
                    {user.name}
                  </td>

                  <td className="px-6 py-5 text-gray-600">
                    {user.email}
                  </td>

                  <td className="px-6 py-5 text-gray-600">
                    {user.phone || 'N/A'}
                  </td>

                  <td className="px-6 py-5 text-gray-600">
                    {getDefaultLocationName(user)}
                  </td>

                  <td className="px-6 py-5">
                    {getStatusBadge(user.status)}
                  </td>

                  <td className="px-6 py-5 text-gray-600">
                    {formatDate(user.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalItems > itemsPerPage && (
        <div className="mt-5 flex justify-center">
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



