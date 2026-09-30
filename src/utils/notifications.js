// utils/notifications.js
import Swal from 'sweetalert2';
import { toast } from 'react-toastify';

/* ------------------------------------------------------------------ */
/* Toast defaults                                                      */
/* ------------------------------------------------------------------ */

const TOAST_DEFAULTS = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

/**
 * Shared toast helper.
 * options is passed to react-toastify, so you can use:
 *   toastId   – stable id; a toast with the same id is not shown twice (dedupe)
 *   onClick   – e.g. navigate to the related reservation/message
 *   autoClose – override the default duration
 */
const show = (type, message, options = {}) =>
  toast[type](message, { ...TOAST_DEFAULTS, ...options });

export const showSuccessToast = (message = 'Success!', options) =>
  show('success', message, options);

export const showErrorToast = (message = 'Error occurred!', options) =>
  show('error', message, { autoClose: 4000, ...options });

export const showInfoToast = (message, options) => show('info', message, options);

export const showWarningToast = (message, options) => show('warning', message, options);

export const showLoadingToast = (message = 'Loading...', options) =>
  toast.loading(message, options);

export const dismissToast = (toastId) => toast.dismiss(toastId);

export const updateToast = (toastId, message, type = 'success') =>
  toast.update(toastId, {
    render: message,
    type,
    isLoading: false,
    autoClose: 3000,
    closeOnClick: true,
    draggable: true,
  });

/* ------------------------------------------------------------------ */
/* Dialogs (SweetAlert2)                                               */
/* ------------------------------------------------------------------ */

const COLORS = {
  primary: '#3085d6',
  danger: '#d33',
};

/**
 * Returns true if the user confirmed.
 * `danger` (default true) makes the confirm button red and the cancel button
 * neutral, which is the right way round for delete/block actions.
 * Pass { danger: false } for non-destructive confirmations.
 */
export const showConfirmDialog = async (
  title = 'Are you sure?',
  text = 'This action cannot be undone',
  confirmButtonText = 'Yes, delete it!',
  { danger = true } = {}
) => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: danger ? COLORS.danger : COLORS.primary,
    cancelButtonColor: danger ? '#6b7280' : COLORS.danger,
    confirmButtonText,
    cancelButtonText: 'Cancel',
    focusCancel: danger, // Enter key should not trigger a destructive action
  });

  return result.isConfirmed;
};

export const showDeleteConfirm = (itemName = 'this item') =>
  showConfirmDialog(
    'Delete confirmation',
    `Are you sure you want to delete ${itemName}?`,
    'Yes, delete it'
  );

export const showBlockUserConfirm = (userName) =>
  showConfirmDialog(
    'Block user',
    `Are you sure you want to block ${userName}? They won't be able to access the system.`,
    'Yes, block user'
  );

export const showSuccessAlert = (title = 'Success!', text = 'Operation completed successfully') =>
  Swal.fire({ title, text, icon: 'success', confirmButtonColor: COLORS.primary });

export const showErrorAlert = (title = 'Error!', text = 'Something went wrong') =>
  Swal.fire({ title, text, icon: 'error', confirmButtonColor: COLORS.danger });

