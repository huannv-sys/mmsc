import { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { InfoCircledIcon, RocketIcon, Cross2Icon, CheckIcon, ReloadIcon } from "@radix-ui/react-icons";
import { ShieldAlert } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

interface SecurityStatus {
  version: string;
  isRunning: boolean;
  ruleCount: number;
  alertCount: number;
  stats?: string;
}

interface Rule {
  action: string;
  message: string;
  sid: string;
  classtype: string;
  raw: string;
}

interface SecurityAlert {
  id: number;
  timestamp: string;
  message: string;
  severity: number;
  acknowledged: boolean;
  metadata?: {
    sourceIP?: string;
    destinationIP?: string;
    alertCategory?: string;
    blockedIP?: string;
    reason?: string;
  };
}

interface BlockedIP {
  ip: string;
  timeout: string;
  comment: string;
  dynamic: boolean;
}

const SecurityDashboard = () => {
  const [status, setStatus] = useState<SecurityStatus | null>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
  const [devices, setDevices] = useState<any[]>([]);

  const fetchSecurityStatus = async () => {
    try {
      const { data } = await axios.get('/api/security/status');
      setStatus(data);
    } catch (error) {
      console.error('Lỗi khi lấy trạng thái bảo mật:', error);
      toast.error('Không thể lấy trạng thái hệ thống bảo mật');
    }
  };

  const fetchRules = async () => {
    try {
      const { data } = await axios.get('/api/security/rules');
      setRules(data.rules || []);
    } catch (error) {
      console.error('Lỗi khi lấy quy tắc bảo mật:', error);
      toast.error('Không thể lấy danh sách quy tắc bảo mật');
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data } = await axios.get('/api/security/alerts');
      setAlerts(data.alerts || []);
    } catch (error) {
      console.error('Lỗi khi lấy cảnh báo bảo mật:', error);
      toast.error('Không thể lấy danh sách cảnh báo bảo mật');
    }
  };

  const fetchBlockedIPs = async (deviceId: number) => {
    try {
      const { data } = await axios.get(`/api/security/blocked-ips?deviceId=${deviceId}`);
      setBlockedIPs(data.blockedIPs || []);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách IP bị chặn:', error);
      toast.error('Không thể lấy danh sách IP bị chặn');
    }
  };

  const fetchDevices = async () => {
    try {
      const { data } = await axios.get('/api/devices');
      setDevices(data);
      if (data.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(data[0].id);
      }
    } catch (error) {
      console.error('Lỗi khi lấy thiết bị:', error);
      toast.error('Không thể lấy danh sách thiết bị');
    }
  };

  const startMonitoring = async () => {
    try {
      const { data } = await axios.post('/api/security/start');
      if (data.success) {
        toast.success('Đã bật giám sát bảo mật');
        fetchSecurityStatus();
      }
    } catch (error) {
      console.error('Lỗi khi bật giám sát bảo mật:', error);
      toast.error('Không thể bật giám sát bảo mật');
    }
  };

  const stopMonitoring = async () => {
    try {
      const { data } = await axios.post('/api/security/stop');
      if (data.success) {
        toast.success('Đã tắt giám sát bảo mật');
        fetchSecurityStatus();
      }
    } catch (error) {
      console.error('Lỗi khi tắt giám sát bảo mật:', error);
      toast.error('Không thể tắt giám sát bảo mật');
    }
  };

  const acknowledgeAlert = async (id: number) => {
    try {
      const { data } = await axios.post(`/api/security/alerts/${id}/acknowledge`);
      if (data.success) {
        toast.success('Đã xác nhận cảnh báo');
        fetchAlerts();
      }
    } catch (error) {
      console.error('Lỗi khi xác nhận cảnh báo:', error);
      toast.error('Không thể xác nhận cảnh báo');
    }
  };

  const acknowledgeAllAlerts = async () => {
    try {
      const { data } = await axios.post('/api/security/alerts/acknowledge-all');
      if (data.success) {
        toast.success(`Đã xác nhận ${data.message}`);
        fetchAlerts();
      }
    } catch (error) {
      console.error('Lỗi khi xác nhận tất cả cảnh báo:', error);
      toast.error('Không thể xác nhận tất cả cảnh báo');
    }
  };

  const unblockIP = async (ip: string) => {
    try {
      if (!selectedDeviceId) return;
      
      const { data } = await axios.post('/api/security/unblock-ip', {
        deviceId: selectedDeviceId,
        ip
      });
      
      if (data.success) {
        toast.success(`Đã gỡ bỏ chặn IP ${ip}`);
        fetchBlockedIPs(selectedDeviceId);
      }
    } catch (error) {
      console.error('Lỗi khi gỡ bỏ chặn IP:', error);
      toast.error('Không thể gỡ bỏ chặn IP');
    }
  };
  
  const processAlerts = async () => {
    try {
      const { data } = await axios.post('/api/security/process-alerts');
      if (data.success) {
        toast.success('Đã xử lý cảnh báo thành công');
        fetchAlerts();
        if (selectedDeviceId) {
          fetchBlockedIPs(selectedDeviceId);
        }
      }
    } catch (error) {
      console.error('Lỗi khi xử lý cảnh báo:', error);
      toast.error('Không thể xử lý cảnh báo');
    }
  };

  const refreshData = () => {
    setLoading(true);
    Promise.all([
      fetchSecurityStatus(),
      fetchRules(),
      fetchAlerts(),
      selectedDeviceId ? fetchBlockedIPs(selectedDeviceId) : Promise.resolve()
    ]).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchDevices();
    refreshData();
    
    // Cập nhật dữ liệu mỗi 30 giây
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);
  
  useEffect(() => {
    if (selectedDeviceId) {
      fetchBlockedIPs(selectedDeviceId);
    }
  }, [selectedDeviceId]);

  const getSeverityBadge = (severity: number) => {
    switch (severity) {
      case 1:
        return <Badge variant="destructive">Nghiêm trọng</Badge>;
      case 2:
        return <Badge variant="warning">Cảnh báo</Badge>;
      default:
        return <Badge variant="secondary">Thông tin</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bảo mật mạng</h1>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshData}
          >
            <ReloadIcon className="mr-2 h-4 w-4" />
            Làm mới
          </Button>
        </div>
      </div>
      
      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-[200px] w-full" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      ) : (
        <>
          {status && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Trạng thái hệ thống bảo mật</span>
                  <div>
                    {status.isRunning ? (
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={stopMonitoring}
                      >
                        <Cross2Icon className="mr-2 h-4 w-4" />
                        Dừng giám sát
                      </Button>
                    ) : (
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={startMonitoring}
                      >
                        <RocketIcon className="mr-2 h-4 w-4" />
                        Bắt đầu giám sát
                      </Button>
                    )}
                  </div>
                </CardTitle>
                <CardDescription>
                  Suricata {status.version}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-sm font-medium">Trạng thái</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      {status.isRunning ? (
                        <div className="flex items-center space-x-2 text-green-600">
                          <CheckIcon />
                          <span>Đang hoạt động</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2 text-red-600">
                          <Cross2Icon />
                          <span>Đang dừng</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-sm font-medium">Quy tắc</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="text-2xl font-bold">{status.ruleCount}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="py-4">
                      <CardTitle className="text-sm font-medium">Cảnh báo</CardTitle>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="text-2xl font-bold">{status.alertCount}</div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full md:w-auto md:inline-grid grid-cols-3 mb-4">
              <TabsTrigger value="overview">Tổng quan</TabsTrigger>
              <TabsTrigger value="alerts">Cảnh báo</TabsTrigger>
              <TabsTrigger value="blocked">IP bị chặn</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="space-y-4">
              <Alert>
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Bảo mật mạng</AlertTitle>
                <AlertDescription>
                  Hệ thống bảo mật mạng tích hợp sử dụng Suricata để phát hiện và ngăn chặn các mối đe dọa tiềm ẩn.
                </AlertDescription>
              </Alert>
              
              <Card>
                <CardHeader>
                  <CardTitle>Quy tắc bảo mật</CardTitle>
                  <CardDescription>
                    Danh sách các quy tắc phát hiện mối đe dọa
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {rules.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Hành động</TableHead>
                          <TableHead>Mô tả</TableHead>
                          <TableHead>Phân loại</TableHead>
                          <TableHead>ID</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rules.slice(0, 10).map((rule) => (
                          <TableRow key={rule.sid}>
                            <TableCell>
                              <Badge variant={rule.action === 'alert' ? 'outline' : rule.action === 'drop' ? 'destructive' : 'default'}>
                                {rule.action}
                              </Badge>
                            </TableCell>
                            <TableCell>{rule.message}</TableCell>
                            <TableCell>{rule.classtype}</TableCell>
                            <TableCell>{rule.sid}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center p-4">
                      <p>Không có quy tắc nào được cấu hình.</p>
                    </div>
                  )}
                  
                  {rules.length > 10 && (
                    <div className="text-center mt-4">
                      <Button variant="outline" size="sm" onClick={() => setActiveTab('rules')}>
                        Xem tất cả ({rules.length}) quy tắc
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <div className="flex flex-col space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Thao tác</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        variant="outline" 
                        onClick={processAlerts}
                      >
                        <RocketIcon className="mr-2 h-4 w-4" />
                        Xử lý cảnh báo
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={acknowledgeAllAlerts}
                      >
                        <CheckIcon className="mr-2 h-4 w-4" />
                        Xác nhận tất cả cảnh báo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="alerts" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Cảnh báo bảo mật</h2>
                
                <Button variant="outline" size="sm" onClick={acknowledgeAllAlerts}>
                  <CheckIcon className="mr-2 h-4 w-4" />
                  Xác nhận tất cả
                </Button>
              </div>
              
              {alerts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Thời gian</TableHead>
                      <TableHead>Mô tả</TableHead>
                      <TableHead>Mức độ</TableHead>
                      <TableHead>Chi tiết</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alerts.map((alert) => (
                      <TableRow key={alert.id}>
                        <TableCell>
                          {new Date(alert.timestamp).toLocaleDateString()} {new Date(alert.timestamp).toLocaleTimeString()}
                        </TableCell>
                        <TableCell>{alert.message}</TableCell>
                        <TableCell>{getSeverityBadge(alert.severity)}</TableCell>
                        <TableCell>
                          {alert.metadata?.sourceIP && (
                            <div>IP nguồn: {alert.metadata.sourceIP}</div>
                          )}
                          {alert.metadata?.destinationIP && (
                            <div>IP đích: {alert.metadata.destinationIP}</div>
                          )}
                          {alert.metadata?.alertCategory && (
                            <div>Loại: {alert.metadata.alertCategory}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          {!alert.acknowledged && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => acknowledgeAlert(alert.id)}
                            >
                              <CheckIcon className="h-4 w-4" />
                              <span className="sr-only">Xác nhận</span>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-4 border rounded-md">
                  <p>Không có cảnh báo bảo mật nào.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="blocked" className="space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">IP bị chặn</h2>
                
                {devices.length > 0 && (
                  <select 
                    value={selectedDeviceId || ''}
                    onChange={(e) => setSelectedDeviceId(Number(e.target.value))}
                    className="px-3 py-2 border rounded-md"
                  >
                    {devices.map(device => (
                      <option key={device.id} value={device.id}>
                        {device.name} ({device.ipAddress})
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              {blockedIPs.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Địa chỉ IP</TableHead>
                      <TableHead>Thời gian hết hạn</TableHead>
                      <TableHead>Lý do chặn</TableHead>
                      <TableHead>Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blockedIPs.map((ip) => (
                      <TableRow key={ip.ip}>
                        <TableCell>{ip.ip}</TableCell>
                        <TableCell>{ip.timeout || 'Vĩnh viễn'}</TableCell>
                        <TableCell>{ip.comment || 'N/A'}</TableCell>
                        <TableCell>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => unblockIP(ip.ip)}
                          >
                            <Cross2Icon className="h-4 w-4" />
                            <span className="sr-only">Gỡ bỏ chặn</span>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center p-4 border rounded-md">
                  <p>Không có IP nào đang bị chặn.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
};

export default SecurityDashboard;