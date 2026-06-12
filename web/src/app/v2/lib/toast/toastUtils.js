/**
 * Toast update config objects for react-toastify.
 * v2-native — no imports from old UiComponents.
 */

export function Success(message) {
  return {
    render: message,
    type: "success",
    isLoading: false,
    autoClose: 3000,
  };
}

export function Failed(error) {
  return {
    render: error,
    type: "error",
    isLoading: false,
    autoClose: 3000,
  };
}
