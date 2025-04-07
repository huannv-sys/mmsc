import { RouterOSAPI } from 'node-routeros';
import { mikrotikService } from './mikrotik';

/**
 * Kiểm tra xem lỗi có phải là lỗi kết nối RouterOS đã đóng hay không
 * @param error Lỗi cần kiểm tra
 * @returns true nếu lỗi liên quan đến kết nối đã đóng, false nếu không
 */
function isConnectionError(error: any): boolean {
  if (!error) return false;
  const errorMsg = error.toString();
  return (
    errorMsg.includes('Cannot read properties of null (reading \'read\')') ||
    errorMsg.includes('Connection closed') ||
    errorMsg.includes('Socket closed') ||
    errorMsg.includes('Connection timed out') ||
    errorMsg.includes('Cannot read property') ||
    errorMsg.includes('ECONNRESET') ||
    errorMsg.includes('ETIMEDOUT')
  );
}

/**
 * Đối tượng chứa các hàm xử lý liên quan đến quản lý rules trên thiết bị MikroTik
 */
export const mikrotikRulesService = {
  /**
   * Lấy danh sách firewall rules (phương thức tương thích với deviceId)
   * @param deviceId ID thiết bị cần lấy rules
   * @returns Danh sách firewall rules
   */
  async getFirewallRulesByDeviceId(deviceId: number): Promise<any[]> {
    try {
      const client = await mikrotikService.getClientForDevice(deviceId);
      if (!client) {
        console.error(`Không thể kết nối tới thiết bị ID ${deviceId}`);
        return [];
      }
      return this.getFirewallRules(client);
    } catch (error) {
      console.error('Error getting firewall rules by device ID:', error);
      return [];
    }
  },
  
  /**
   * Lấy danh sách NAT rules (phương thức tương thích với deviceId)
   * @param deviceId ID thiết bị cần lấy rules
   * @returns Danh sách NAT rules
   */
  async getNatRulesByDeviceId(deviceId: number): Promise<any[]> {
    try {
      const client = await mikrotikService.getClientForDevice(deviceId);
      if (!client) {
        console.error(`Không thể kết nối tới thiết bị ID ${deviceId}`);
        return [];
      }
      return this.getNatRules(client);
    } catch (error) {
      console.error('Error getting NAT rules by device ID:', error);
      return [];
    }
  },
  
  /**
   * Lấy danh sách mangle rules (phương thức tương thích với deviceId)
   * @param deviceId ID thiết bị cần lấy rules
   * @returns Danh sách mangle rules
   */
  async getMangleRulesByDeviceId(deviceId: number): Promise<any[]> {
    try {
      const client = await mikrotikService.getClientForDevice(deviceId);
      if (!client) {
        console.error(`Không thể kết nối tới thiết bị ID ${deviceId}`);
        return [];
      }
      return this.getMangleRules(client);
    } catch (error) {
      console.error('Error getting mangle rules by device ID:', error);
      return [];
    }
  },
  
  /**
   * Lấy danh sách queue rules (phương thức tương thích với deviceId)
   * @param deviceId ID thiết bị cần lấy rules
   * @returns Danh sách queue rules
   */
  async getQueueRulesByDeviceId(deviceId: number): Promise<{ simpleQueues: any[], treeQueues: any[] }> {
    try {
      const client = await mikrotikService.getClientForDevice(deviceId);
      if (!client) {
        console.error(`Không thể kết nối tới thiết bị ID ${deviceId}`);
        return { simpleQueues: [], treeQueues: [] };
      }
      return this.getQueueRules(client);
    } catch (error) {
      console.error('Error getting queue rules by device ID:', error);
      return { simpleQueues: [], treeQueues: [] };
    }
  },
  
  /**
   * Lấy danh sách routing rules (phương thức tương thích với deviceId)
   * @param deviceId ID thiết bị cần lấy rules
   * @returns Danh sách routing rules
   */
  async getRoutingRulesByDeviceId(deviceId: number): Promise<{ routes: any[], bgp: any[], ospf: any[] }> {
    try {
      const client = await mikrotikService.getClientForDevice(deviceId);
      if (!client) {
        console.error(`Không thể kết nối tới thiết bị ID ${deviceId}`);
        return { routes: [], bgp: [], ospf: [] };
      }
      return this.getRoutingRules(client);
    } catch (error) {
      console.error('Error getting routing rules by device ID:', error);
      return { routes: [], bgp: [], ospf: [] };
    }
  },
  /**
   * Lấy danh sách firewall rules
   * @param api Đối tượng API đã kết nối
   * @returns Danh sách firewall rules
   */
  async getFirewallRules(api: RouterOSAPI | null): Promise<any[]> {
    if (!api) {
      throw new Error('API connection is null');
    }
    
    try {
      const firewallRules = await api.write('/ip/firewall/filter/print');
      return firewallRules;
    } catch (error) {
      console.error('Error getting firewall rules:', error);
      
      // Khi gặp lỗi kết nối, trả về mảng rỗng để tránh crash ứng dụng
      if (isConnectionError(error)) {
        return [];
      }
      
      throw error;
    }
  },

  /**
   * Lấy danh sách NAT rules
   * @param api Đối tượng API đã kết nối
   * @returns Danh sách NAT rules
   */
  async getNatRules(api: RouterOSAPI | null): Promise<any[]> {
    if (!api) {
      throw new Error('API connection is null');
    }
    
    try {
      const natRules = await api.write('/ip/firewall/nat/print');
      return natRules;
    } catch (error) {
      console.error('Error getting NAT rules:', error);
      
      // Khi gặp lỗi kết nối, trả về mảng rỗng để tránh crash ứng dụng
      if (isConnectionError(error)) {
        return [];
      }
      
      throw error;
    }
  },

  /**
   * Lấy danh sách mangle rules
   * @param api Đối tượng API đã kết nối
   * @returns Danh sách mangle rules
   */
  async getMangleRules(api: RouterOSAPI | null): Promise<any[]> {
    if (!api) {
      throw new Error('API connection is null');
    }
    
    try {
      const mangleRules = await api.write('/ip/firewall/mangle/print');
      return mangleRules;
    } catch (error) {
      console.error('Error getting mangle rules:', error);
      
      // Khi gặp lỗi kết nối, trả về mảng rỗng để tránh crash ứng dụng
      if (isConnectionError(error)) {
        return [];
      }
      
      throw error;
    }
  },

  /**
   * Lấy thông tin về queue rules
   * @param api Đối tượng API đã kết nối
   * @returns Đối tượng chứa các queue rules
   */
  async getQueueRules(api: RouterOSAPI | null): Promise<{ simpleQueues: any[], treeQueues: any[] }> {
    if (!api) {
      throw new Error('API connection is null');
    }
    
    try {
      const [simpleQueues, treeQueues] = await Promise.all([
        api.write('/queue/simple/print'),
        api.write('/queue/tree/print')
      ]);
      
      return {
        simpleQueues,
        treeQueues
      };
    } catch (error) {
      console.error('Error getting queue rules:', error);
      
      // Khi gặp lỗi kết nối, trả về mảng rỗng để tránh crash ứng dụng
      if (isConnectionError(error)) {
        return {
          simpleQueues: [],
          treeQueues: []
        };
      }
      
      throw error;
    }
  },

  /**
   * Lấy thông tin về routing rules
   * @param api Đối tượng API đã kết nối
   * @returns Đối tượng chứa các loại routing rules
   */
  async getRoutingRules(api: RouterOSAPI | null): Promise<{ routes: any[], bgp: any[], ospf: any[] }> {
    if (!api) {
      throw new Error('API connection is null');
    }
    
    try {
      const [routes, bgp, ospf] = await Promise.all([
        api.write('/ip/route/print'),
        api.write('/routing/bgp/instance/print'),
        api.write('/routing/ospf/instance/print')
      ]);
      
      return {
        routes,
        bgp,
        ospf
      };
    } catch (error) {
      console.error('Error getting routing rules:', error);
      
      // Khi gặp lỗi kết nối, trả về mảng rỗng để tránh crash ứng dụng
      if (isConnectionError(error)) {
        return {
          routes: [],
          bgp: [],
          ospf: []
        };
      }
      
      throw error;
    }
  },

  /**
   * Tạo mới firewall rule
   * @param api Đối tượng API đã kết nối
   * @param ruleData Dữ liệu rule mới
   * @returns Rule đã tạo
   */
  /**
   * Tạo mới firewall rule sử dụng deviceId
   * @param deviceId ID của thiết bị
   * @param ruleData Dữ liệu rule mới
   * @returns Rule đã tạo
   */
  async createFirewallRuleByDeviceId(deviceId: number, ruleData: any): Promise<any> {
    try {
      const client = await mikrotikService.getClientForDevice(deviceId);
      if (!client) {
        console.error(`Không thể kết nối tới thiết bị ID ${deviceId}`);
        return {};
      }
      return this.createFirewallRule(client, ruleData);
    } catch (error) {
      console.error('Error creating firewall rule by device ID:', error);
      return {};
    }
  },
  
  async createFirewallRule(api: RouterOSAPI | null, ruleData: any): Promise<any> {
    if (!api) {
      throw new Error('API connection is null');
    }
    
    try {
      const newRule = await api.write('/ip/firewall/filter/add', ruleData);
      return newRule;
    } catch (error) {
      console.error('Error creating firewall rule:', error);
      
      // Khi gặp lỗi kết nối, trả về đối tượng rỗng để tránh crash ứng dụng
      if (isConnectionError(error)) {
        return {};
      }
      
      throw error;
    }
  },

  /**
   * Cập nhật trạng thái firewall rule (bật/tắt)
   * @param api Đối tượng API đã kết nối
   * @param ruleId ID của rule
   * @param disabled Trạng thái kích hoạt (true: vô hiệu hóa, false: kích hoạt)
   * @returns Kết quả cập nhật
   */
  /**
   * Cập nhật trạng thái firewall rule (bật/tắt) sử dụng deviceId
   * @param deviceId ID của thiết bị
   * @param ruleId ID của rule
   * @param disabled Trạng thái kích hoạt (true: vô hiệu hóa, false: kích hoạt)
   * @returns Kết quả cập nhật
   */
  async toggleFirewallRuleByDeviceId(deviceId: number, ruleId: string, disabled: boolean): Promise<any> {
    try {
      const client = await mikrotikService.getClientForDevice(deviceId);
      if (!client) {
        console.error(`Không thể kết nối tới thiết bị ID ${deviceId}`);
        return {};
      }
      return this.toggleFirewallRule(client, ruleId, disabled);
    } catch (error) {
      console.error('Error toggling firewall rule by device ID:', error);
      return {};
    }
  },
  
  /**
   * Cập nhật trạng thái NAT rule (bật/tắt) sử dụng deviceId
   * @param deviceId ID của thiết bị
   * @param ruleId ID của rule
   * @param disabled Trạng thái kích hoạt (true: vô hiệu hóa, false: kích hoạt)
   * @returns Kết quả cập nhật
   */
  async toggleNatRuleByDeviceId(deviceId: number, ruleId: string, disabled: boolean): Promise<any> {
    try {
      const client = await mikrotikService.getClientForDevice(deviceId);
      if (!client) {
        console.error(`Không thể kết nối tới thiết bị ID ${deviceId}`);
        return {};
      }
      return this.toggleNatRule(client, ruleId, disabled);
    } catch (error) {
      console.error('Error toggling NAT rule by device ID:', error);
      return {};
    }
  },
  
  /**
   * Cập nhật trạng thái mangle rule (bật/tắt) sử dụng deviceId
   * @param deviceId ID của thiết bị
   * @param ruleId ID của rule
   * @param disabled Trạng thái kích hoạt (true: vô hiệu hóa, false: kích hoạt)
   * @returns Kết quả cập nhật
   */
  async toggleMangleRuleByDeviceId(deviceId: number, ruleId: string, disabled: boolean): Promise<any> {
    try {
      const client = await mikrotikService.getClientForDevice(deviceId);
      if (!client) {
        console.error(`Không thể kết nối tới thiết bị ID ${deviceId}`);
        return {};
      }
      return this.toggleMangleRule(client, ruleId, disabled);
    } catch (error) {
      console.error('Error toggling mangle rule by device ID:', error);
      return {};
    }
  },
  
  /**
   * Cập nhật trạng thái queue rule (bật/tắt) sử dụng deviceId
   * @param deviceId ID của thiết bị
   * @param ruleId ID của rule
   * @param disabled Trạng thái kích hoạt (true: vô hiệu hóa, false: kích hoạt)
   * @returns Kết quả cập nhật
   */
  async toggleQueueRuleByDeviceId(deviceId: number, ruleId: string, disabled: boolean): Promise<any> {
    try {
      const client = await mikrotikService.getClientForDevice(deviceId);
      if (!client) {
        console.error(`Không thể kết nối tới thiết bị ID ${deviceId}`);
        return {};
      }
      return this.toggleQueueRule(client, ruleId, disabled);
    } catch (error) {
      console.error('Error toggling queue rule by device ID:', error);
      return {};
    }
  },
  
  /**
   * Cập nhật trạng thái routing rule (bật/tắt) sử dụng deviceId
   * @param deviceId ID của thiết bị
   * @param ruleId ID của rule
   * @param disabled Trạng thái kích hoạt (true: vô hiệu hóa, false: kích hoạt)
   * @returns Kết quả cập nhật
   */
  async toggleRoutingRuleByDeviceId(deviceId: number, ruleId: string, disabled: boolean): Promise<any> {
    try {
      const client = await mikrotikService.getClientForDevice(deviceId);
      if (!client) {
        console.error(`Không thể kết nối tới thiết bị ID ${deviceId}`);
        return {};
      }
      return this.toggleRoutingRule(client, ruleId, disabled);
    } catch (error) {
      console.error('Error toggling routing rule by device ID:', error);
      return {};
    }
  },
  
  async toggleFirewallRule(api: RouterOSAPI | null, ruleId: string, disabled: boolean): Promise<any> {
    if (!api) {
      throw new Error('API connection is null');
    }
    
    try {
      // Sử dụng lệnh enable hoặc disable tùy theo trạng thái
      let command = disabled ? '/ip/firewall/filter/disable' : '/ip/firewall/filter/enable';
      const result = await api.write(command, [
        '=.id=' + ruleId
      ]);
      return result;
    } catch (error) {
      console.error('Error toggling firewall rule:', error);
      
      // Khi gặp lỗi kết nối, trả về đối tượng rỗng để tránh crash ứng dụng
      if (isConnectionError(error)) {
        return {};
      }
      
      throw error;
    }
  },

  /**
   * Cập nhật trạng thái NAT rule (bật/tắt)
   * @param api Đối tượng API đã kết nối
   * @param ruleId ID của rule
   * @param disabled Trạng thái kích hoạt (true: vô hiệu hóa, false: kích hoạt)
   * @returns Kết quả cập nhật
   */
  async toggleNatRule(api: RouterOSAPI | null, ruleId: string, disabled: boolean): Promise<any> {
    if (!api) {
      throw new Error('API connection is null');
    }
    
    try {
      // Sử dụng lệnh enable hoặc disable tùy theo trạng thái
      let command = disabled ? '/ip/firewall/nat/disable' : '/ip/firewall/nat/enable';
      const result = await api.write(command, [
        '=.id=' + ruleId
      ]);
      return result;
    } catch (error) {
      console.error('Error toggling NAT rule:', error);
      
      // Khi gặp lỗi kết nối, trả về đối tượng rỗng để tránh crash ứng dụng
      if (isConnectionError(error)) {
        return {};
      }
      
      throw error;
    }
  },

  /**
   * Cập nhật trạng thái mangle rule (bật/tắt)
   * @param api Đối tượng API đã kết nối
   * @param ruleId ID của rule
   * @param disabled Trạng thái kích hoạt (true: vô hiệu hóa, false: kích hoạt)
   * @returns Kết quả cập nhật
   */
  async toggleMangleRule(api: RouterOSAPI | null, ruleId: string, disabled: boolean): Promise<any> {
    if (!api) {
      throw new Error('API connection is null');
    }
    
    try {
      // Sử dụng lệnh enable hoặc disable tùy theo trạng thái
      let command = disabled ? '/ip/firewall/mangle/disable' : '/ip/firewall/mangle/enable';
      const result = await api.write(command, [
        '=.id=' + ruleId
      ]);
      return result;
    } catch (error) {
      console.error('Error toggling mangle rule:', error);
      
      // Khi gặp lỗi kết nối, trả về đối tượng rỗng để tránh crash ứng dụng
      if (isConnectionError(error)) {
        return {};
      }
      
      throw error;
    }
  },

  /**
   * Cập nhật trạng thái queue rule (bật/tắt)
   * @param api Đối tượng API đã kết nối
   * @param ruleId ID của rule
   * @param disabled Trạng thái kích hoạt (true: vô hiệu hóa, false: kích hoạt)
   * @returns Kết quả cập nhật
   */
  async toggleQueueRule(api: RouterOSAPI | null, ruleId: string, disabled: boolean): Promise<any> {
    if (!api) {
      throw new Error('API connection is null');
    }
    
    try {
      // Sử dụng lệnh enable hoặc disable tùy theo trạng thái
      // Kiểm tra xem là simple queue hay tree queue
      // Giả sử đây là simple queue
      let command = disabled ? '/queue/simple/disable' : '/queue/simple/enable';
      const result = await api.write(command, [
        '=.id=' + ruleId
      ]);
      return result;
    } catch (error) {
      console.error('Error toggling queue rule:', error);
      
      // Khi gặp lỗi kết nối, trả về đối tượng rỗng để tránh crash ứng dụng
      if (isConnectionError(error)) {
        return {};
      }
      
      throw error;
    }
  },

  /**
   * Cập nhật trạng thái routing rule (bật/tắt)
   * @param api Đối tượng API đã kết nối
   * @param ruleId ID của rule
   * @param disabled Trạng thái kích hoạt (true: vô hiệu hóa, false: kích hoạt)
   * @returns Kết quả cập nhật
   */
  async toggleRoutingRule(api: RouterOSAPI | null, ruleId: string, disabled: boolean): Promise<any> {
    if (!api) {
      throw new Error('API connection is null');
    }
    
    try {
      // Sử dụng lệnh enable hoặc disable tùy theo trạng thái
      // Giả sử đây là static route
      let command = disabled ? '/ip/route/disable' : '/ip/route/enable';
      const result = await api.write(command, [
        '=.id=' + ruleId
      ]);
      return result;
    } catch (error) {
      console.error('Error toggling routing rule:', error);
      
      // Khi gặp lỗi kết nối, trả về đối tượng rỗng để tránh crash ứng dụng
      if (isConnectionError(error)) {
        return {};
      }
      
      throw error;
    }
  }
};