/**
 * Tích hợp giữa MikroTik và Suricata
 * Mô-đun này xử lý việc áp dụng các quy tắc bảo mật tự động trên MikroTik
 * dựa trên cảnh báo từ Suricata
 */

import { fileURLToPath } from 'url';
import path from 'path';
import * as nodeRouterOS from 'node-routeros';
import { storage } from '../../server/storage.js';

// Lấy các API cần thiết từ node-routeros, hỗ trợ cả CommonJS và ES modules
const RouterOSAPI = nodeRouterOS.RouterOSAPI || (nodeRouterOS.default && nodeRouterOS.default.RouterOSAPI);
const RosApiPool = nodeRouterOS.RosApiPool || (nodeRouterOS.default && nodeRouterOS.default.RosApiPool);

// Cấu hình
const BLOCK_LIST_NAME = 'suricata-blacklist';
const CHECK_INTERVAL = 60000; // Kiểm tra cảnh báo mỗi phút
const MAX_BLOCKED_IPS = 1000; // Số lượng tối đa IP bị chặn
const LOG_PREFIX = '[Suricata] ';

// Biến toàn cục
let isRunning = false;
let rosClients = new Map(); // deviceId -> ROS client

/**
 * Kết nối đến thiết bị MikroTik
 */
async function connectToDevice(device) {
  const { id, ipAddress, username, password } = device;
  
  if (!ipAddress || !username || !password) {
    console.error(`Thiếu thông tin kết nối cho thiết bị ID ${id}`);
    return null;
  }
  
  try {
    // Sử dụng RosApiPool để kết nối đến thiết bị
    const connection = new RouterOSAPI({
      host: ipAddress,
      user: username,
      password: password,
      timeout: 5000
    });
    
    // Thiết lập kết nối
    await connection.connect();
    console.log(`Đã kết nối thành công đến thiết bị MikroTik ${device.name} (${ipAddress})`);
    
    return connection;
  } catch (error) {
    console.error(`Lỗi khi kết nối đến thiết bị MikroTik ${device.name} (${ipAddress}):`, error.message || error);
    return null;
  }
}

/**
 * Đảm bảo address list tồn tại
 */
async function ensureAddressList(conn, listName) {
  try {
    // Kiểm tra xem kết nối có hợp lệ không
    if (!conn || typeof conn.query !== 'function') {
      console.error(`Kết nối không hợp lệ khi đảm bảo address list ${listName}`);
      return;
    }
    
    try {
      // Kiểm tra xem address list đã tồn tại chưa
      const lists = await conn.query('/ip/firewall/address-list/print').where({
        list: listName
      }).exec();
      
      if (lists.length === 0) {
        // Thêm một địa chỉ tạm thời để tạo list
        await conn.query('/ip/firewall/address-list/add').equal({
          list: listName,
          address: '127.0.0.1',
          comment: 'Danh sách địa chỉ được tạo bởi Suricata'
        }).exec();
        
        // Xóa địa chỉ tạm thời
        const items = await conn.query('/ip/firewall/address-list/print').where({
          list: listName,
          address: '127.0.0.1'
        }).exec();
        
        if (items.length > 0) {
          await conn.query('/ip/firewall/address-list/remove').equal({
            '.id': items[0]['.id']
          }).exec();
        }
        
        console.log(`Đã tạo address list "${listName}"`);
      }
    } catch (queryError) {
      console.error(`Lỗi khi truy vấn address list ${listName}:`, queryError);
    }
  } catch (error) {
    console.error(`Lỗi khi đảm bảo address list ${listName}:`, error.message || error);
  }
}

/**
 * Đảm bảo quy tắc tường lửa tồn tại
 */
