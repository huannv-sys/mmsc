import { MikrotikService } from "./mikrotik";

export interface RuleResult {
  success: boolean;
  data?: any;
  message: string;
}

export class RulesService {
  constructor(private mikrotikService: MikrotikService) {}

  /**
   * Lấy danh sách Firewall Filter rules từ thiết bị MikroTik
   */
  async getFirewallRules(deviceId: number): Promise<RuleResult> {
    try {
      console.log(`Đang lấy firewall rules cho thiết bị ${deviceId}...`);

      const client = await this.mikrotikService.getClientForDevice(deviceId);

      if (!client) {
        return {
          success: false,
          message: "Không thể kết nối đến thiết bị MikroTik",
        };
      }

      // Lấy firewall filter rules
      const firewallRules = await client.executeCommand(
        "/ip/firewall/filter/print",
      );

      return {
        success: true,
        data: firewallRules,
        message: "Lấy firewall rules thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy firewall rules:", error);
      return {
        success: false,
        message: `Lỗi khi lấy firewall rules: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Lấy danh sách NAT rules từ thiết bị MikroTik
   */
  async getNatRules(deviceId: number): Promise<RuleResult> {
    try {
      console.log(`Đang lấy NAT rules cho thiết bị ${deviceId}...`);

      const client = await this.mikrotikService.getClientForDevice(deviceId);

      if (!client) {
        return {
          success: false,
          message: "Không thể kết nối đến thiết bị MikroTik",
        };
      }

      // Lấy NAT rules
      const natRules = await client.executeCommand("/ip/firewall/nat/print");

      return {
        success: true,
        data: natRules,
        message: "Lấy NAT rules thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy NAT rules:", error);
      return {
        success: false,
        message: `Lỗi khi lấy NAT rules: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Lấy danh sách Mangle rules từ thiết bị MikroTik
   */
  async getMangleRules(deviceId: number): Promise<RuleResult> {
    try {
      console.log(`Đang lấy mangle rules cho thiết bị ${deviceId}...`);

      const client = await this.mikrotikService.getClientForDevice(deviceId);

      if (!client) {
        return {
          success: false,
          message: "Không thể kết nối đến thiết bị MikroTik",
        };
      }

      // Lấy mangle rules
      const mangleRules = await client.executeCommand(
        "/ip/firewall/mangle/print",
      );

      return {
        success: true,
        data: mangleRules,
        message: "Lấy mangle rules thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy mangle rules:", error);
      return {
        success: false,
        message: `Lỗi khi lấy mangle rules: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Lấy danh sách Queue rules từ thiết bị MikroTik
   */
  async getQueueRules(deviceId: number): Promise<RuleResult> {
    try {
      console.log(`Đang lấy queue rules cho thiết bị ${deviceId}...`);

      const client = await this.mikrotikService.getClientForDevice(deviceId);

      if (!client) {
        return {
          success: false,
          message: "Không thể kết nối đến thiết bị MikroTik",
        };
      }

      // Lấy simple queue rules
      const simpleQueueRules = await client.executeCommand(
        "/queue/simple/print",
      );

      // Lấy queue tree rules
      const treeQueueRules = await client.executeCommand("/queue/tree/print");

      return {
        success: true,
        data: {
          simpleQueues: simpleQueueRules || [],
          treeQueues: treeQueueRules || [],
        },
        message: "Lấy queue rules thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy queue rules:", error);
      return {
        success: false,
        message: `Lỗi khi lấy queue rules: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Lấy danh sách Routing rules từ thiết bị MikroTik
   */
  async getRoutingRules(deviceId: number): Promise<RuleResult> {
    try {
      console.log(`Đang lấy routing rules cho thiết bị ${deviceId}...`);

      const client = await this.mikrotikService.getClientForDevice(deviceId);

      if (!client) {
        return {
          success: false,
          message: "Không thể kết nối đến thiết bị MikroTik",
        };
      }

      // Lấy route rules
      const routeRules = await client.executeCommand("/ip/route/print");

      // Lấy BGP rules
      let bgpRules = [];
      try {
        bgpRules = await client.executeCommand("/routing/bgp/instance/print");
      } catch (err) {
        console.log("BGP không được hỗ trợ hoặc không được cấu hình");
      }

      // Lấy OSPF rules
      let ospfRules = [];
      try {
        ospfRules = await client.executeCommand("/routing/ospf/instance/print");
      } catch (err) {
        console.log("OSPF không được hỗ trợ hoặc không được cấu hình");
      }

      return {
        success: true,
        data: {
          routes: routeRules || [],
          bgp: bgpRules || [],
          ospf: ospfRules || [],
        },
        message: "Lấy routing rules thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy routing rules:", error);
      return {
        success: false,
        message: `Lỗi khi lấy routing rules: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  /**
   * Lấy tất cả rules từ thiết bị MikroTik
   */
  async getAllRules(deviceId: number): Promise<RuleResult> {
    try {
      console.log(`Đang lấy tất cả rules cho thiết bị ${deviceId}...`);

      // Lấy các loại rules
      const [
        firewallResult,
        natResult,
        mangleResult,
        queueResult,
        routingResult,
      ] = await Promise.all([
        this.getFirewallRules(deviceId),
        this.getNatRules(deviceId),
        this.getMangleRules(deviceId),
        this.getQueueRules(deviceId),
        this.getRoutingRules(deviceId),
      ]);

      if (
        !firewallResult.success ||
        !natResult.success ||
        !mangleResult.success ||
        !queueResult.success ||
        !routingResult.success
      ) {
        return {
          success: false,
          message: "Lỗi khi lấy một số loại rules",
        };
      }

      return {
        success: true,
        data: {
          firewall: firewallResult.data || [],
          nat: natResult.data || [],
          mangle: mangleResult.data || [],
          queues: queueResult.data || { simpleQueues: [], treeQueues: [] },
          routing: routingResult.data || { routes: [], bgp: [], ospf: [] },
        },
        message: "Lấy tất cả rules thành công",
      };
    } catch (error) {
      console.error("Lỗi khi lấy tất cả rules:", error);
      return {
        success: false,
        message: `Lỗi khi lấy tất cả rules: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}

// Khởi tạo dịch vụ với dependency injection
import { mikrotikService } from "./mikrotik";
export const rulesService = new RulesService(mikrotikService);
