import React, { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CapsmanClient } from "@shared/schema";
import { motion, AnimatePresence } from "framer-motion";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  InfoIcon,
  SignalIcon,
  WifiIcon,
  UserIcon,
  Search,
  Filter,
  X,
} from "lucide-react";
import { LoadingAnimation } from "@/components/ui/loading-animation";
import { SkeletonPulse, SkeletonTable } from "@/components/ui/skeleton-pulse";
import { LoadingContainer } from "@/components/ui/loading-animation";

interface ClientsListProps {
  apId: number | null;
  apName?: string;
}

export default function ClientsList({ apId, apName }: ClientsListProps) {
  // All state hooks first
  const [expandedClientId, setExpandedClientId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [signalFilter, setSignalFilter] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);

  // Data fetching hook
  const {
    data: clients,
    isLoading,
    isRefetching,
  } = useQuery<any[]>({
    queryKey: ["/api/capsman", apId, "clients"],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/capsman/${apId}/clients`);
      return res.json();
    },
    enabled: !!apId,
  });

  // Callback hooks for signal-related functions
  const getSignalQuality = useCallback((signalStrength: number | null) => {
    if (signalStrength === null) return "unknown";
    if (signalStrength > -50) return "excellent";
    if (signalStrength > -60) return "good";
    if (signalStrength > -70) return "fair";
    if (signalStrength > -80) return "poor";
    return "bad";
  }, []);

  const getSignalColor = useCallback((signalStrength: number | null) => {
    if (signalStrength === null) return "text-gray-400";

    if (signalStrength > -50) return "text-green-500";
    if (signalStrength > -60) return "text-green-400";
    if (signalStrength > -70) return "text-yellow-400";
    if (signalStrength > -80) return "text-orange-400";
    return "text-red-500";
  }, []);

  // Callback for filter reset
  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setSignalFilter("all");
  }, []);

  // Memoized filtered clients
  const filteredClients = useMemo(() => {
    if (!clients || clients.length === 0) {
      return [];
    }

    return clients.filter((client) => {
      // Text search filter for hostname/IP
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        query === "" ||
        (client.hostname && client.hostname.toLowerCase().includes(query)) ||
        (client.ipAddress && client.ipAddress.toLowerCase().includes(query)) ||
        (client.macAddress && client.macAddress.toLowerCase().includes(query));

      // Signal quality filter
      const signalQuality = getSignalQuality(client.signalStrength);
      const matchesSignal =
        signalFilter === "all" || signalFilter === signalQuality;

      return matchesSearch && matchesSignal;
    });
  }, [clients, searchQuery, signalFilter, getSignalQuality]);

  // Loading skeleton component
  const renderLoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SkeletonPulse width={200} height={24} />
        <SkeletonPulse width={120} height={18} />
      </div>

      <div className="mt-6 space-y-1">
        <SkeletonPulse width={100} height={20} className="mb-4" />
      </div>

      <div className="space-y-6 mt-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SkeletonPulse width={36} height={36} borderRadius="50%" />
              <div className="space-y-2">
                <SkeletonPulse width={160} height={16} />
                <SkeletonPulse width={120} height={12} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <SkeletonPulse width={80} height={24} />
              <SkeletonPulse width={60} height={24} />
              <SkeletonPulse width={32} height={32} borderRadius="50%" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // Empty clients state component
  const renderEmptyState = () => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="p-8 flex flex-col items-center justify-center"
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <WifiIcon className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
      </motion.div>
      <motion.h3
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2"
      >
        Không có kết nối
      </motion.h3>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md"
      >
        Không có người dùng nào kết nối với {apName || "điểm truy cập này"} tại
        thời điểm hiện tại.
      </motion.p>
    </motion.div>
  );

  // Loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <LoadingAnimation
            variant="dots"
            text="Đang tải danh sách người dùng kết nối..."
          />
        </CardHeader>
        <CardContent>{renderLoadingSkeleton()}</CardContent>
      </Card>
    );
  }

  // No clients state
  if (!clients || clients.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiIcon className="h-4 w-4" />
            {apName ? `Người dùng kết nối - ${apName}` : "Người dùng kết nối"}
          </CardTitle>
          <CardDescription>
            Không có người dùng nào kết nối với điểm truy cập này
          </CardDescription>
        </CardHeader>
        <CardContent>{renderEmptyState()}</CardContent>
      </Card>
    );
  }

  // Render the clients table
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <WifiIcon className="h-4 w-4" />
              {apName ? `Người dùng kết nối - ${apName}` : "Người dùng kết nối"}
            </CardTitle>
            <CardDescription>
              {filteredClients.length} người dùng đang kết nối
            </CardDescription>
          </div>
          {isRefetching && (
            <LoadingAnimation variant="dots" size={6} className="ml-2" />
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter controls */}
        <motion.div
          className="flex gap-2 mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "text-primary" : ""}
          >
            <Filter className="h-4 w-4 mr-1" />
            Lọc
          </Button>

          {(searchQuery || signalFilter !== "all") && (
            <Button variant="ghost" size="sm" onClick={resetFilters}>
              <X className="h-4 w-4 mr-1" />
              Xóa bộ lọc
            </Button>
          )}
        </motion.div>

        {/* Filter panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              className="p-3 bg-gray-100 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 mb-4 grid grid-cols-1 md:grid-cols-2 gap-3"
              initial={{ opacity: 0, height: 0, marginBottom: 0 }}
              animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Tìm kiếm
                </label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="text"
                    placeholder="Tên, IP, MAC..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex flex-col">
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Chất lượng tín hiệu
                </label>
                <Select value={signalFilter} onValueChange={setSignalFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Tất cả tín hiệu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả tín hiệu</SelectItem>
                    <SelectItem value="excellent">
                      Xuất sắc (&gt; -50 dBm)
                    </SelectItem>
                    <SelectItem value="good">Tốt (-50 đến -60 dBm)</SelectItem>
                    <SelectItem value="fair">
                      Trung bình (-60 đến -70 dBm)
                    </SelectItem>
                    <SelectItem value="poor">Kém (-70 đến -80 dBm)</SelectItem>
                    <SelectItem value="bad">Yếu (&lt; -80 dBm)</SelectItem>
                    <SelectItem value="unknown">Không xác định</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clients table with animations */}
        <LoadingContainer
          isLoading={isRefetching}
          loadingContent={renderLoadingSkeleton()}
          className="min-h-[300px]"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên/IP</TableHead>
                <TableHead>Kết nối</TableHead>
                <TableHead>Tín hiệu</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredClients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <motion.div
                      className="flex flex-col items-center justify-center gap-1"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <WifiIcon className="h-8 w-8 text-gray-400 dark:text-gray-600" />
                      {searchQuery ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Không tìm thấy kết quả nào cho "{searchQuery}"
                        </p>
                      ) : signalFilter !== "all" ? (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Không có thiết bị nào với mức tín hiệu đã chọn
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Không có thiết bị nào đang kết nối
                        </p>
                      )}
                    </motion.div>
                  </TableCell>
                </TableRow>
              ) : (
                <AnimatePresence>
                  {filteredClients.map((client, index) => (
                    <motion.tr
                      key={client.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                      }}
                      className="border-b dark:border-gray-700"
                    >
                      <TableCell className="font-medium py-3">
                        <div className="flex items-center gap-2">
                          <UserIcon className="h-4 w-4 text-blue-500" />
                          <div>
                            <div>{client.hostname || "Không xác định"}</div>
                            <div className="text-xs text-muted-foreground">
                              {client.ipAddress || "Không xác định"}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <motion.div
                          className="flex items-center gap-2"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Badge className="bg-blue-500/10 text-blue-500">
                            {client.interface || "wlan0"}
                          </Badge>
                        </motion.div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <motion.div
                            animate={{
                              scale: [1, 1.1, 1],
                              opacity: [0.5, 1, 0.5],
                            }}
                            transition={{
                              duration: 3,
                              repeat: Infinity,
                              repeatType: "mirror",
                            }}
                          >
                            <SignalIcon
                              className={`h-4 w-4 ${getSignalColor(client.signalStrength)}`}
                            />
                          </motion.div>
                          <span>{client.signalStrength || "N/A"} dBm</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.connectedTime || "Không xác định"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Popover>
                          <PopoverTrigger asChild>
                            <motion.button
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 text-primary-foreground h-8 w-8 p-0"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              <InfoIcon className="h-4 w-4" />
                            </motion.button>
                          </PopoverTrigger>
                          <PopoverContent className="w-80">
                            <div className="grid gap-4">
                              <div className="space-y-2">
                                <h4 className="font-medium leading-none">
                                  Chi tiết kết nối
                                </h4>
                                <p className="text-sm text-muted-foreground">
                                  Thông tin chi tiết về thiết bị đang kết nối
                                </p>
                              </div>
                              <div className="grid gap-2">
                                <div className="grid grid-cols-3 items-center gap-4">
                                  <span className="text-sm">MAC Address:</span>
                                  <span className="col-span-2 text-sm font-medium">
                                    {client.macAddress}
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                  <span className="text-sm">Tốc độ TX:</span>
                                  <span className="col-span-2 text-sm font-medium">
                                    {client.txRate || "Không xác định"}
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                  <span className="text-sm">Tốc độ RX:</span>
                                  <span className="col-span-2 text-sm font-medium">
                                    {client.rxRate || "Không xác định"}
                                  </span>
                                </div>
                                <div className="grid grid-cols-3 items-center gap-4">
                                  <span className="text-sm">Người dùng:</span>
                                  <span className="col-span-2 text-sm font-medium">
                                    {client.username || "Không xác định"}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </TableCell>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </TableBody>
          </Table>
        </LoadingContainer>
      </CardContent>
    </Card>
  );
}