async function ensureFirewallRule(conn, listName) {
  try {
    // Kiểm tra xem kết nối có hợp lệ không
    if (!conn || typeof conn.query !== 'function') {
      console.error('Kết nối không hợp lệ khi tạo quy tắc tường lửa');
      return;
    }
    
    try {
      // Kiểm tra xem quy tắc tường lửa đã tồn tại chưa
      const rules = await conn.query('/ip/firewall/filter/print').where({
        comment: LOG_PREFIX + 'Block malicious IPs'
      }).exec();
      
      if (rules.length === 0) {
        // Thêm quy tắc tường lửa
        await conn.query('/ip/firewall/filter/add').equal({
          chain: 'forward',
          'src-address-list': listName,
          action: 'drop',
          comment: LOG_PREFIX + 'Block malicious IPs'
        }).exec();
        
        console.log('Đã thêm quy tắc tường lửa để chặn các IP độc hại');
      }
    } catch (queryError) {
      console.error('Lỗi khi truy vấn quy tắc tường lửa:', queryError);
    }
  } catch (error) {
    console.error('Lỗi khi đảm bảo quy tắc tường lửa:', error.message || error);
  }
}

/**
 * Thêm địa chỉ IP vào danh sách chặn
 */
async function addToBlocklist(conn, ip, timeout, comment) {
  try {
    // Đảm bảo danh sách địa chỉ tồn tại
    await ensureAddressList(conn, BLOCK_LIST_NAME);
    
    // Kiểm tra xem kết nối có hợp lệ không
    if (!conn || typeof conn.query !== 'function') {
      console.error(`Kết nối không hợp lệ khi thêm IP ${ip} vào danh sách chặn`);
      return false;
    }
    
    // Kiểm tra xem danh sách địa chỉ đã tồn tại chưa
    try {
      await ensureAddressList(conn, BLOCK_LIST_NAME);
      
      // Kiểm tra xem IP đã có trong danh sách chưa
      const items = await conn.query('/ip/firewall/address-list/print').where({
        list: BLOCK_LIST_NAME,
        address: ip
      }).exec();
      
      if (items && items.length > 0) {
        // Cập nhật mục hiện có
        await conn.query('/ip/firewall/address-list/set').equal({
          '.id': items[0]['.id'],
          timeout: timeout,
          comment: comment
        }).exec();
        console.log(`Đã cập nhật IP ${ip} trong danh sách chặn`);
      } else {
        // Thêm mục mới
        await conn.query('/ip/firewall/address-list/add').equal({
          list: BLOCK_LIST_NAME,
          address: ip,
          timeout: timeout,
          comment: comment
        }).exec();
        console.log(`Đã thêm IP ${ip} vào danh sách chặn`);
      }
      
      // Đảm bảo quy tắc tường lửa tồn tại
      await ensureFirewallRule(conn, BLOCK_LIST_NAME);
      
      return true;
    } catch (queryError) {
      console.error("Lỗi khi truy vấn danh sách địa chỉ:", queryError);
      return false;
    }
  } catch (error) {
    console.error(`Lỗi khi thêm IP ${ip} vào danh sách chặn:`, error.message || error);
    return false;
  }
}

/**
 * Xóa địa chỉ IP khỏi danh sách chặn
 */
async function removeFromBlocklist(conn, ip) {
  try {
    // Kiểm tra xem kết nối có hợp lệ không
    if (!conn || typeof conn.query !== 'function') {
      console.error(`Kết nối không hợp lệ khi xóa IP ${ip} khỏi danh sách chặn`);
      return false;
    }
    
    // Kiểm tra xem danh sách chặn có tồn tại không
    try {
      const addressLists = await conn.query('/ip/firewall/address-list/print').where({
        list: BLOCK_LIST_NAME
      }).proplist('list').exec();
      
      if (!addressLists || addressLists.length === 0) {
        console.log(`Danh sách chặn '${BLOCK_LIST_NAME}' không tồn tại`);
        return false;
      }
      
      // Tìm địa chỉ IP trong danh sách
      const items = await conn.query('/ip/firewall/address-list/print').where({
        list: BLOCK_LIST_NAME,
        address: ip
      }).exec();
      
      if (items && items.length > 0) {
        await conn.query('/ip/firewall/address-list/remove').equal({
          '.id': items[0]['.id']
        }).exec();
        console.log(`Đã xóa IP ${ip} khỏi danh sách chặn`);
        return true;
      } else {
        console.log(`IP ${ip} không có trong danh sách chặn`);
        return false;
      }
    } catch (queryError) {
      console.error("Lỗi khi truy vấn danh sách địa chỉ:", queryError);
      return false;
    }
  } catch (error) {
    console.error(`Lỗi khi xóa IP ${ip} khỏi danh sách chặn:`, error.message || error);
    return false;
  }
}

