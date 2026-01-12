// src/utils/toast.js
import { toast } from "react-toastify";

const defaultOpts = {
  position: "top-right",
  autoClose: 3000,
  pauseOnHover: true,
  closeOnClick: true,
  draggable: true,
};

export const notify = {
  success: (msg, opts = {}) => toast.success(msg, { ...defaultOpts, ...opts }),
  error: (msg, opts = {}) => toast.error(msg, { ...defaultOpts, autoClose: 5000, ...opts }),
  warn: (msg, opts = {}) => toast.warn(msg, { ...defaultOpts, ...opts }),
  info: (msg, opts = {}) => toast.info(msg, { ...defaultOpts, ...opts }),
  custom: (msg, opts = {}) => toast(msg, { ...defaultOpts, ...opts }),
};

export default notify;