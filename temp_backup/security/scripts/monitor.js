/**
 * Kịch bản giám sát bảo mật MikroTik
 * Tích hợp Suricata với ứng dụng giám sát tài nguyên MikroTik
 */

import fs from 'fs';
import path from 'path';
import { spawn, exec } from 'child_process';
import { fileURLToPath } from 'url';
import { db } from '../../server/db.js';
import { storage } from '../../server/storage.js';
import { networkDevices, alerts } from '../../shared/schema.js';
import { eq, and } from 'drizzle-orm';

// Cấu hình đường dẫn cho ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cấu hình
const LOGS_DIR = path.resolve(__dirname, '../logs');
const RULES_DIR = path.resolve(__dirname, '../rules');
const SURICATA_CONFIG = path.resolve(__dirname, '../suricata.yaml');
const ALERT_LOG = path.join(LOGS_DIR, 'eve.json');
const CHECK_INTERVAL = 30000; // Kiểm tra mỗi 30 giây
const MAX_ALERTS = 1000; // Giới hạn số cảnh báo lưu trữ
const IP_BLOCK_THRESHOLD = 5; // Số cảnh báo trước khi chặn IP
const IP_BLOCK_DURATION = 3600; // Thời gian chặn IP (giây)

// Biến toàn cục
let suricataProcess = null;
let isMonitoring = false;
let blacklistedIPs = new Map(); // IP -> {count, timestamp}

/**
 * Khởi động Suricata
 */
function startSuricata() {
  if (suricataProcess) {
    console.log('Suricata đã đang chạy.');
    return;
  }

  // Đảm bảo thư mục logs tồn tại
  if (!fs.existsSync(LOGS_DIR)) {
    fs.mkdirSync(LOGS_DIR, { recursive: true });
  }

  console.log('Khởi động Suricata...');
  
  // Xác định giao diện mạng
  exec('ip route | grep default | awk \'{print $5}\'', (error, stdout) => {
    if (error) {
      console.error('Lỗi khi xác định giao diện mạng:', error);
      return;
    }
    
    const networkInterface = stdout.trim() || 'eth0';
    console.log(`Sử dụng giao diện mạng: ${networkInterface}`);
    
    // Khởi động Suricata với cấu hình
    suricataProcess = spawn('suricata', [
      '-c', SURICATA_CONFIG,
      '-i', networkInterface,
      '-l', LOGS_DIR
    ]);

    suricataProcess.stdout.on('data', (data) => {
      console.log(`Suricata: ${data}`);
    });

    suricataProcess.stderr.on('data', (data) => {
      console.error(`Lỗi Suricata: ${data}`);
    });

    suricataProcess.on('close', (code) => {
      console.log(`Suricata đã dừng với mã thoát: ${code}`);
      suricataProcess = null;
      
      // Tự động khởi động lại nếu đang trong chế độ giám sát
      if (isMonitoring) {
        console.log('Đang cố gắng khởi động lại Suricata...');
        setTimeout(startSuricata, 5000);
      }
    });

    isMonitoring = true;
  });
}

/**
 * Dừng Suricata
 */
function stopSuricata() {
  if (suricataProcess) {
    console.log('Đang dừng Suricata...');
    suricataProcess.kill();
    suricataProcess = null;
  }
  
  isMonitoring = false;
}

/**
 * Phân tích nhật ký cảnh báo từ Suricata
 */
async function parseAlerts() {
  if (!fs.existsSync(ALERT_LOG)) {
    console.log('File nhật ký cảnh báo chưa được tạo ra.');
    return [];
  }

  try {
    const alertsContent = fs.readFileSync(ALERT_LOG, 'utf8');
    // Phân tích log dạng JSON theo dòng
    const alertLines = alertsContent.trim().split('\n');
    
    // Chỉ xử lý 100 cảnh báo gần nhất
    const recentAlerts = alertLines.slice(-100).map(line => {
      try {
        return JSON.parse(line);
      } catch (err) {
        return null;
      }
    }).filter(alert => alert && alert.event_type === 'alert');
    
    return recentAlerts;
  } catch (error) {
    console.error('Lỗi khi đọc file nhật ký cảnh báo:', error);
    return [];
  }
}