/**
 * Lấy danh sách IP đang bị chặn
 */
async function getBlockedIPs(conn) {
  try {
    // Kiểm tra xem kết nối có hợp lệ không
    if (!conn || typeof conn.query !== 'function') {
      console.error('Kết nối không hợp lệ khi lấy danh sách IP bị chặn');
      return [];
    }
    
    try {
      // Kiểm tra xem danh sách chặn có tồn tại không
      const addressLists = await conn.query('/ip/firewall/address-list/print').where({
        list: BLOCK_LIST_NAME
      }).proplist('list').exec();
      
      if (!addressLists || addressLists.length === 0) {
        console.log(`Không tìm thấy danh sách chặn '${BLOCK_LIST_NAME}', trả về danh sách trống`);
        return [];
      }
      
      // Lấy các mục trong danh sách chặn
      const items = await conn.query('/ip/firewall/address-list/print').where({
        list: BLOCK_LIST_NAME
      }).exec();
      
      // Chuyển đổi dữ liệu
      const result = items.map(item => ({
        ip: item.address,
        timeout: item.timeout,
        comment: item.comment || '',
        dynamic: item.dynamic === 'true'
      }));
      
      return result;
    } catch (queryError) {
      console.error('Lỗi khi truy vấn danh sách địa chỉ:', queryError);
      return [];
    }
  } catch (error) {
    console.error('Lỗi khi lấy danh sách IP bị chặn:', error.message || error);
    return [];
  }
}

/**
 * Dọn dẹp danh sách IP đã hết thời gian chặn
 */
async function cleanupExpiredIPs(conn) {
  try {
    // Kiểm tra xem kết nối có hợp lệ không
    if (!conn || typeof conn.query !== 'function') {
      console.error('Kết nối không hợp lệ khi dọn dẹp IP hết hạn');
      return;
    }
    
    try {
      // Với RouterOS, các địa chỉ hết hạn sẽ tự động bị xóa
      // Kiểm tra và xóa các địa chỉ có timeout '0s' (đã hết hạn)
      const items = await conn.query('/ip/firewall/address-list/print').where({
        list: BLOCK_LIST_NAME,
        timeout: '0s'
      }).exec();
      
      for (const item of items) {
        await conn.query('/ip/firewall/address-list/remove').equal({
          '.id': item['.id']
        }).exec();
        console.log(`Đã xóa IP ${item.address} đã hết hạn khỏi danh sách chặn`);
      }
    } catch (queryError) {
      console.error('Lỗi khi truy vấn danh sách địa chỉ trong quá trình dọn dẹp:', queryError);
    }
  } catch (error) {
    console.error('Lỗi khi dọn dẹp các IP hết hạn:', error.message || error);
  }
}

/**
 * Kiểm tra và xử lý các cảnh báo mới
 */
