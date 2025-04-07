import { Router, Request, Response } from 'express';
import { mikrotikService } from '../services/mikrotik';
import { mikrotikRulesService } from '../services/mikrotik-rules';
import { db } from '../db';
import { devices } from '@shared/schema';
import { eq } from 'drizzle-orm';

export const rulesRouter = Router();

/**
 * Route để lấy tất cả các rules cho một thiết bị
 */
rulesRouter.get('/devices/:id/rules', async (req: Request, res: Response) => {
  try {
    const deviceId = Number(req.params.id);
    
    // Lấy thông tin thiết bị từ database
    const [device] = await db.select().from(devices).where(eq(devices.id, deviceId));
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy thiết bị với ID ${deviceId}`
      });
    }
    
    // Kết nối đến thiết bị MikroTik và lấy tất cả loại rules
    const connectionParams = {
      id: device.id,
      host: device.ipAddress,
      username: device.username,
      password: device.password
    };
    const api = await mikrotikService.connect(connectionParams);
    
    if (!api) {
      return res.status(500).json({
        success: false,
        message: `Không thể kết nối đến thiết bị với ID ${deviceId}`
      });
    }
    
    try {
      // Lấy thông tin từ các loại rules khác nhau
      const [firewallRules, natRules, mangleRules, queueData, routingData] = await Promise.all([
        mikrotikRulesService.getFirewallRules(api),
        mikrotikRulesService.getNatRules(api),
        mikrotikRulesService.getMangleRules(api),
        mikrotikRulesService.getQueueRules(api),
        mikrotikRulesService.getRoutingRules(api)
      ]);
      
      // Đóng kết nối API
      await api.close();
      
      // Trả về tất cả dữ liệu
      return res.json({
        success: true,
        data: {
          firewall: firewallRules,
          nat: natRules,
          mangle: mangleRules,
          queues: queueData,
          routing: routingData
        }
      });
    } catch (innerError) {
      // Đảm bảo đóng kết nối API trong trường hợp lỗi
      if (api) {
        try {
          await api.close();
        } catch (closeError) {
          console.error('Error closing API connection:', closeError);
        }
      }
      throw innerError; // Re-throw để catch bên ngoài xử lý
    }
  } catch (error) {
    console.error('Error fetching device rules:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi khi lấy rules: ${(error as Error).message || 'Unknown error'}`
    });
  }
});

/**
 * Route để lấy firewall rules cho một thiết bị
 */
rulesRouter.get('/devices/:id/rules/firewall', async (req: Request, res: Response) => {
  try {
    const deviceId = Number(req.params.id);
    
    // Lấy thông tin thiết bị từ database
    const [device] = await db.select().from(devices).where(eq(devices.id, deviceId));
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy thiết bị với ID ${deviceId}`
      });
    }
    
    // Kết nối đến thiết bị MikroTik và lấy firewall rules
    const connectionParams = {
      id: device.id,
      host: device.ipAddress,
      username: device.username,
      password: device.password
    };
    const api = await mikrotikService.connect(connectionParams);
    
    if (!api) {
      return res.status(500).json({
        success: false,
        message: `Không thể kết nối đến thiết bị với ID ${deviceId}`
      });
    }
    
    try {
      const firewallRules = await mikrotikRulesService.getFirewallRules(api);
      
      // Đóng kết nối API
      await api.close();
      
      return res.json({
        success: true,
        data: firewallRules
      });
    } catch (innerError) {
      // Đảm bảo đóng kết nối API trong trường hợp lỗi
      if (api) {
        try {
          await api.close();
        } catch (closeError) {
          console.error('Error closing API connection:', closeError);
        }
      }
      
      // Nếu lỗi kết nối, trả về mảng rỗng
      if (innerError && (innerError as Error).message && (innerError as Error).message.includes('Cannot read properties of null')) {
        console.log('Error getting firewall rules, returning empty array');
        return res.json({
          success: true,
          data: []
        });
      }
      
      throw innerError; // Re-throw để catch bên ngoài xử lý
    }
  } catch (error) {
    console.error('Error fetching firewall rules:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi khi lấy firewall rules: ${(error as Error).message || 'Unknown error'}`
    });
  }
});