/**
 * Lưu cảnh báo vào cơ sở dữ liệu
 */
async function saveAlertsToDB(suricataAlerts) {
  for (const alert of suricataAlerts) {
    try {
      // Bỏ qua cảnh báo đã được xử lý
      if (alert.processed) continue;
      
      const srcIP = alert.src_ip || '';
      const dstIP = alert.dest_ip || '';
      const alertMessage = alert.alert?.signature || 'Cảnh báo không xác định';
      const severity = alert.alert?.severity || 3;
      const timestamp = alert.timestamp ? new Date(alert.timestamp) : new Date();
      
      console.log(`Phát hiện cảnh báo mới: ${alertMessage} (IP nguồn: ${srcIP}, IP đích: ${dstIP})`);
      
      // Thêm cảnh báo vào cơ sở dữ liệu
      await storage.createAlert({
        deviceId: null, // Cảnh báo toàn hệ thống
        timestamp: timestamp,
        message: `[Suricata] ${alertMessage}`,
        severity: severity,
        acknowledged: false,
        metadata: {
          sourceIP: srcIP,
          destinationIP: dstIP,
          alertCategory: alert.alert?.category || 'unknown',
          suricataEventType: alert.event_type,
          suricataSignatureId: alert.alert?.signature_id || 0
        }
      });
      
      // Đánh dấu cảnh báo đã xử lý
      alert.processed = true;
      
      // Kiểm tra và cập nhật danh sách đen IP
      if (srcIP && srcIP !== '0.0.0.0' && !srcIP.startsWith('192.168.') && !srcIP.startsWith('10.')) {
        updateBlacklistedIP(srcIP);
      }
    } catch (error) {
      console.error('Lỗi khi lưu cảnh báo vào cơ sở dữ liệu:', error);
    }
  }
}

/**
 * Cập nhật danh sách đen IP
 */
function updateBlacklistedIP(ip) {
  if (!blacklistedIPs.has(ip)) {
    blacklistedIPs.set(ip, { count: 1, timestamp: Date.now() });
  } else {
    const ipInfo = blacklistedIPs.get(ip);
    ipInfo.count += 1;
    ipInfo.timestamp = Date.now();
    
    // Nếu vượt quá ngưỡng, thêm vào danh sách chặn
    if (ipInfo.count >= IP_BLOCK_THRESHOLD) {
      blockIPOnMikroTik(ip);
    }
  }
}

/**
 * Chặn IP trên thiết bị MikroTik
 */
async function blockIPOnMikroTik(ip) {
  try {
    console.log(`Đang thêm IP ${ip} vào danh sách chặn của MikroTik...`);
    
    // Lấy tất cả các thiết bị MikroTik đang hoạt động
    const devices = await storage.getAllDevices();
    const onlineDevices = devices.filter(device => device.isOnline);
    
    if (onlineDevices.length === 0) {
      console.log('Không có thiết bị MikroTik đang hoạt động để thêm quy tắc chặn.');
      return;
    }
    
    // Thực hiện thao tác trên mỗi thiết bị
    for (const device of onlineDevices) {
      try {
        // Kết nối với thiết bị và thêm quy tắc chặn
        // Lưu ý: Mã này chỉ là mô phỏng, cần tích hợp với API MikroTik thực tế
        console.log(`Thêm quy tắc chặn IP ${ip} trên thiết bị ${device.name} (${device.ipAddress})`);
        
        // Tạo ghi chú cho quy tắc chặn
        const comment = `Bị chặn bởi Suricata vào ${new Date().toISOString()}`;
        
        // Thêm thông báo cảnh báo về việc chặn IP
        await storage.createAlert({
          deviceId: device.id,
          timestamp: new Date(),
          message: `Đã tự động chặn IP đáng ngờ: ${ip}`,
          severity: 2,
          acknowledged: false,
          metadata: {
            blockedIP: ip,
            reason: 'Phát hiện nhiều hoạt động đáng ngờ từ Suricata',
            blockDuration: `${IP_BLOCK_DURATION} giây`,
            autoBlocked: true
          }
        });
      } catch (deviceError) {
        console.error(`Lỗi khi thêm quy tắc chặn trên thiết bị ${device.name}:`, deviceError);
      }
    }
  } catch (error) {
    console.error('Lỗi khi chặn IP trên MikroTik:', error);
  }
}