async function processAlerts() {
  try {
    // Lấy cảnh báo chưa được xử lý từ cơ sở dữ liệu
    const alerts = await storage.getAlerts(undefined, false, 100);
    
    // Lọc các cảnh báo liên quan đến bảo mật từ Suricata
    const securityAlerts = alerts.filter(alert => 
      alert.message.startsWith('[Suricata]') && 
      alert.metadata && 
      alert.metadata.sourceIP
    );
    
    if (securityAlerts.length === 0) {
      return;
    }
    
    console.log(`Tìm thấy ${securityAlerts.length} cảnh báo bảo mật mới cần xử lý`);
    
    // Lấy tất cả các thiết bị MikroTik đang hoạt động
    const devices = await storage.getAllDevices();
    const activeDevices = devices.filter(device => device.isOnline);
    
    if (activeDevices.length === 0) {
      console.log('Không có thiết bị MikroTik nào đang hoạt động để xử lý cảnh báo');
      return;
    }
    
    // Xử lý cảnh báo trên từng thiết bị
    for (const device of activeDevices) {
      let conn = rosClients.get(device.id);
      
      // Kết nối đến thiết bị nếu chưa kết nối
      if (!conn) {
        conn = await connectToDevice(device);
        if (conn) {
          rosClients.set(device.id, conn);
          
          // Đảm bảo address list và quy tắc tường lửa tồn tại
          await ensureAddressList(conn, BLOCK_LIST_NAME);
          await ensureFirewallRule(conn, BLOCK_LIST_NAME);
        } else {
          continue; // Bỏ qua thiết bị này nếu không thể kết nối
        }
      }
      
      // Xử lý từng cảnh báo
      for (const alert of securityAlerts) {
        const sourceIP = alert.metadata.sourceIP;
        
        // Bỏ qua các địa chỉ IP nội bộ
        if (isLocalIP(sourceIP)) {
          continue;
        }
        
        // Thêm IP vào danh sách chặn
        const timeout = '1d'; // Chặn trong 1 ngày
        const comment = `${LOG_PREFIX}${alert.message} (${new Date().toISOString()})`;
        
        await addToBlocklist(conn, sourceIP, timeout, comment);
        
        // Đánh dấu cảnh báo đã được xử lý
        await storage.acknowledgeAlert(alert.id);
      }
      
      // Dọn dẹp các IP đã hết hạn
      await cleanupExpiredIPs(conn);
    }
  } catch (error) {
    console.error('Lỗi khi xử lý cảnh báo:', error);
  }
}

/**
 * Kiểm tra xem IP có phải là địa chỉ nội bộ không
 */
function isLocalIP(ip) {
  return ip.startsWith('10.') || 
         ip.startsWith('192.168.') || 
         ip.startsWith('172.16.') || 
         ip.startsWith('172.17.') || 
         ip.startsWith('172.18.') || 
         ip.startsWith('172.19.') || 
         ip.startsWith('172.20.') || 
         ip.startsWith('172.21.') || 
         ip.startsWith('172.22.') || 
         ip.startsWith('172.23.') || 
         ip.startsWith('172.24.') || 
         ip.startsWith('172.25.') || 
         ip.startsWith('172.26.') || 
         ip.startsWith('172.27.') || 
         ip.startsWith('172.28.') || 
         ip.startsWith('172.29.') || 
         ip.startsWith('172.30.') || 
         ip.startsWith('172.31.') || 
         ip === '127.0.0.1';
}

/**
 * Đóng tất cả các kết nối
 */
function closeAllConnections() {
  for (const [deviceId, conn] of rosClients.entries()) {
    try {
      conn.disconnect();
      console.log(`Đã đóng kết nối đến thiết bị ID ${deviceId}`);
    } catch (error) {
      console.error(`Lỗi khi đóng kết nối đến thiết bị ID ${deviceId}:`, error);
    }
  }
  
  rosClients.clear();
}

/**
 * Bắt đầu tích hợp Suricata-MikroTik
 */
function startIntegration() {
  if (isRunning) {
    console.log('Tích hợp Suricata-MikroTik đã đang chạy');
    return;
  }
  
  console.log('Bắt đầu tích hợp Suricata-MikroTik...');
  isRunning = true;
  
  // Xử lý cảnh báo ban đầu
  processAlerts();
  
  // Thiết lập khoảng thời gian kiểm tra
  const interval = setInterval(() => {
    if (!isRunning) {
      clearInterval(interval);
      return;
    }
    
    processAlerts();
  }, CHECK_INTERVAL);
  
  console.log(`Đã bắt đầu tích hợp, kiểm tra cảnh báo mỗi ${CHECK_INTERVAL / 1000} giây`);
}

/**
 * Dừng tích hợp Suricata-MikroTik
 */
function stopIntegration() {
  if (!isRunning) {
    console.log('Tích hợp Suricata-MikroTik chưa chạy');
    return;
  }
  
  console.log('Dừng tích hợp Suricata-MikroTik...');
  isRunning = false;
  
  // Đóng tất cả kết nối
  closeAllConnections();
  
  console.log('Đã dừng tích hợp Suricata-MikroTik');
}

/**
 * Các API public cho ES Module
 */
export {
  startIntegration,
  stopIntegration,
  addToBlocklist,
  removeFromBlocklist,
  getBlockedIPs,
  connectToDevice,
  processAlerts,
  BLOCK_LIST_NAME
};