/**
 * Route để lấy NAT rules cho một thiết bị
 */
rulesRouter.get('/devices/:id/rules/nat', async (req: Request, res: Response) => {
  try {
    const deviceId = Number(req.params.id);
    
    // Lấy thông tin thiết bị từ database
    const [device] = await db.select().from(devices).where(eq(devices.id, deviceId));
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy thiết bị với ID ${deviceId}`
      });
    }
    
    // Kết nối đến thiết bị MikroTik và lấy NAT rules
    const connectionParams = {
      id: device.id,
      host: device.ipAddress,
      username: device.username,
      password: device.password
    };
    const api = await mikrotikService.connect(connectionParams);
    
    if (!api) {
      return res.status(500).json({
        success: false,
        message: `Không thể kết nối đến thiết bị với ID ${deviceId}`
      });
    }
    
    try {
      const natRules = await mikrotikRulesService.getNatRules(api);
      
      // Đóng kết nối API
      await api.close();
      
      return res.json({
        success: true,
        data: natRules
      });
    } catch (error) {
      // Đảm bảo đóng kết nối API trong trường hợp lỗi
      if (api) {
        try {
          await api.close();
        } catch (closeError) {
          console.error('Error closing API connection:', closeError);
        }
      }
      
      // Nếu lỗi kết nối, trả về mảng rỗng
      if (error && (error as Error).message && (error as Error).message.includes('Cannot read properties of null')) {
        return res.json({
          success: true,
          data: []
        });
      }
      
      throw error; // Re-throw để catch bên ngoài xử lý
    }
  } catch (error) {
    console.error('Error fetching NAT rules:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi khi lấy NAT rules: ${(error as Error).message || 'Unknown error'}`
    });
  }
});

/**
 * Route để lấy mangle rules cho một thiết bị
 */
rulesRouter.get('/devices/:id/rules/mangle', async (req: Request, res: Response) => {
  try {
    const deviceId = Number(req.params.id);
    
    // Lấy thông tin thiết bị từ database
    const [device] = await db.select().from(devices).where(eq(devices.id, deviceId));
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy thiết bị với ID ${deviceId}`
      });
    }
    
    // Kết nối đến thiết bị MikroTik và lấy mangle rules
    const connectionParams = {
      id: device.id,
      host: device.ipAddress,
      username: device.username,
      password: device.password
    };
    const api = await mikrotikService.connect(connectionParams);
    
    if (!api) {
      return res.status(500).json({
        success: false,
        message: `Không thể kết nối đến thiết bị với ID ${deviceId}`
      });
    }
    
    try {
      const mangleRules = await mikrotikRulesService.getMangleRules(api);
      
      // Đóng kết nối API
      await api.close();
      
      return res.json({
        success: true,
        data: mangleRules
      });
    } catch (innerError) {
      // Đảm bảo đóng kết nối API trong trường hợp lỗi
      if (api) {
        try {
          await api.close();
        } catch (closeError) {
          console.error('Error closing API connection:', closeError);
        }
      }
      
      // Nếu lỗi kết nối, trả về mảng rỗng
      if (innerError && (innerError as Error).message && (innerError as Error).message.includes('Cannot read properties of null')) {
        return res.json({
          success: true,
          data: []
        });
      }
      
      throw innerError; // Re-throw để catch bên ngoài xử lý
    }
  } catch (error) {
    console.error('Error fetching mangle rules:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi khi lấy mangle rules: ${(error as Error).message || 'Unknown error'}`
    });
  }
});

/**
 * Route để lấy queue rules cho một thiết bị
 */
