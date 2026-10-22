/** Địa chỉ API viết văn. Để trống = cùng origin (server/ phục vụ cả web lẫn API); đặt VITE_API_BASE khi web nằm ở host tĩnh. */
export const API_BASE: string = (import.meta.env.VITE_API_BASE as string | undefined) ?? "";
