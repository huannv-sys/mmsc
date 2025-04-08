import React, { useState, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  ShieldCheck,
  ShieldAlert,
  Activity,
  ArrowLeftRight,
  List,
  Router,
  Layers,
  Filter,
  TriangleAlert,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  getAllRules,
  getFirewallRules,
  getNatRules,
  getMangleRules,
  getQueueRules,
  getRoutingRules,
} from "@/services/rules";
import { isDisabled } from "@/utils/mikrotik-helpers";

interface RulesListProps {
  deviceId: string;
}

interface Rule {
  id?: string;
  action?: string;
  chain?: string;
  comment?: string;
  disabled?: boolean;
  src?: string;
  dst?: string;
  protocol?: string;
  dstPort?: string;
  srcPort?: string;
  name?: string;
  target?: string;
  targetScope?: string;
  type?: string;
  [key: string]: any; // Để hỗ trợ các trường khác có thể có
}

type RuleType = "firewall" | "nat" | "mangle" | "queue" | "routing" | "all";

export const RulesList: React.FC<RulesListProps> = ({ deviceId }) => {
  const [activeTab, setActiveTab] = useState<RuleType>("all");
  const [rules, setRules] = useState<any>({
    firewall: [],
    nat: [],
    mangle: [],
    queues: { simpleQueues: [], treeQueues: [] },
    routing: { routes: [], bgp: [], ospf: [] },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await getAllRules(deviceId);

        if (response.success && response.data) {
          setRules(response.data);
        } else {
          setError(response.message || "Không thể lấy dữ liệu quy tắc");
        }
      } catch (err) {
        setError(
          "Lỗi khi tải dữ liệu: " + ((err as Error).message || String(err)),
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, [deviceId]);

  const fetchSpecificRules = async (type: RuleType) => {
    try {
      setLoading(true);
      setError(null);

      let response;

      switch (type) {
        case "firewall":
          response = await getFirewallRules(deviceId);
          if (response.success) {
            setRules((prev) => ({ ...prev, firewall: response.data }));
          }
          break;
        case "nat":
          response = await getNatRules(deviceId);
          if (response.success) {
            setRules((prev) => ({ ...prev, nat: response.data }));
          }
          break;
        case "mangle":
          response = await getMangleRules(deviceId);
          if (response.success) {
            setRules((prev) => ({ ...prev, mangle: response.data }));
          }
          break;
        case "queue":
          response = await getQueueRules(deviceId);
          if (response.success) {
            setRules((prev) => ({ ...prev, queues: response.data }));
          }
          break;
        case "routing":
          response = await getRoutingRules(deviceId);
          if (response.success) {
            setRules((prev) => ({ ...prev, routing: response.data }));
          }
          break;
        case "all":
          response = await getAllRules(deviceId);
          if (response.success) {
            setRules(response.data);
          }
          break;
      }

      if (response && !response.success) {
        setError(response.message || `Không thể lấy quy tắc ${type}`);
      }
    } catch (err) {
      setError(
        "Lỗi khi tải dữ liệu: " + ((err as Error).message || String(err)),
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (type: RuleType) => {
    setActiveTab(type);
    // Nếu chưa có dữ liệu hoặc dữ liệu trống, thì fetch lại
    if (
      (type === "firewall" &&
        (!rules.firewall || rules.firewall.length === 0)) ||
      (type === "nat" && (!rules.nat || rules.nat.length === 0)) ||
      (type === "mangle" && (!rules.mangle || rules.mangle.length === 0)) ||
      (type === "queue" &&
        (!rules.queues?.simpleQueues ||
          rules.queues.simpleQueues.length === 0)) ||
      (type === "routing" &&
        (!rules.routing?.routes || rules.routing.routes.length === 0))
    ) {
      fetchSpecificRules(type);
    }
  };

  const getStatusBadge = (disabled?: boolean | string) => {
    // Sử dụng hàm isDisabled từ utils
    if (isDisabled(disabled)) {
      return (
        <Badge variant="outline" className="bg-gray-100">
          Vô hiệu
        </Badge>
      );
    } else {
      return <Badge variant="success">Hoạt động</Badge>;
    }
  };

  const getActionBadge = (action?: string) => {
    if (!action) return null;

    const actionMap: { [key: string]: { variant: string; label: string } } = {
      accept: { variant: "success", label: "Accept" },
      drop: { variant: "destructive", label: "Drop" },
      reject: { variant: "destructive", label: "Reject" },
      dstnat: { variant: "outline", label: "Dst NAT" },
      srcnat: { variant: "outline", label: "Src NAT" },
      masquerade: { variant: "outline", label: "Masquerade" },
      mark: { variant: "outline", label: "Mark" },
      return: { variant: "info", label: "Return" },
      jump: { variant: "warning", label: "Jump" },
      log: { variant: "info", label: "Log" },
    };

    const config = actionMap[action.toLowerCase()] || {
      variant: "default",
      label: action,
    };

    return <Badge variant={config.variant as any}>{config.label}</Badge>;
  };

  const renderFirewallRules = () => {
    if (!rules.firewall || rules.firewall.length === 0) {
      return (
        <Alert variant="info">
          <Activity className="h-4 w-4" />
          <AlertTitle>Không có quy tắc</AlertTitle>
          <AlertDescription>
            Không tìm thấy quy tắc firewall nào được cấu hình trên thiết bị này.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chain</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Src Address</TableHead>
            <TableHead>Dst Address</TableHead>
            <TableHead>Protocol</TableHead>
            <TableHead>Comment</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.firewall.map((rule: Rule, index: number) => (
            <TableRow key={rule.id || index}>
              <TableCell>{rule.chain || "-"}</TableCell>
              <TableCell>{getActionBadge(rule.action)}</TableCell>
              <TableCell>{rule["src-address"] || "-"}</TableCell>
              <TableCell>{rule["dst-address"] || "-"}</TableCell>
              <TableCell>{rule.protocol || "-"}</TableCell>
              <TableCell>{rule.comment || "-"}</TableCell>
              <TableCell>{getStatusBadge(rule.disabled)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderNatRules = () => {
    if (!rules.nat || rules.nat.length === 0) {
      return (
        <Alert variant="info">
          <ArrowLeftRight className="h-4 w-4" />
          <AlertTitle>Không có quy tắc</AlertTitle>
          <AlertDescription>
            Không tìm thấy quy tắc NAT nào được cấu hình trên thiết bị này.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chain</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Src Address</TableHead>
            <TableHead>Dst Address</TableHead>
            <TableHead>To Addresses</TableHead>
            <TableHead>Proto/Port</TableHead>
            <TableHead>Comment</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.nat.map((rule: Rule, index: number) => (
            <TableRow key={rule.id || index}>
              <TableCell>{rule.chain || "-"}</TableCell>
              <TableCell>{getActionBadge(rule.action)}</TableCell>
              <TableCell>{rule["src-address"] || "-"}</TableCell>
              <TableCell>{rule["dst-address"] || "-"}</TableCell>
              <TableCell>{rule["to-addresses"] || "-"}</TableCell>
              <TableCell>
                {rule.protocol || "-"}
                {rule["dst-port"] ? `:${rule["dst-port"]}` : ""}
              </TableCell>
              <TableCell>{rule.comment || "-"}</TableCell>
              <TableCell>{getStatusBadge(rule.disabled)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderMangleRules = () => {
    if (!rules.mangle || rules.mangle.length === 0) {
      return (
        <Alert variant="info">
          <List className="h-4 w-4" />
          <AlertTitle>Không có quy tắc</AlertTitle>
          <AlertDescription>
            Không tìm thấy quy tắc mangle nào được cấu hình trên thiết bị này.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Chain</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Src Address</TableHead>
            <TableHead>Dst Address</TableHead>
            <TableHead>New Packet Mark</TableHead>
            <TableHead>Comment</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.mangle.map((rule: Rule, index: number) => (
            <TableRow key={rule.id || index}>
              <TableCell>{rule.chain || "-"}</TableCell>
              <TableCell>{getActionBadge(rule.action)}</TableCell>
              <TableCell>{rule["src-address"] || "-"}</TableCell>
              <TableCell>{rule["dst-address"] || "-"}</TableCell>
              <TableCell>{rule["new-packet-mark"] || "-"}</TableCell>
              <TableCell>{rule.comment || "-"}</TableCell>
              <TableCell>{getStatusBadge(rule.disabled)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderQueueRules = () => {
    if (
      (!rules.queues?.simpleQueues || rules.queues.simpleQueues.length === 0) &&
      (!rules.queues?.treeQueues || rules.queues.treeQueues.length === 0)
    ) {
      return (
        <Alert variant="info">
          <Layers className="h-4 w-4" />
          <AlertTitle>Không có quy tắc</AlertTitle>
          <AlertDescription>
            Không tìm thấy quy tắc queue nào được cấu hình trên thiết bị này.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        {rules.queues?.simpleQueues && rules.queues.simpleQueues.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Simple Queues</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Max Limit</TableHead>
                  <TableHead>Burst Limit</TableHead>
                  <TableHead>Comment</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.queues.simpleQueues.map((rule: Rule, index: number) => (
                  <TableRow key={rule.id || index}>
                    <TableCell>{rule.name || "-"}</TableCell>
                    <TableCell>{rule.target || "-"}</TableCell>
                    <TableCell>{rule["max-limit"] || "-"}</TableCell>
                    <TableCell>{rule["burst-limit"] || "-"}</TableCell>
                    <TableCell>{rule.comment || "-"}</TableCell>
                    <TableCell>{getStatusBadge(rule.disabled)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {rules.queues?.treeQueues && rules.queues.treeQueues.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Queue Trees</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Parent</TableHead>
                  <TableHead>Packet Mark</TableHead>
                  <TableHead>Limit</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.queues.treeQueues.map((rule: Rule, index: number) => (
                  <TableRow key={rule.id || index}>
                    <TableCell>{rule.name || "-"}</TableCell>
                    <TableCell>{rule.parent || "-"}</TableCell>
                    <TableCell>{rule["packet-mark"] || "-"}</TableCell>
                    <TableCell>{rule.limit || "-"}</TableCell>
                    <TableCell>{rule.priority || "-"}</TableCell>
                    <TableCell>{getStatusBadge(rule.disabled)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  };

  const renderRoutingRules = () => {
    if (
      (!rules.routing?.routes || rules.routing.routes.length === 0) &&
      (!rules.routing?.bgp || rules.routing.bgp.length === 0) &&
      (!rules.routing?.ospf || rules.routing.ospf.length === 0)
    ) {
      return (
        <Alert variant="info">
          <Router className="h-4 w-4" />
          <AlertTitle>Không có quy tắc</AlertTitle>
          <AlertDescription>
            Không tìm thấy quy tắc routing nào được cấu hình trên thiết bị này.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-6">
        {rules.routing?.routes && rules.routing.routes.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Static Routes</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Dst Address</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Interface</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead>Scope</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.routing.routes.map((rule: Rule, index: number) => (
                  <TableRow key={rule.id || index}>
                    <TableCell>{rule["dst-address"] || "-"}</TableCell>
                    <TableCell>{rule.gateway || "-"}</TableCell>
                    <TableCell>{rule["interface"] || "-"}</TableCell>
                    <TableCell>{rule.distance || "-"}</TableCell>
                    <TableCell>{rule.scope || "-"}</TableCell>
                    <TableCell>{getStatusBadge(rule.disabled)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {rules.routing?.bgp && rules.routing.bgp.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">BGP Instances</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>AS</TableHead>
                  <TableHead>Router ID</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.routing.bgp.map((rule: Rule, index: number) => (
                  <TableRow key={rule.id || index}>
                    <TableCell>{rule.name || "-"}</TableCell>
                    <TableCell>{rule.as || "-"}</TableCell>
                    <TableCell>{rule["router-id"] || "-"}</TableCell>
                    <TableCell>{getStatusBadge(rule.disabled)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {rules.routing?.ospf && rules.routing.ospf.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">OSPF Instances</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Router ID</TableHead>
                  <TableHead>Redistribute</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.routing.ospf.map((rule: Rule, index: number) => (
                  <TableRow key={rule.id || index}>
                    <TableCell>{rule.name || "-"}</TableCell>
                    <TableCell>{rule["router-id"] || "-"}</TableCell>
                    <TableCell>{rule.redistribute || "-"}</TableCell>
                    <TableCell>{getStatusBadge(rule.disabled)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    );
  };

  const renderCurrentRules = () => {
    switch (activeTab) {
      case "firewall":
        return renderFirewallRules();
      case "nat":
        return renderNatRules();
      case "mangle":
        return renderMangleRules();
      case "queue":
        return renderQueueRules();
      case "routing":
        return renderRoutingRules();
      default:
        return (
          <div className="space-y-6">
            <section>
              <h3 className="text-lg font-medium mb-2">Firewall Rules</h3>
              {renderFirewallRules()}
            </section>
            <section>
              <h3 className="text-lg font-medium mb-2">NAT Rules</h3>
              {renderNatRules()}
            </section>
            <section>
              <h3 className="text-lg font-medium mb-2">Mangle Rules</h3>
              {renderMangleRules()}
            </section>
            <section>
              <h3 className="text-lg font-medium mb-2">Queue Rules</h3>
              {renderQueueRules()}
            </section>
            <section>
              <h3 className="text-lg font-medium mb-2">Routing Rules</h3>
              {renderRoutingRules()}
            </section>
          </div>
        );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="h-5 w-5 mr-2" />
          <span>Quản lý quy tắc MikroTik</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex overflow-x-auto pb-2 mb-4">
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            className="mr-2"
            onClick={() => handleTabChange("all")}
          >
            <Layers className="h-4 w-4 mr-2" />
            Tất cả quy tắc
          </Button>
          <Button
            variant={activeTab === "firewall" ? "default" : "outline"}
            className="mr-2"
            onClick={() => handleTabChange("firewall")}
          >
            <ShieldCheck className="h-4 w-4 mr-2" />
            Firewall
          </Button>
          <Button
            variant={activeTab === "nat" ? "default" : "outline"}
            className="mr-2"
            onClick={() => handleTabChange("nat")}
          >
            <ArrowLeftRight className="h-4 w-4 mr-2" />
            NAT
          </Button>
          <Button
            variant={activeTab === "mangle" ? "default" : "outline"}
            className="mr-2"
            onClick={() => handleTabChange("mangle")}
          >
            <List className="h-4 w-4 mr-2" />
            Mangle
          </Button>
          <Button
            variant={activeTab === "queue" ? "default" : "outline"}
            className="mr-2"
            onClick={() => handleTabChange("queue")}
          >
            <Activity className="h-4 w-4 mr-2" />
            Queue
          </Button>
          <Button
            variant={activeTab === "routing" ? "default" : "outline"}
            onClick={() => handleTabChange("routing")}
          >
            <Router className="h-4 w-4 mr-2" />
            Routing
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="mb-4"
            >
              <Filter className="h-8 w-8 text-primary" />
            </motion.div>
            <p className="text-muted-foreground">Đang tải quy tắc...</p>
          </div>
        ) : error ? (
          <Alert variant="destructive">
            <TriangleAlert className="h-4 w-4" />
            <AlertTitle>Lỗi</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : (
          renderCurrentRules()
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={() => fetchSpecificRules(activeTab)}>
          Làm mới
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RulesList;