rulesRouter.get('/devices/:id/rules/queue', async (req: Request, res: Response) => {
  try {
    const deviceId = Number(req.params.id);
    
    // Lấy thông tin thiết bị từ database
    const [device] = await db.select().from(devices).where(eq(devices.id, deviceId));
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy thiết bị với ID ${deviceId}`
      });
    }
    
    // Kết nối đến thiết bị MikroTik và lấy queue rules
    const connectionParams = {
      id: device.id,
      host: device.ipAddress,
      username: device.username,
      password: device.password
    };
    const api = await mikrotikService.connect(connectionParams);
    
    if (!api) {
      return res.status(500).json({
        success: false,
        message: `Không thể kết nối đến thiết bị với ID ${deviceId}`
      });
    }
    
    try {
      const queueRules = await mikrotikRulesService.getQueueRules(api);
      
      // Đóng kết nối API
      await api.close();
      
      return res.json({
        success: true,
        data: queueRules
      });
    } catch (innerError) {
      // Đảm bảo đóng kết nối API trong trường hợp lỗi
      if (api) {
        try {
          await api.close();
        } catch (closeError) {
          console.error('Error closing API connection:', closeError);
        }
      }
      
      // Nếu lỗi kết nối, trả về đối tượng rỗng
      if (innerError && (innerError as Error).message && (innerError as Error).message.includes('Cannot read properties of null')) {
        return res.json({
          success: true,
          data: { simpleQueues: [], treeQueues: [] }
        });
      }
      
      throw innerError; // Re-throw để catch bên ngoài xử lý
    }
  } catch (error) {
    console.error('Error fetching queue rules:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi khi lấy queue rules: ${(error as Error).message || 'Unknown error'}`
    });
  }
});

/**
 * Route để lấy routing rules cho một thiết bị
 */
rulesRouter.get('/devices/:id/rules/routing', async (req: Request, res: Response) => {
  try {
    const deviceId = Number(req.params.id);
    
    // Lấy thông tin thiết bị từ database
    const [device] = await db.select().from(devices).where(eq(devices.id, deviceId));
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy thiết bị với ID ${deviceId}`
      });
    }
    
    // Kết nối đến thiết bị MikroTik và lấy routing rules
    const connectionParams = {
      id: device.id,
      host: device.ipAddress,
      username: device.username,
      password: device.password
    };
    const api = await mikrotikService.connect(connectionParams);
    
    if (!api) {
      return res.status(500).json({
        success: false,
        message: `Không thể kết nối đến thiết bị với ID ${deviceId}`
      });
    }
    
    try {
      const routingRules = await mikrotikRulesService.getRoutingRules(api);
      
      // Đóng kết nối API
      await api.close();
      
      return res.json({
        success: true,
        data: routingRules
      });
    } catch (innerError) {
      // Đảm bảo đóng kết nối API trong trường hợp lỗi
      if (api) {
        try {
          await api.close();
        } catch (closeError) {
          console.error('Error closing API connection:', closeError);
        }
      }
      
      // Nếu lỗi kết nối, trả về đối tượng rỗng
      if (innerError && (innerError as Error).message && (innerError as Error).message.includes('Cannot read properties of null')) {
        return res.json({
          success: true,
          data: { routes: [], bgp: [], ospf: [] }
        });
      }
      
      throw innerError; // Re-throw để catch bên ngoài xử lý
    }
  } catch (error) {
    console.error('Error fetching routing rules:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi khi lấy routing rules: ${(error as Error).message || 'Unknown error'}`
    });
  }
});

