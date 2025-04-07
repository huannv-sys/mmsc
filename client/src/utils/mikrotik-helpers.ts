/**
 * Hàm kiểm tra trạng thái disabled từ dữ liệu MikroTik
 * @param value Giá trị cần kiểm tra
 * @returns True nếu đối tượng bị vô hiệu hóa
 */
export function isDisabled(value: any): boolean {
  if (typeof value === 'string') {
    return value === 'true';
  }
  return Boolean(value);
}