/**
 * Hàm gọi API có xác thực
 * @param url Đường dẫn API
 * @param options Các options bổ sung cho fetch API
 * @returns Promise với kết quả fetch
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  // Thiết lập headers mặc định
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Gọi API với options đã thiết lập
  return fetch(url, {
    ...options,
    headers,
  });
}