// Thêm các route khác cho việc tạo, cập nhật và xóa rules
rulesRouter.post('/devices/:id/rules/firewall', async (req: Request, res: Response) => {
  try {
    const deviceId = Number(req.params.id);
    const ruleData = req.body;
    
    // Lấy thông tin thiết bị từ database
    const [device] = await db.select().from(devices).where(eq(devices.id, deviceId));
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy thiết bị với ID ${deviceId}`
      });
    }
    
    // Kết nối đến thiết bị MikroTik và tạo firewall rule mới
    const connectionParams = {
      id: device.id,
      host: device.ipAddress,
      username: device.username,
      password: device.password
    };
    const api = await mikrotikService.connect(connectionParams);
    
    if (!api) {
      return res.status(500).json({
        success: false,
        message: `Không thể kết nối đến thiết bị với ID ${deviceId}`
      });
    }
    
    try {
      const newRule = await mikrotikRulesService.createFirewallRuleByDeviceId(deviceId, ruleData);
      
      // Đóng kết nối API
      await api.close();
      
      return res.status(201).json({
        success: true,
        data: newRule,
        message: 'Đã tạo quy tắc firewall mới thành công'
      });
    } catch (innerError) {
      // Đảm bảo đóng kết nối API trong trường hợp lỗi
      if (api) {
        try {
          await api.close();
        } catch (closeError) {
          console.error('Error closing API connection:', closeError);
        }
      }
      
      // Nếu lỗi kết nối, trả về thông báo lỗi thân thiện
      if (innerError && (innerError as Error).message && (innerError as Error).message.includes('Cannot read properties of null')) {
        return res.status(500).json({
          success: false,
          message: 'Kết nối đến thiết bị đã bị đóng, vui lòng thử lại sau'
        });
      }
      
      throw innerError; // Re-throw để catch bên ngoài xử lý
    }
  } catch (error) {
    console.error('Error creating firewall rule:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi khi tạo firewall rule: ${(error as Error).message || 'Unknown error'}`
    });
  }
});

rulesRouter.put('/devices/:id/rules/:type/:ruleId/toggle', async (req: Request, res: Response) => {
  try {
    const deviceId = Number(req.params.id);
    const ruleType = req.params.type;
    const ruleId = req.params.ruleId;
    const { disabled } = req.body;
    
    // Lấy thông tin thiết bị từ database
    const [device] = await db.select().from(devices).where(eq(devices.id, deviceId));
    
    if (!device) {
      return res.status(404).json({
        success: false,
        message: `Không tìm thấy thiết bị với ID ${deviceId}`
      });
    }
    
    // Kết nối đến thiết bị MikroTik và thay đổi trạng thái rule
    const connectionParams = {
      id: device.id,
      host: device.ipAddress,
      username: device.username,
      password: device.password
    };
    const api = await mikrotikService.connect(connectionParams);
    
    if (!api) {
      return res.status(500).json({
        success: false,
        message: `Không thể kết nối đến thiết bị với ID ${deviceId}`
      });
    }
    
    try {
      let result;
      switch (ruleType) {
        case 'firewall':
          result = await mikrotikRulesService.toggleFirewallRuleByDeviceId(deviceId, ruleId, disabled);
          break;
        case 'nat':
          result = await mikrotikRulesService.toggleNatRuleByDeviceId(deviceId, ruleId, disabled);
          break;
        case 'mangle':
          result = await mikrotikRulesService.toggleMangleRuleByDeviceId(deviceId, ruleId, disabled);
          break;
        case 'queue':
          result = await mikrotikRulesService.toggleQueueRuleByDeviceId(deviceId, ruleId, disabled);
          break;
        case 'routing':
          result = await mikrotikRulesService.toggleRoutingRuleByDeviceId(deviceId, ruleId, disabled);
          break;
        default:
          throw new Error(`Không hỗ trợ loại rule "${ruleType}"`);
      }
      
      // Đóng kết nối API
      await api.close();
      
      return res.json({
        success: true,
        data: result,
        message: `Đã ${disabled ? 'vô hiệu hóa' : 'kích hoạt'} quy tắc thành công`
      });
    } catch (innerError) {
      // Đảm bảo đóng kết nối API trong trường hợp lỗi
      if (api) {
        try {
          await api.close();
        } catch (closeError) {
          console.error('Error closing API connection:', closeError);
        }
      }
      
      // Nếu lỗi kết nối, trả về thông báo lỗi thân thiện
      if (innerError && (innerError as Error).message && (innerError as Error).message.includes('Cannot read properties of null')) {
        return res.status(500).json({
          success: false,
          message: 'Kết nối đến thiết bị đã bị đóng, vui lòng thử lại sau'
        });
      }
      
      throw innerError; // Re-throw để catch bên ngoài xử lý
    }
  } catch (error) {
    console.error('Error toggling rule status:', error);
    return res.status(500).json({
      success: false,
      message: `Lỗi khi thay đổi trạng thái rule: ${(error as Error).message || 'Unknown error'}`
    });
  }
});