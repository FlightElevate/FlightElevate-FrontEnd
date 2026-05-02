import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import { useOrganizationDetails } from '../../hooks/useOrganizationDetails';
import { useOrganizationUsers } from '../../hooks/useOrganizationUsers';
import { OrganizationTabs } from '../../components/Organization/OrganizationTabs';
import { OrganizationInfoCard } from '../../components/Organization/OrganizationInfoCard';
import { UsersTable } from '../../components/Organization/UsersTable';
import {
  formatUserInfo,
  formatOrganizationInfo,
  getOrganizationTitle,
} from '../../utils/organizationHelpers';
import { organizationService } from '../../api/services/organizationService';
import { showConfirmDialog, showSuccessToast, showErrorToast } from '../../utils/notifications';


const OrganizationDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('admins');
  const [adminsPage, setAdminsPage] = useState(1);
  const [instructorsPage, setInstructorsPage] = useState(1);
  const [studentsPage, setStudentsPage] = useState(1);
  const [joinRequestsPage, setJoinRequestsPage] = useState(1);
  const [actionLoading, setActionLoading] = useState(null);
  const itemsPerPage = 10;

  
  const fetchType = searchParams.get('type') || 'user';

  
  const {
    organization,
    adminUser: adminDetails,
    loading: loadingDetails,
    error: detailsError,
  } = useOrganizationDetails(id, fetchType);

  
  // Determine the organization ID from available data
  const organizationId = organization?.id || adminDetails?.organization_id || (fetchType === 'organization' ? id : null);

  
  const {
    users: admins,
    loading: loadingAdmins,
    total: adminsTotal,
  } = useOrganizationUsers(
    organizationId,
    'Admin',
    adminsPage,
    itemsPerPage
  );

  const {
    users: instructors,
    loading: loadingInstructors,
    total: instructorsTotal,
  } = useOrganizationUsers(
    organizationId,
    'Instructor',
    instructorsPage,
    itemsPerPage
  );

  const {
    users: students,
    loading: loadingStudents,
    total: studentsTotal,
  } = useOrganizationUsers(
    organizationId,
    'Student',
    studentsPage,
    itemsPerPage
  );

  const {
    users: joinRequests,
    loading: loadingJoinRequests,
    total: joinRequestsTotal,
    refetch: refetchJoinRequests,
  } = useOrganizationUsers(
    organizationId,
    null,
    joinRequestsPage,
    itemsPerPage,
    'pending'
  );

  
  const tabCounts = useMemo(
    () => ({
      admins: adminsTotal,
      instructors: instructorsTotal,
      students: studentsTotal,
      joinRequests: joinRequestsTotal,
    }),
    [adminsTotal, instructorsTotal, studentsTotal, joinRequestsTotal]
  );

  
  const currentListData = useMemo(() => {
    switch (activeTab) {
      case 'admins':
        return {
          users: admins,
          loading: loadingAdmins,
          page: adminsPage,
          total: adminsTotal,
          setPage: setAdminsPage,
          emptyMessage: 'No admins found in this organization',
        };
      case 'instructors':
        return {
          users: instructors,
          loading: loadingInstructors,
          page: instructorsPage,
          total: instructorsTotal,
          setPage: setInstructorsPage,
          emptyMessage: 'No instructors found in this organization',
        };
      case 'students':
        return {
          users: students,
          loading: loadingStudents,
          page: studentsPage,
          total: studentsTotal,
          setPage: setStudentsPage,
          emptyMessage: 'No students found in this organization',
        };
      case 'join-requests':
        return {
          users: joinRequests,
          loading: loadingJoinRequests,
          page: joinRequestsPage,
          total: joinRequestsTotal,
          setPage: setJoinRequestsPage,
          emptyMessage: 'No pending join requests',
          showActions: true,
        };
      default:
        return {
          users: [],
          loading: false,
          page: 1,
          total: 0,
          setPage: () => {},
          emptyMessage: 'No users found',
        };
    }
  }, [
    activeTab,
    admins,
    instructors,
    students,
    loadingAdmins,
    loadingInstructors,
    loadingStudents,
    adminsPage,
    instructorsPage,
    studentsPage,
    adminsTotal,
    instructorsTotal,
    studentsTotal,
  ]);

  
  const userInfoItems = useMemo(
    () => formatUserInfo(adminDetails),
    [adminDetails]
  );

  const organizationInfoItems = useMemo(
    () => formatOrganizationInfo(organization, adminDetails),
    [organization, adminDetails]
  );

  
  const handleApprove = async (userId, userName) => {
    const confirmed = await showConfirmDialog(
      `Approve ${userName}`,
      `Are you sure you want to approve this join request?`,
      `Yes, approve`
    );
    if (!confirmed) return;

    setActionLoading(userId);
    try {
      const response = await organizationService.approveJoinRequest(organizationId, userId);
      if (response.success) {
        showSuccessToast('Request approved successfully');
        refetchJoinRequests();
      }
    } catch (err) {
      showErrorToast('Failed to approve request');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId, userName) => {
    const confirmed = await showConfirmDialog(
      `Reject ${userName}`,
      `Are you sure you want to reject this join request?`,
      `Yes, reject`
    );
    if (!confirmed) return;

    setActionLoading(userId);
    try {
      const response = await organizationService.rejectJoinRequest(organizationId, userId);
      if (response.success) {
        showSuccessToast('Request rejected successfully');
        refetchJoinRequests();
      }
    } catch (err) {
      showErrorToast('Failed to reject request');
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleUpdateOrg = async (field, value) => {
    setActionLoading(field);
    try {
      const response = await organizationService.updateOrganization(organizationId, {
        [field]: value
      });
      if (response.success) {
        showSuccessToast('Organization updated successfully');
        // The details are likely being watched by the hook, but we might need a refresh
        window.location.reload(); 
      }
    } catch (err) {
      showErrorToast('Failed to update organization');
    } finally {
      setActionLoading(null);
    }
  };

  const isSuperAdmin = useAuth().user?.roles?.includes('Super Admin');

  
  const hasOrganization = organization && organization.id;

  
  if (loadingDetails) {
    return (
      <div className="md:mt-5 mx-auto">
        <div className="bg-white inset-shadow-sm shadow-xl rounded-lg px-4 py-5">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  
  if (detailsError || (!organization && !adminDetails)) {
    return (
      <div className="md:mt-5 mx-auto">
        <div className="bg-white inset-shadow-sm shadow-xl rounded-lg px-4 py-5">
          <button
            onClick={() => navigate('/user-management')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-4 transition-colors"
          >
            <FiArrowLeft size={20} />
            <span>Back to User Management</span>
          </button>
          <div className="text-center py-12 text-red-600">
            {detailsError || 'Organization or user not found'}
          </div>
        </div>
      </div>
    );
  }

  const organizationTitle = organization?.name || getOrganizationTitle(adminDetails) || 'Organization Details';

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white inset-shadow-sm shadow-xl rounded-lg px-4 py-5">
        {}
        <button
          onClick={() => navigate('/user-management')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-800 mb-6 transition-colors"
          aria-label="Back to User Management"
        >
          <FiArrowLeft size={20} />
          <span className="font-medium">Back to User Management</span>
        </button>

        {}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-800">
            {organizationTitle}
          </h1>
        </div>

        {}
        <div className="mb-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {}
            {adminDetails && (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                  Admin Information
                </h3>
                <div className="space-y-3">
                  {userInfoItems.map((item, index) => (
                    <div key={index} className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500 mb-1">
                        {item.label}:
                      </span>
                      {item.status !== undefined ? (
                        <div className="flex items-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              item.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : item.status === 'blocked'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}
                          >
                            {item.value || 'Active'}
                          </span>
                        </div>
                      ) : (
                        <p className="text-gray-800 font-medium">
                          {item.value || 'N/A'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {}
            {hasOrganization ? (
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-gray-200">
                  Organization Information
                </h3>
                <div className="space-y-3">
                  {organizationInfoItems.map((item, index) => (
                    <div key={index} className="flex flex-col">
                      <span className="text-sm font-medium text-gray-500 mb-1">
                        {item.label}:
                      </span>
                      <p className="text-gray-800 font-medium">
                        {item.value || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-yellow-50 rounded-lg p-6 border border-yellow-200">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-3 border-b border-yellow-200">
                  Organization Information
                </h3>
                <div className="flex items-center justify-center py-8">
                  <p className="text-gray-600 text-center">
                    This admin is not associated with any organization.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Management Actions Section */}
          {hasOrganization && isSuperAdmin && (
            <div className="mt-6 bg-blue-50 rounded-lg p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-4 pb-3 border-b border-blue-200">
                Management Actions (Super Admin)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Verification Status */}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500 mb-2">Verification Status:</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateOrg('verification_status', 'verified')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${organization.verification_status === 'verified' ? 'bg-green-600 text-white' : 'bg-white text-green-600 border border-green-600 hover:bg-green-50'}`}
                    >
                      Verify Org
                    </button>
                    <button 
                      onClick={() => handleUpdateOrg('verification_status', 'rejected')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${organization.verification_status === 'rejected' ? 'bg-red-600 text-white' : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'}`}
                    >
                      Reject Org
                    </button>
                  </div>
                </div>

                {/* Account Status */}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500 mb-2">Account Status:</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleUpdateOrg('status', 'active')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${organization.status === 'active' ? 'bg-blue-600 text-white' : 'bg-white text-blue-600 border border-blue-600 hover:bg-blue-50'}`}
                    >
                      Set Active
                    </button>
                    <button 
                      onClick={() => handleUpdateOrg('status', 'blocked')}
                      className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${organization.status === 'blocked' ? 'bg-red-600 text-white' : 'bg-white text-red-600 border border-red-200 hover:bg-red-50'}`}
                    >
                      Block Org
                    </button>
                  </div>
                </div>

                {/* Trial Period */}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-gray-500 mb-2">Trial Period:</span>
                  <input 
                    type="date"
                    className="px-3 py-1.5 rounded border border-gray-300 text-sm focus:ring-blue-500 focus:border-blue-500"
                    value={organization.trial_ends_at ? new Date(organization.trial_ends_at).toISOString().split('T')[0] : ''}
                    onChange={(e) => handleUpdateOrg('trial_ends_at', e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {}
        {hasOrganization ? (
          <>
            <div className="mb-6">
              <OrganizationTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabCounts={tabCounts}
              />
            </div>

            {}
            <div className="mt-6">
              <UsersTable
                users={currentListData.users}
                loading={currentListData.loading}
                currentPage={currentListData.page}
                setPage={currentListData.setPage}
                itemsPerPage={itemsPerPage}
                totalItems={currentListData.total}
                emptyMessage={currentListData.emptyMessage}
                showActions={currentListData.showActions}
                onApprove={handleApprove}
                onReject={handleReject}
                actionLoading={actionLoading}
              />
            </div>
          </>
        ) : (
          <div className="bg-gray-50 rounded-lg p-8 border border-gray-200 text-center">
            <p className="text-gray-600">
              This admin is not associated with any organization. No users to display.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationDetail;
