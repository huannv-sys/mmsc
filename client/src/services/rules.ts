import axios from "axios";

const api = axios.create({
  baseURL: "/",
  headers: {
    "Content-Type": "application/json",
  },
});

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
}

export async function getAllRules(deviceId: string): Promise<ApiResponse> {
  try {
    const response = await api.get(`/api/devices/${deviceId}/rules`);
    return response.data;
  } catch (error) {
    console.error("Error fetching all rules:", error);
    return {
      success: false,
      message: "Không thể lấy thông tin quy tắc. Vui lòng thử lại sau.",
    };
  }
}

export async function getFirewallRules(deviceId: string): Promise<ApiResponse> {
  try {
    const response = await api.get(`/api/devices/${deviceId}/rules/firewall`);
    return response.data;
  } catch (error) {
    console.error("Error fetching firewall rules:", error);
    return {
      success: false,
      message:
        "Không thể lấy thông tin quy tắc firewall. Vui lòng thử lại sau.",
    };
  }
}

export async function getNatRules(deviceId: string): Promise<ApiResponse> {
  try {
    const response = await api.get(`/api/devices/${deviceId}/rules/nat`);
    return response.data;
  } catch (error) {
    console.error("Error fetching NAT rules:", error);
    return {
      success: false,
      message: "Không thể lấy thông tin quy tắc NAT. Vui lòng thử lại sau.",
    };
  }
}

export async function getMangleRules(deviceId: string): Promise<ApiResponse> {
  try {
    const response = await api.get(`/api/devices/${deviceId}/rules/mangle`);
    return response.data;
  } catch (error) {
    console.error("Error fetching mangle rules:", error);
    return {
      success: false,
      message: "Không thể lấy thông tin quy tắc mangle. Vui lòng thử lại sau.",
    };
  }
}

export async function getQueueRules(deviceId: string): Promise<ApiResponse> {
  try {
    const response = await api.get(`/api/devices/${deviceId}/rules/queue`);
    return response.data;
  } catch (error) {
    console.error("Error fetching queue rules:", error);
    return {
      success: false,
      message: "Không thể lấy thông tin quy tắc queue. Vui lòng thử lại sau.",
    };
  }
}

export async function getRoutingRules(deviceId: string): Promise<ApiResponse> {
  try {
    const response = await api.get(`/api/devices/${deviceId}/rules/routing`);
    return response.data;
  } catch (error) {
    console.error("Error fetching routing rules:", error);
    return {
      success: false,
      message: "Không thể lấy thông tin quy tắc routing. Vui lòng thử lại sau.",
    };
  }
}

// Thêm các hàm cập nhật, xóa, tạo mới quy tắc nếu cần
export async function createFirewallRule(
  deviceId: string,
  ruleData: any,
): Promise<ApiResponse> {
  try {
    const response = await api.post(
      `/api/devices/${deviceId}/rules/firewall`,
      ruleData,
    );
    return response.data;
  } catch (error) {
    console.error("Error creating firewall rule:", error);
    return {
      success: false,
      message: "Không thể tạo quy tắc firewall. Vui lòng thử lại sau.",
    };
  }
}

export async function updateRule(
  deviceId: string,
  ruleType: string,
  ruleId: string,
  ruleData: any,
): Promise<ApiResponse> {
  try {
    const response = await api.put(
      `/api/devices/${deviceId}/rules/${ruleType}/${ruleId}`,
      ruleData,
    );
    return response.data;
  } catch (error) {
    console.error(`Error updating ${ruleType} rule:`, error);
    return {
      success: false,
      message: `Không thể cập nhật quy tắc ${ruleType}. Vui lòng thử lại sau.`,
    };
  }
}

export async function deleteRule(
  deviceId: string,
  ruleType: string,
  ruleId: string,
): Promise<ApiResponse> {
  try {
    const response = await api.delete(
      `/api/devices/${deviceId}/rules/${ruleType}/${ruleId}`,
    );
    return response.data;
  } catch (error) {
    console.error(`Error deleting ${ruleType} rule:`, error);
    return {
      success: false,
      message: `Không thể xóa quy tắc ${ruleType}. Vui lòng thử lại sau.`,
    };
  }
}

export async function toggleRuleStatus(
  deviceId: string,
  ruleType: string,
  ruleId: string,
  disabled: boolean,
): Promise<ApiResponse> {
  try {
    const response = await api.put(
      `/api/devices/${deviceId}/rules/${ruleType}/${ruleId}/toggle`,
      { disabled },
    );
    return response.data;
  } catch (error) {
    console.error(`Error toggling ${ruleType} rule status:`, error);
    return {
      success: false,
      message: `Không thể thay đổi trạng thái quy tắc ${ruleType}. Vui lòng thử lại sau.`,
    };
  }
}