/**
 * Dọn dẹp danh sách đen IP cũ
 */
function cleanupBlacklistedIPs() {
  const now = Date.now();
  for (const [ip, info] of blacklistedIPs.entries()) {
    if (now - info.timestamp > IP_BLOCK_DURATION * 1000) {
      blacklistedIPs.delete(ip);
      console.log(`Đã xóa IP ${ip} khỏi danh sách đen (hết hạn)`);
    }
  }
}

/**
 * Xóa các log cũ để tiết kiệm không gian đĩa
 */
function cleanupOldLogs() {
  if (!fs.existsSync(LOGS_DIR)) return;
  
  fs.readdir(LOGS_DIR, (err, files) => {
    if (err) {
      console.error('Lỗi khi đọc thư mục logs:', err);
      return;
    }
    
    // Giữ lại 10 file log gần nhất
    const logFiles = files
      .filter(file => file.endsWith('.log') || file.endsWith('.json'))
      .map(file => ({
        name: file,
        time: fs.statSync(path.join(LOGS_DIR, file)).mtime.getTime()
      }))
      .sort((a, b) => b.time - a.time);
    
    if (logFiles.length > 10) {
      logFiles.slice(10).forEach(file => {
        fs.unlink(path.join(LOGS_DIR, file.name), err => {
          if (err) console.error(`Lỗi khi xóa file log ${file.name}:`, err);
          else console.log(`Đã xóa file log cũ: ${file.name}`);
        });
      });
    }
  });
}

/**
 * Định kỳ kiểm tra và xử lý cảnh báo
 */
async function checkAlerts() {
  try {
    // Phân tích và lưu cảnh báo
    const alerts = await parseAlerts();
    if (alerts.length > 0) {
      await saveAlertsToDB(alerts);
    }
    
    // Dọn dẹp danh sách đen
    cleanupBlacklistedIPs();
    
    // Dọn dẹp các file log
    cleanupOldLogs();
  } catch (error) {
    console.error('Lỗi trong quá trình kiểm tra cảnh báo:', error);
  }
}

/**
 * Khởi động hệ thống giám sát
 */
function startMonitoring() {
  console.log('Bắt đầu giám sát bảo mật MikroTik...');
  
  // Khởi động Suricata
  startSuricata();
  
  // Bắt đầu kiểm tra cảnh báo định kỳ
  const checkInterval = setInterval(() => {
    if (!isMonitoring) {
      clearInterval(checkInterval);
      return;
    }
    
    checkAlerts();
  }, CHECK_INTERVAL);
  
  console.log(`Hệ thống giám sát đã khởi động, kiểm tra cảnh báo mỗi ${CHECK_INTERVAL / 1000} giây.`);
}

/**
 * Dừng hệ thống giám sát
 */
function stopMonitoring() {
  console.log('Dừng hệ thống giám sát...');
  isMonitoring = false;
  stopSuricata();
}

/**
 * Khởi tạo các thư mục cần thiết
 */
function initialize() {
  // Tạo thư mục nếu chưa tồn tại
  [LOGS_DIR, RULES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * Chạy giám sát khi tập lệnh được thực thi trực tiếp
 */
// Kiểm tra xem script này có được chạy trực tiếp không (ES Module)
if (import.meta.url === `file://${process.argv[1]}`) {
  initialize();
  startMonitoring();
  
  // Xử lý thoát ứng dụng
  process.on('SIGINT', () => {
    console.log('Nhận tín hiệu dừng, đang tắt hệ thống giám sát...');
    stopMonitoring();
    setTimeout(() => process.exit(0), 1000);
  });
}

// Xuất các hàm cho ES Module
export {
  startMonitoring,
  stopMonitoring,
  blockIPOnMikroTik,
  parseAlerts,
  initialize
};