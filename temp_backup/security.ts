/**
 * Routes quản lý bảo mật và tích hợp Suricata
 */

import { Request, Response, Router } from 'express';
import { storage } from '../storage';
import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { RouterOSAPI } from 'node-routeros';
import { fileURLToPath } from 'url';

const execAsync = promisify(execSync);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

// Lấy đường dẫn thư mục trong môi trường ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SECURITY_DIR = path.resolve(__dirname, '../../security');
const LOGS_DIR = path.resolve(SECURITY_DIR, 'logs');
const RULES_DIR = path.resolve(SECURITY_DIR, 'rules');
const SURICATA_CONFIG = path.resolve(SECURITY_DIR, 'suricata.yaml');

// Đường dẫn đến các tập lệnh giám sát
const monitorScriptPath = path.resolve(SECURITY_DIR, 'scripts/monitor.js');
const mikrotikIntegrationPath = path.resolve(SECURITY_DIR, 'scripts/mikrotik-integration.js');

// Biến toàn cục
let suricataProcess: any = null;
let isMonitoring = false;

// Nhập động các mô-đun (khi cần thiết)
let securityMonitor: any = null;
let mikrotikIntegration: any = null;

/**
 * Load các mô-đun giám sát bảo mật
 */
async function loadSecurityModules() {
  try {
    // Load mô-đun giám sát an ninh
    if (fs.existsSync(monitorScriptPath)) {
      securityMonitor = await import(monitorScriptPath);
    }
    
    // Load mô-đun tích hợp MikroTik
    if (fs.existsSync(mikrotikIntegrationPath)) {
      mikrotikIntegration = await import(mikrotikIntegrationPath);
    }
  } catch (error) {
    console.error('Lỗi khi tải các mô-đun bảo mật:', error);
  }
}

// Tải các mô-đun khi khởi động
(async () => {
  await loadSecurityModules();
})();

/**
 * Thiết lập router bảo mật
 */
