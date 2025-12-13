import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

/**
 * Reusable notification utilities for consistent UX
 */

// SweetAlert Confirmations
export const showConfirmDialog = async (
  title = 'Are you sure?',
  text = 'This action cannot be undone',
  confirmButtonText = 'Yes, delete it!'
) => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#3085d6',
    cancelButtonColor: '#d33',
    confirmButtonText,
    cancelButtonText: 'Cancel',
  });
  
  return result.isConfirmed;
};

export const showDeleteConfirm = async (itemName = 'this item') => {
  return await showConfirmDialog(
    'Delete Confirmation',
    `Are you sure you want to delete ${itemName}?`,
    'Yes, delete it!'
  );
};

export const showBlockUserConfirm = async (userName) => {
  return await showConfirmDialog(
    'Block User',
    `Are you sure you want to block ${userName}? They won't be able to access the system.`,
    'Yes, block user'
  );
};

// Success Alerts
export const showSuccessAlert = (title = 'Success!', text = 'Operation completed successfully') => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    confirmButtonColor: '#3085d6',
  });
};

// Error Alerts
export const showErrorAlert = (title = 'Error!', text = 'Something went wrong') => {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    confirmButtonColor: '#d33',
  });
};

// Toast Notifications (less intrusive)
export const showSuccessToast = (message = 'Success!') => {
  toast.success(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

export const showErrorToast = (message = 'Error occurred!') => {
  toast.error(message, {
    position: 'top-right',
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

export const showInfoToast = (message) => {
  toast.info(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

export const showWarningToast = (message) => {
  toast.warning(message, {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
  });
};

// Loading Toast
export const showLoadingToast = (message = 'Loading...') => {
  return toast.loading(message);
};

export const dismissToast = (toastId) => {
  toast.dismiss(toastId);
};

export const updateToast = (toastId, message, type = 'success') => {
  toast.update(toastId, {
    render: message,
    type,
    isLoading: false,
    autoClose: 3000,
  });
};

