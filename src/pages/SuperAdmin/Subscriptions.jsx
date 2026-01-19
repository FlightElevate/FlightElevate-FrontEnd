import React, { useState, useEffect } from "react";
import { FiSearch, FiPlus } from "react-icons/fi";
import { MdFilterList } from "react-icons/md";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { CgAdd } from "react-icons/cg";
import Pagination from "../../components/Pagination";
import { subscriptionPlanService } from "../../api/services/subscriptionPlanService";
import { showSuccessToast, showErrorToast, showDeleteConfirm } from "../../utils/notifications";

const Subscription = () => {
  const { state } = useLocation();
  const [selected, setSelected] = useState(state?.tab || "Subscribers");
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedPlans, setExpandedPlans] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (selected === "Subscription Plans") {
      fetchPlans();
    }
  }, [selected]);

  
  useEffect(() => {
    if (state?.tab) {
      setSelected(state.tab);
    }
  }, [state]);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await subscriptionPlanService.getSubscriptionPlans({
        per_page: 100,
        search: searchTerm || undefined,
      });
      if (response.success) {
        const plansList = Array.isArray(response.data) ? response.data : [];
        setPlans(plansList);
        setExpandedPlans(plansList.map((_, idx) => idx));
      }
    } catch (err) {
      console.error('Error fetching plans:', err);
      showErrorToast('Failed to load subscription plans');
      setPlans([]);
    } finally {
      setLoading(false);
    }
  };

  const togglePlan = (index) => {
    setExpandedPlans((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleDelete = async (plan, e) => {
    if (e) e.stopPropagation();
    
    const confirmed = await showDeleteConfirm(`"${plan.title}"`);
    if (!confirmed) return;

    try {
      const response = await subscriptionPlanService.deleteSubscriptionPlan(plan.id);
      if (response.success) {
        showSuccessToast('Subscription plan deleted successfully');
        fetchPlans();
      }
    } catch (err) {
      showErrorToast(err.response?.data?.message || 'Failed to delete subscription plan');
    }
  };

  const handleAddPlan = () => {
    navigate('/subscriptions/plans/new');
  };

  const buttons = ["Subscribers", "Subscription Plans"];

  
  const subscribersData = [];
  const currentUsers = selected === "Subscription Plans" ? plans : subscribersData;
  const isAllSelected = selectedIds.length === currentUsers.length && currentUsers.length > 0;

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentUsers.map((user) => user.id).filter(Boolean));
    }
  };

  const handleSelectOne = (id) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const totalItems = currentUsers.length;
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedUsers = currentUsers.slice(startIdx, endIdx);

  return (
    <div className="md:mt-5 mx-auto">
      <div className="bg-white inset-shadow-sm shadow-xl rounded-lg px-4 py-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-[#F3F4F6] p-4 gap-4">
          <h2 className="text-xl font-inter font-semibold text-gray-800">
            Subscription management
          </h2>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm flex-grow sm:flex-grow-0 sm:w-[250px]">
              <FiSearch className="text-gray-400 mr-2" size={16} />
              <input
                type="text"
                placeholder="Search"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (selected === "Subscription Plans") {
                    
                    setTimeout(() => fetchPlans(), 500);
                  }
                }}
                className="outline-none text-sm text-gray-700 placeholder-gray-400 bg-transparent w-full"
              />
              <span className="ml-2 bg-gray-100 text-gray-500 text-xs px-1.5 py-0.5 rounded">
                ⌘
              </span>
            </div>
            {selected === "Subscription Plans" && (
              <button
                onClick={handleAddPlan}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <FiPlus size={18} />
                Add Plan
              </button>
            )}
            <button className="flex items-center gap-2 border border-gray-200 bg-white px-3 py-2 rounded-lg shadow-sm text-sm text-gray-700">
              <MdFilterList className="w-[20px] h-[20px]" />
              <span className="whitespace-nowrap">Sort by</span>
            </button>
          </div>
        </div>

        <div className="px-4 py-3 border-b border-[#F3F4F6] flex gap-[16px] text-sm">
          {buttons.map((label) => (
            <button
              key={label}
              onClick={() => {
                setSelected(label);
                setSelectedIds([]);
                setCurrentPage(1);
                setSearchTerm("");
              }}
              className={`px-3 py-1 rounded ${
                selected === label
                  ? "bg-[#C6E4FF] text-black"
                  : "bg-white text-gray-700"
              } transition-colors duration-150`}
            >
              {label}
            </button>
          ))}
        </div>

        {selected === "Subscribers" && (
          <>
            <div className="overflow-x-auto shadow-lg rounded-xl mt-5">
              <table className="w-full text-sm text-left border-b border-gray-200">
                <thead className="bg-[#F9FAFB] text-[#475467] font-inter font-medium">
                  <tr>
                    <th className="pl-5 py-3">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={handleSelectAll}
                        className="w-4 h-4 rounded-md"
                      />
                    </th>
                    <th className="pl-5 py-3">User ID</th>
                    <th className="pl-5 py-3">Name</th>
                    <th className="pl-5 py-3">Organization</th>
                    <th className="pl-5 py-3">Plan Type</th>
                    <th className="pl-5 py-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length > 0 ? (
                    paginatedUsers.map((user) => (
                      <tr
                        key={user.id}
                        className="border-b border-[#EAECF0] hover:bg-gray-50 transition-colors h-[72px]"
                      >
                        <td className="p-6">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(user.id)}
                            onChange={() => handleSelectOne(user.id)}
                            className="w-4 h-4 rounded-md"
                          />
                        </td>
                        <td className="p-6">{user.id}</td>
                        <td className="p-6">{user.name}</td>
                        <td className="p-6">{user.organization}</td>
                        <td className="p-6">{user.plan}</td>
                        <td className="p-6">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
                              user.status === "Active"
                                ? "bg-blue-100 text-blue-600"
                                : "bg-red-100 text-red-600"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr className="h-[72px]">
                      <td colSpan="8" className="text-center text-gray-500 py-6">
                        No subscribers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {totalItems > itemsPerPage && (
              <div className="py-2.5 gap-3 flex justify-center">
                <Pagination
                  page={currentPage}
                  setPage={setCurrentPage}
                  perPage={itemsPerPage}
                  setPerPage={setItemsPerPage}
                  totalItems={totalItems}
                  fullWidth={true}
                />
              </div>
            )}
          </>
        )}

        {selected === "Subscription Plans" && (
          <div className="py-5">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : plans.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 mb-4">No subscription plans found</p>
                <button
                  onClick={handleAddPlan}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Add First Plan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start">
                {plans.map((plan, index) => (
                  <div
                    key={plan.id}
                    className="border border-gray-200 rounded-lg shadow-sm flex flex-col justify-between"
                  >
                    <div className="p-4">
                      <h4 className="text-lg font-semibold text-gray-800">
                        {plan.title}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        {plan.description || 'No description'}
                      </p>
                      <p className="text-sm font-medium text-[#0A090B] mt-4">
                        {plan.aircraft}
                      </p>
                      <div className="flex items-center mt-2">
                        <span className="text-lg font-semibold text-[#4F4D55]">
                          ${parseFloat(plan.price).toFixed(2)}
                        </span>
                        <button
                          onClick={() => togglePlan(index)}
                          className="ml-auto flex items-center gap-1 text-sm text-blue-600 font-medium"
                        >
                          {expandedPlans.includes(index) ? (
                            <>
                              Details <FiChevronUp />
                            </>
                          ) : (
                            <>
                              Details <FiChevronDown />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {expandedPlans.includes(index) && (
                      <div className="border-t border-[#E6E6E6] p-4 animate-fadeIn">
                        <div className="flex items-center gap-2 pb-4 text-sm text-gray-600">
                          <span className="text-lg">
                            <CgAdd className="inline-block text-[#000000]" />
                            <span className="text-sm font-inter text-[#0A090B] pl-1">
                              One-time Setup Fee <br />
                              <span className="text-xs font-inter text-gray-500 pl-6">
                                {plan.para || 'N/A'}
                                <span className="font-semibold font-inter text-[#000000]">
                                  ${parseFloat(plan.setup_fee || 0).toFixed(2)}
                                </span>
                              </span>
                            </span>
                          </span>
                        </div>
                        <div className="flex gap-3 px-4">
                          <Link
                            to={`/subscriptions/plans/${plan.id}`}
                            state={{ plan }}
                            className="px-5 py-2 bg-[#F6F6F6] rounded-lg text-sm text-[#505050] font-medium hover:bg-gray-100 transition"
                          >
                            Edit Plan
                          </Link>
                          <button
                            onClick={(e) => handleDelete(plan, e)}
                            className="px-5 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition"
                          >
                            Delete Plan
                          </button>
                        </div>
                      </div>
                    )}
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

export default Subscription;