export function setupSecurityRoutes(router: Router) {
  // Kiểm tra trạng thái Suricata
  router.get('/security/status', async (_req: Request, res: Response) => {
    try {
      const suricataVersion = execSync('suricata -V').toString().trim();
      const isRunning = isMonitoring && suricataProcess !== null;
      
      let stats = null;
      if (fs.existsSync(path.join(LOGS_DIR, 'stats.log'))) {
        const statsContent = fs.readFileSync(path.join(LOGS_DIR, 'stats.log'), 'utf8');
        stats = statsContent.split('\n').slice(-100).join('\n');
      }
      
      // Đếm số quy tắc
      let ruleCount = 0;
      if (fs.existsSync(path.join(RULES_DIR, 'mikrotik.rules'))) {
        const rulesContent = fs.readFileSync(path.join(RULES_DIR, 'mikrotik.rules'), 'utf8');
        ruleCount = rulesContent.split('\n').filter(line => 
          line.trim() && !line.trim().startsWith('#')
        ).length;
      }
      
      // Đếm cảnh báo
      let alertCount = 0;
      try {
        const alerts = await storage.getAlerts(undefined, false, 1000);
        alertCount = alerts.filter(alert => alert.message.startsWith('[Suricata]')).length;
      } catch (error) {
        console.error('Lỗi khi đếm cảnh báo:', error);
      }
      
      res.json({
        version: suricataVersion,
        isRunning,
        ruleCount,
        alertCount,
        stats
      });
    } catch (error) {
      console.error('Lỗi khi kiểm tra trạng thái Suricata:', error);
      res.status(500).json({ error: 'Lỗi khi kiểm tra trạng thái Suricata', details: error.message });
    }
  });
  
  // Bắt đầu giám sát
  router.post('/security/start', (_req: Request, res: Response) => {
    try {
      if (isMonitoring) {
        return res.status(400).json({ error: 'Hệ thống giám sát đã đang chạy' });
      }
      
      if (securityMonitor) {
        // Sử dụng mô-đun giám sát
        securityMonitor.startMonitoring();
        isMonitoring = true;
        
        // Bắt đầu tích hợp MikroTik nếu có sẵn
        if (mikrotikIntegration) {
          mikrotikIntegration.startIntegration();
        }
        
        res.json({ success: true, message: 'Đã bắt đầu giám sát bảo mật' });
      } else {
        // Phương pháp dự phòng - khởi động Suricata trực tiếp
        const networkInterface = execSync('ip route | grep default | awk \'{print $5}\'').toString().trim() || 'eth0';
        
        // Đảm bảo thư mục logs tồn tại
        if (!fs.existsSync(LOGS_DIR)) {
          fs.mkdirSync(LOGS_DIR, { recursive: true });
        }
        
        suricataProcess = spawn('suricata', [
          '-c', SURICATA_CONFIG,
          '-i', networkInterface,
          '-l', LOGS_DIR
        ]);
        
        suricataProcess.stdout.on('data', (data: Buffer) => {
          console.log(`Suricata: ${data}`);
        });
        
        suricataProcess.stderr.on('data', (data: Buffer) => {
          console.error(`Lỗi Suricata: ${data}`);
        });
        
        suricataProcess.on('close', (code: number) => {
          console.log(`Suricata đã dừng với mã thoát: ${code}`);
          suricataProcess = null;
          isMonitoring = false;
        });
        
        isMonitoring = true;
        res.json({ success: true, message: 'Đã bắt đầu giám sát bảo mật' });
      }
    } catch (error) {
      console.error('Lỗi khi bắt đầu giám sát bảo mật:', error);
      res.status(500).json({ error: 'Lỗi khi bắt đầu giám sát bảo mật', details: error.message });
    }
  });
  
  // Dừng giám sát
  router.post('/security/stop', (_req: Request, res: Response) => {
    try {
      if (!isMonitoring) {
        return res.status(400).json({ error: 'Hệ thống giám sát chưa chạy' });
      }
      
      if (securityMonitor) {
        // Sử dụng mô-đun giám sát
        securityMonitor.stopMonitoring();
        
        // Dừng tích hợp MikroTik nếu có sẵn
        if (mikrotikIntegration) {
          mikrotikIntegration.stopIntegration();
        }
      } else if (suricataProcess) {
        // Phương pháp dự phòng
        suricataProcess.kill();
        suricataProcess = null;
      }
      
      isMonitoring = false;
      res.json({ success: true, message: 'Đã dừng giám sát bảo mật' });
    } catch (error) {
      console.error('Lỗi khi dừng giám sát bảo mật:', error);
      res.status(500).json({ error: 'Lỗi khi dừng giám sát bảo mật', details: error.message });
    }
  });
  
  // Lấy các quy tắc bảo mật
  router.get('/security/rules', async (_req: Request, res: Response) => {
    try {
      const rulesPath = path.join(RULES_DIR, 'mikrotik.rules');
      
      if (!fs.existsSync(rulesPath)) {
        return res.status(404).json({ error: 'Không tìm thấy file quy tắc' });
      }
      
      const rulesContent = await readFileAsync(rulesPath, 'utf8');
      
      // Phân tích quy tắc thành mảng đối tượng
      const rules = rulesContent.split('\n')
        .filter(line => line.trim() && !line.trim().startsWith('#'))
        .map(line => {
          const parts = line.split(' ');
          const action = parts[0];
          const msg = line.match(/msg:"([^"]+)"/)?.[1] || '';
          const sid = line.match(/sid:(\d+)/)?.[1] || '';
          const classtype = line.match(/classtype:([^;]+)/)?.[1] || '';
          
          return {
            action,
            message: msg,
            sid,
            classtype,
            raw: line
          };
        });
      
      res.json({ rules });
    } catch (error) {
      console.error('Lỗi khi lấy quy tắc bảo mật:', error);
      res.status(500).json({ error: 'Lỗi khi lấy quy tắc bảo mật', details: error.message });
    }
  });
  
  // Thêm quy tắc bảo mật mới
  router.post('/security/rules', async (req: Request, res: Response) => {
    try {
      const { rule } = req.body;
      
      if (!rule) {
        return res.status(400).json({ error: 'Thiếu thông tin quy tắc' });
      }
      
      const rulesPath = path.join(RULES_DIR, 'mikrotik.rules');
      
      // Đảm bảo thư mục quy tắc tồn tại
      if (!fs.existsSync(RULES_DIR)) {
        fs.mkdirSync(RULES_DIR, { recursive: true });
      }
      
      // Đảm bảo file quy tắc tồn tại
      if (!fs.existsSync(rulesPath)) {
        await writeFileAsync(rulesPath, '# MikroTik Security Rules\n\n', 'utf8');
      }
      
      // Thêm quy tắc vào file
      await writeFileAsync(rulesPath, `${fs.readFileSync(rulesPath, 'utf8')}\n${rule}`, 'utf8');
      
      res.json({ success: true, message: 'Đã thêm quy tắc mới' });
    } catch (error) {
      console.error('Lỗi khi thêm quy tắc bảo mật:', error);
      res.status(500).json({ error: 'Lỗi khi thêm quy tắc bảo mật', details: error.message });
    }
  });
  
  // Xóa quy tắc bảo mật
  router.delete('/security/rules/:sid', async (req: Request, res: Response) => {
    try {
      const { sid } = req.params;
      
      if (!sid) {
        return res.status(400).json({ error: 'Thiếu ID quy tắc' });
      }
      
      const rulesPath = path.join(RULES_DIR, 'mikrotik.rules');
      
      if (!fs.existsSync(rulesPath)) {
        return res.status(404).json({ error: 'Không tìm thấy file quy tắc' });
      }
      
      const rulesContent = await readFileAsync(rulesPath, 'utf8');
      
      // Lọc quy tắc có sid tương ứng
      const updatedRules = rulesContent.split('\n')
        .filter(line => !line.includes(`sid:${sid};`))
        .join('\n');
      
      await writeFileAsync(rulesPath, updatedRules, 'utf8');
      
      res.json({ success: true, message: 'Đã xóa quy tắc' });
    } catch (error) {
      console.error('Lỗi khi xóa quy tắc bảo mật:', error);
      res.status(500).json({ error: 'Lỗi khi xóa quy tắc bảo mật', details: error.message });
    }
  });
  
  // Lấy danh sách cảnh báo bảo mật
  router.get('/security/alerts', async (req: Request, res: Response) => {
    try {
      const { limit = 100, acknowledged = 'false', deviceId } = req.query;
      
      // Chuyển đổi giá trị thành boolean và số
      const isAcknowledged = acknowledged === 'true';
      const deviceIdNumber = deviceId ? Number(deviceId) : undefined;
      
      // Lấy cảnh báo từ cơ sở dữ liệu
      const alerts = await storage.getAlerts(deviceIdNumber, isAcknowledged, Number(limit));
      
      // Lọc cảnh báo Suricata (chỉ lấy cảnh báo thực, không lấy cảnh báo demo)
      const securityAlerts = alerts.filter(alert => 
        alert.message.startsWith('[Suricata]') && !alert.message.includes('1000000')
      );
      
      res.json({ alerts: securityAlerts });
    } catch (error) {
      console.error('Lỗi khi lấy cảnh báo bảo mật:', error);
      res.status(500).json({ error: 'Lỗi khi lấy cảnh báo bảo mật', details: error.message });
    }
  });
  
  // Xác nhận đã xem cảnh báo
  router.post('/security/alerts/:id/acknowledge', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ error: 'Thiếu ID cảnh báo' });
      }
      
      const updatedAlert = await storage.acknowledgeAlert(Number(id));
      
      if (!updatedAlert) {
        return res.status(404).json({ error: 'Không tìm thấy cảnh báo' });
      }
      
      res.json({ success: true, alert: updatedAlert });
    } catch (error) {
      console.error('Lỗi khi xác nhận cảnh báo:', error);
      res.status(500).json({ error: 'Lỗi khi xác nhận cảnh báo', details: error.message });
    }
  });
  
  // Xác nhận tất cả cảnh báo bảo mật
  router.post('/security/alerts/acknowledge-all', async (_req: Request, res: Response) => {
    try {
      // Lấy tất cả cảnh báo bảo mật chưa được xác nhận
      const alerts = await storage.getAlerts(undefined, false, 1000);
      const securityAlertIds = alerts
        .filter(alert => alert.message.startsWith('[Suricata]'))
        .map(alert => alert.id);
      
      // Xác nhận từng cảnh báo
      for (const id of securityAlertIds) {
        await storage.acknowledgeAlert(id);
      }
      
      res.json({ 
        success: true, 
        message: `Đã xác nhận ${securityAlertIds.length} cảnh báo bảo mật` 
      });
    } catch (error) {
      console.error('Lỗi khi xác nhận tất cả cảnh báo:', error);
      res.status(500).json({ error: 'Lỗi khi xác nhận tất cả cảnh báo', details: error.message });
    }
  });
  
  // Lấy danh sách IP bị chặn
  router.get('/security/blocked-ips', async (req: Request, res: Response) => {
    try {
      const { deviceId } = req.query;
      
      if (!deviceId) {
        return res.status(400).json({ error: 'Thiếu ID thiết bị' });
      }
      
      // Lấy thông tin thiết bị
      const device = await storage.getDevice(Number(deviceId));
      
      if (!device) {
        return res.status(404).json({ error: 'Không tìm thấy thiết bị' });
      }
      
      if (!mikrotikIntegration) {
        await loadSecurityModules(); // Thử tải lại module
        
        if (!mikrotikIntegration) {
          return res.status(500).json({ error: 'Mô-đun tích hợp MikroTik không thể tải' });
        }
      }
      
      // Nếu thiết bị không trực tuyến, trả về danh sách trống
      if (!device.isOnline) {
        return res.json({ blockedIPs: [] });
      }
      
      // Kết nối đến thiết bị
      const connection = await mikrotikIntegration.connectToDevice(device);
      
      if (!connection) {
        return res.status(500).json({ error: 'Không thể kết nối đến thiết bị MikroTik' });
      }
      
      // Lấy danh sách IP bị chặn
      try {
        // Kiểm tra xem kết nối có phương thức query không
        if (typeof connection.query !== 'function') {
          console.error('Lỗi khi lấy danh sách IP bị chặn: Kết nối không hợp lệ');
          return res.json({ blockedIPs: [] });
        }
        
        // Lấy danh sách IP bị chặn
        const blockedIPs = await mikrotikIntegration.getBlockedIPs(connection);
        res.json({ blockedIPs });
      } catch (blockedIPError) {
        console.error('Lỗi khi lấy danh sách IP bị chặn:', blockedIPError);
        // Trả về mảng trống nếu có lỗi
        res.json({ blockedIPs: [] });
      }
    } catch (error) {
      console.error('Lỗi khi lấy danh sách IP bị chặn:', error);
      res.status(500).json({ error: 'Lỗi khi lấy danh sách IP bị chặn', details: error.message });
    }
  });
  
  // Thêm IP vào danh sách chặn
  router.post('/security/block-ip', async (req: Request, res: Response) => {
    try {
      const { deviceId, ip, timeout, comment } = req.body;
      
      if (!deviceId || !ip) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
      }
      
      // Lấy thông tin thiết bị
      const device = await storage.getDevice(Number(deviceId));
      
      if (!device) {
        return res.status(404).json({ error: 'Không tìm thấy thiết bị' });
      }
      
      if (!mikrotikIntegration) {
        await loadSecurityModules(); // Thử tải lại module
        
        if (!mikrotikIntegration) {
          return res.status(500).json({ error: 'Mô-đun tích hợp MikroTik không thể tải' });
        }
      }
      
      // Nếu thiết bị không trực tuyến, trả về lỗi
      if (!device.isOnline) {
        return res.status(400).json({ error: 'Thiết bị đang ngoại tuyến' });
      }
      
      // Kết nối đến thiết bị
      const connection = await mikrotikIntegration.connectToDevice(device);
      
      if (!connection) {
        return res.status(500).json({ error: 'Không thể kết nối đến thiết bị MikroTik' });
      }
      
      // Thêm IP vào danh sách chặn
      try {
        // Kiểm tra xem kết nối có phương thức query không
        if (typeof connection.query !== 'function') {
          console.error('Lỗi khi chặn IP: Kết nối không hợp lệ');
          return res.status(500).json({ error: 'Kết nối không hợp lệ' });
        }
        
        const success = await mikrotikIntegration.addToBlocklist(
          connection, 
          ip, 
          timeout || '1d', 
          comment || 'Chặn thủ công'
        );
        
        if (success) {
          res.json({ success: true, message: `Đã chặn IP ${ip}` });
        } else {
          res.status(500).json({ error: 'Không thể chặn IP' });
        }
      } catch (blockError) {
        console.error('Lỗi khi chặn IP:', blockError);
        res.status(500).json({ error: 'Không thể chặn IP', details: blockError.message || blockError });
      }
    } catch (error) {
      console.error('Lỗi khi chặn IP:', error);
      res.status(500).json({ error: 'Lỗi khi chặn IP', details: error.message });
    }
  });
  
  // Gỡ bỏ IP khỏi danh sách chặn
  router.post('/security/unblock-ip', async (req: Request, res: Response) => {
    try {
      const { deviceId, ip } = req.body;
      
      if (!deviceId || !ip) {
        return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
      }
      
      // Lấy thông tin thiết bị
      const device = await storage.getDevice(Number(deviceId));
      
      if (!device) {
        return res.status(404).json({ error: 'Không tìm thấy thiết bị' });
      }
      
      if (!mikrotikIntegration) {
        await loadSecurityModules(); // Thử tải lại module
        
        if (!mikrotikIntegration) {
          return res.status(500).json({ error: 'Mô-đun tích hợp MikroTik không thể tải' });
        }
      }
      
      // Nếu thiết bị không trực tuyến, trả về lỗi
      if (!device.isOnline) {
        return res.status(400).json({ error: 'Thiết bị đang ngoại tuyến' });
      }
      
      // Kết nối đến thiết bị
      const connection = await mikrotikIntegration.connectToDevice(device);
      
      if (!connection) {
        return res.status(500).json({ error: 'Không thể kết nối đến thiết bị MikroTik' });
      }
      
      // Xóa IP khỏi danh sách chặn
      try {
        // Kiểm tra xem kết nối có phương thức query không
        if (typeof connection.query !== 'function') {
          console.error('Lỗi khi gỡ bỏ chặn IP: Kết nối không hợp lệ');
          return res.status(500).json({ error: 'Kết nối không hợp lệ' });
        }
        
        const success = await mikrotikIntegration.removeFromBlocklist(connection, ip);
        
        if (success) {
          res.json({ success: true, message: `Đã gỡ bỏ chặn IP ${ip}` });
        } else {
          res.status(500).json({ error: 'Không thể gỡ bỏ chặn IP' });
        }
      } catch (unblockError) {
        console.error('Lỗi khi gỡ bỏ chặn IP:', unblockError);
        res.status(500).json({ error: 'Không thể gỡ bỏ chặn IP', details: unblockError.message || unblockError });
      }
    } catch (error) {
      console.error('Lỗi khi gỡ bỏ chặn IP:', error);
      res.status(500).json({ error: 'Lỗi khi gỡ bỏ chặn IP', details: error.message });
    }
  });

  // Lấy nhật ký Suricata gần đây
  router.get('/security/logs', (_req: Request, res: Response) => {
    try {
      if (!fs.existsSync(LOGS_DIR)) {
        return res.status(404).json({ error: 'Thư mục nhật ký không tồn tại' });
      }
      
      const logFiles = fs.readdirSync(LOGS_DIR)
        .filter(file => file.endsWith('.log') || file.endsWith('.json'))
        .map(file => ({
          name: file,
          path: path.join(LOGS_DIR, file),
          size: fs.statSync(path.join(LOGS_DIR, file)).size,
          lastModified: fs.statSync(path.join(LOGS_DIR, file)).mtime
        }))
        .sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
      
      res.json({ logs: logFiles });
    } catch (error) {
      console.error('Lỗi khi lấy nhật ký Suricata:', error);
      res.status(500).json({ error: 'Lỗi khi lấy nhật ký Suricata', details: error.message });
    }
  });
  
  // Lấy nội dung file nhật ký cụ thể
  router.get('/security/logs/:filename', (req: Request, res: Response) => {
    try {
      const { filename } = req.params;
      const logPath = path.join(LOGS_DIR, filename);
      
      if (!fs.existsSync(logPath)) {
        return res.status(404).json({ error: 'File nhật ký không tồn tại' });
      }
      
      // Đọc file
      const content = fs.readFileSync(logPath, 'utf8');
      
      // Nếu là file JSON, phân tích nó
      if (filename.endsWith('.json')) {
        const jsonLines = content.trim().split('\n').map(line => {
          try {
            return JSON.parse(line);
          } catch (e) {
            return { error: 'Không thể phân tích dòng JSON', raw: line };
          }
        });
        
        res.json({ content: jsonLines });
      } else {
        // Nếu không, trả về nội dung văn bản
        res.json({ content });
      }
    } catch (error) {
      console.error('Lỗi khi lấy nội dung nhật ký:', error);
      res.status(500).json({ error: 'Lỗi khi lấy nội dung nhật ký', details: error.message });
    }
  });
  
  // Xử lý thủ công các cảnh báo
  router.post('/security/process-alerts', async (_req: Request, res: Response) => {
    try {
      if (!mikrotikIntegration) {
        return res.status(500).json({ error: 'Mô-đun tích hợp MikroTik chưa được tải' });
      }
      
      // Xử lý cảnh báo
      await mikrotikIntegration.processAlerts();
      
      res.json({ success: true, message: 'Đã xử lý cảnh báo thành công' });
    } catch (error) {
      console.error('Lỗi khi xử lý cảnh báo:', error);
      res.status(500).json({ error: 'Lỗi khi xử lý cảnh báo', details: error.message });
    }
  });

  return router;
}