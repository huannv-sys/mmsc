import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { CapsmanAP } from '@shared/schema';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from '@/components/ui/hover-card';
import { Badge } from '@/components/ui/badge';
import { 
  WifiIcon, 
  SignalIcon, 
  InfoIcon, 
  ServerIcon,
  BarChart4Icon,
  UsersIcon,
  RouterIcon
} from 'lucide-react';
import { LoadingAnimation } from '@/components/ui/loading-animation';
import { SkeletonPulse } from '@/components/ui/skeleton-pulse';
import ClientsList from './ClientsList';

interface CapsmanDetailProps {
  deviceId: number | null;
  apId: number | null;
}

export default function CapsmanDetail({ deviceId, apId }: CapsmanDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: capsmanAP, isLoading, isRefetching, isError, refetch } = useQuery<any>({
    queryKey: ['/api/capsman', apId],
    queryFn: async () => {
      const res = await apiRequest('GET', `/api/capsman/${apId}`);
      return res.json();
    },
    enabled: !!apId,
  });

  // Get status badge with animation
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'running':
        return (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Badge className="bg-green-500">
              <motion.span
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="inline-block h-1.5 w-1.5 rounded-full bg-white mr-1.5"
              />
              Hoạt động
            </Badge>
          </motion.div>
        );
      case 'disabled':
        return (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Badge className="bg-gray-400 text-white">Vô hiệu hóa</Badge>
          </motion.div>
        );
      default:
        return (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
          >
            <Badge className="bg-gray-400 text-white">{status || 'Không xác định'}</Badge>
          </motion.div>
        );
    }
  };

  // Render loading skeleton
  const renderDetailSkeleton = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <SkeletonPulse width={250} height={28} />
          <SkeletonPulse width={150} height={16} />
        </div>
        <SkeletonPulse width={80} height={28} borderRadius="0.375rem" />
      </div>
      
      <div className="mt-4">
        <SkeletonPulse width={300} height={36} />
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="border rounded-lg p-4 space-y-3">
            <SkeletonPulse width={100} height={16} />
            <SkeletonPulse width="100%" height={40} />
          </div>
          <div className="border rounded-lg p-4 space-y-3">
            <SkeletonPulse width={80} height={16} />
            <SkeletonPulse width="100%" height={40} />
          </div>
          <div className="border rounded-lg p-4 space-y-3">
            <SkeletonPulse width={120} height={16} />
            <SkeletonPulse width="100%" height={40} />
          </div>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="space-y-2 mb-4">
          <SkeletonPulse width={150} height={20} />
          <SkeletonPulse width="100%" height={200} />
        </div>
      </div>
    </div>
  );

  // Render empty state if no AP data is available
  const renderEmptyState = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-10"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="bg-gray-100 dark:bg-gray-800 rounded-full p-6 mb-4"
      >
        <WifiIcon className="h-12 w-12 text-gray-400 dark:text-gray-500" />
      </motion.div>
      <motion.h3
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="text-xl font-semibold mb-2"
      >
        Không tìm thấy điểm truy cập
      </motion.h3>
      <motion.p
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="text-gray-500 dark:text-gray-400 text-center max-w-md mb-6"
      >
        Không tìm thấy thông tin hoặc điểm truy cập không tồn tại trên hệ thống.
      </motion.p>
      {isError && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-md"
        >
          Thử lại
        </motion.button>
      )}
    </motion.div>
  );

  // Return loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center">
            <WifiIcon className="h-5 w-5 mr-2" />
            <LoadingAnimation variant="dots" text="Đang tải thông tin điểm truy cập..." className="ml-2" />
          </div>
        </CardHeader>
        <CardContent>
          {renderDetailSkeleton()}
        </CardContent>
      </Card>
    );
  }

  // Return no data state
  if (!capsmanAP) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiIcon className="h-4 w-4" />
            Không tìm thấy thông tin điểm truy cập
          </CardTitle>
          <CardDescription>
            Không tìm thấy thông tin hoặc điểm truy cập không tồn tại
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderEmptyState()}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
            >
              <CardTitle className="flex items-center gap-2">
                <RouterIcon className="h-5 w-5 text-blue-500" />
                {capsmanAP.name || 'Access Point không xác định'}
              </CardTitle>
              <CardDescription>
                {capsmanAP.identity || 'ID không xác định'} | MAC: {capsmanAP.macAddress}
              </CardDescription>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            {getStatusBadge(capsmanAP.state)}
          </motion.div>
        </div>
        {isRefetching && (
          <div className="absolute top-4 right-4">
            <LoadingAnimation variant="dots" size={4} />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 grid w-full grid-cols-3">
            <TabsTrigger className="flex items-center gap-2" value="overview">
              <InfoIcon className="h-4 w-4" />
              <span>Tổng quan</span>
            </TabsTrigger>
            <TabsTrigger className="flex items-center gap-2" value="performance">
              <BarChart4Icon className="h-4 w-4" />
              <span>Hiệu suất</span>
            </TabsTrigger>
            <TabsTrigger className="flex items-center gap-2" value="clients">
              <UsersIcon className="h-4 w-4" />
              <span>Người dùng ({capsmanAP.clients || 0})</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2">
              <motion.div
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <motion.div 
                  className="grid grid-cols-2 gap-4"
                  variants={{
                    hidden: { opacity: 0 },
                    show: { opacity: 1 }
                  }}
                  initial="hidden"
                  animate="show"
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Trạng thái</h4>
                    <div className="flex items-center gap-2">
                      <motion.div 
                        className={`h-2 w-2 rounded-full ${
                          capsmanAP.state === 'running' ? 'bg-green-500' : 'bg-red-500'
                        }`}
                        animate={
                          capsmanAP.state === 'running'
                            ? { 
                                scale: [1, 1.5, 1],
                                opacity: [0.7, 1, 0.7],
                              } 
                            : {}
                        }
                        transition={{ 
                          duration: 2, 
                          repeat: Infinity, 
                        }}
                      />
                      <span>{capsmanAP.state || 'Không xác định'}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Địa chỉ IP</h4>
                    <p>{capsmanAP.ipAddress || 'Không xác định'}</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                >
                  <h4 className="text-sm font-medium">Thông tin thiết bị</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Model:</span>
                      <p>{capsmanAP.model || 'Không xác định'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phiên bản:</span>
                      <p>{capsmanAP.version || 'Không xác định'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Serial Number:</span>
                      <p>{capsmanAP.serialNumber || 'Không xác định'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Uptime:</span>
                      <p>{capsmanAP.uptime || 'Không xác định'}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <h4 className="text-sm font-medium">Radio</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Radio Name:</span>
                      <p>{capsmanAP.radioName || 'Không xác định'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Radio MAC:</span>
                      <p>{capsmanAP.radioMac || 'Không xác định'}</p>
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div 
                className="space-y-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <motion.div 
                  className="space-y-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                >
                  <h4 className="text-sm font-medium">Thông tin kết nối</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Lần kết nối cuối:</span>
                      <p>
                        {capsmanAP.lastSeen 
                          ? format(new Date(capsmanAP.lastSeen), 'dd/MM/yyyy HH:mm:ss')
                          : 'Không xác định'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Số người dùng:</span>
                      <p>{capsmanAP.clients || 0}</p>
                    </div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="rounded-md border p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <div className="flex flex-col gap-4">
                    <motion.div 
                      className="flex justify-between"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.4 }}
                    >
                      <div>
                        <h4 className="text-sm font-medium">Tín hiệu</h4>
                        <p className="text-sm text-muted-foreground">Cường độ tín hiệu</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.5
                          }}
                        >
                          <SignalIcon className="h-5 w-5 text-blue-500" />
                        </motion.div>
                        <motion.span 
                          className="font-medium"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.6 }}
                        >
                          {capsmanAP.signalStrength !== undefined 
                            ? `${capsmanAP.signalStrength} dBm` 
                            : 'N/A'}
                        </motion.span>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="flex justify-between"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.5 }}
                    >
                      <div>
                        <h4 className="text-sm font-medium">Kênh/Tần số</h4>
                        <p className="text-sm text-muted-foreground">Kênh và tần số hoạt động</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.6
                          }}
                        >
                          <WifiIcon className="h-5 w-5 text-blue-500" />
                        </motion.div>
                        <motion.span 
                          className="font-medium"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.7 }}
                        >
                          {capsmanAP.channel || 'N/A'} 
                          {capsmanAP.frequency ? ` (${capsmanAP.frequency} MHz)` : ''}
                        </motion.span>
                      </div>
                    </motion.div>
                    
                    <motion.div 
                      className="flex justify-between"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: 0.6 }}
                    >
                      <div>
                        <h4 className="text-sm font-medium">Tốc độ</h4>
                        <p className="text-sm text-muted-foreground">Tốc độ truyền/nhận dữ liệu</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 260,
                            damping: 20,
                            delay: 0.7
                          }}
                        >
                          <ServerIcon className="h-5 w-5 text-blue-500" />
                        </motion.div>
                        <motion.div 
                          className="text-right"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.3, delay: 0.8 }}
                        >
                          <div className="font-medium">TX: {capsmanAP.txRate || 'N/A'}</div>
                          <div className="font-medium">RX: {capsmanAP.rxRate || 'N/A'}</div>
                        </motion.div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </TabsContent>
          
          <TabsContent value="performance">
            <motion.div 
              className="space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="grid gap-4 md:grid-cols-2"
                initial={{ y: 20 }}
                animate={{ y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <motion.div 
                  className="rounded-md border p-4"
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  whileHover={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                >
                  <div className="space-y-2">
                    <motion.h3 
                      className="text-sm font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.3 }}
                    >
                      Thông số vô tuyến
                    </motion.h3>
                    <motion.div 
                      className="grid grid-cols-2 gap-2 text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.4 }}
                    >
                      <div>
                        <span className="text-muted-foreground">Tín hiệu:</span>
                        <p>{capsmanAP.signalStrength !== undefined ? `${capsmanAP.signalStrength} dBm` : 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Nhiễu:</span>
                        <p>{capsmanAP.noiseFloor !== undefined ? `${capsmanAP.noiseFloor} dBm` : 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Khoảng cách:</span>
                        <p>{capsmanAP.distance || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">CCQ:</span>
                        <p>{capsmanAP.ccq !== undefined ? `${capsmanAP.ccq}%` : 'N/A'}</p>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>
                
                <motion.div 
                  className="rounded-md border p-4"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  whileHover={{ boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                >
                  <div className="space-y-2">
                    <motion.h3 
                      className="text-sm font-medium"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.4 }}
                    >
                      Hiệu suất truyền dữ liệu
                    </motion.h3>
                    <motion.div 
                      className="grid grid-cols-2 gap-2 text-sm"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.5 }}
                    >
                      <div>
                        <span className="text-muted-foreground">Tốc độ TX:</span>
                        <p>{capsmanAP.txRate || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Tốc độ RX:</span>
                        <p>{capsmanAP.rxRate || 'N/A'}</p>
                      </div>
                    </motion.div>
                    <motion.div 
                      className="pt-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: 0.6 }}
                    >
                      <p className="text-xs text-muted-foreground">
                        Chưa có dữ liệu thống kê hiệu suất theo thời gian cho Access Point này.
                      </p>
                    </motion.div>
                  </div>
                </motion.div>
              </motion.div>
            </motion.div>
          </TabsContent>
          
          <TabsContent value="clients">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <ClientsList apId={apId} apName={capsmanAP.name} />
            </motion.div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}