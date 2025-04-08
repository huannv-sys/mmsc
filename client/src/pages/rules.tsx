import React, { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import RulesList from "@/components/rules/RulesList";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { TriangleAlert } from "lucide-react";
import { motion } from "framer-motion";

const Rules: React.FC = () => {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [location, navigate] = useLocation();
  const params = useParams();

  useEffect(() => {
    // Check for device ID in URL or use last selected device from localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const deviceIdFromUrl = urlParams.get("deviceId");

    if (deviceIdFromUrl) {
      setDeviceId(deviceIdFromUrl);
    } else {
      // Try to get from localStorage
      const lastSelectedDevice = localStorage.getItem("lastSelectedDeviceId");
      if (lastSelectedDevice) {
        setDeviceId(lastSelectedDevice);
        // Update URL with the device ID
        navigate(`/rules?deviceId=${lastSelectedDevice}`);
      }
    }
  }, [navigate]);

  // Khi deviceId thay đổi, lưu vào localStorage
  useEffect(() => {
    if (deviceId) {
      localStorage.setItem("lastSelectedDeviceId", deviceId);
    }
  }, [deviceId]);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="container p-4 mx-auto"
      >
        <h1 className="text-2xl font-bold mb-6">Quản lý quy tắc MikroTik</h1>

        {deviceId ? (
          <RulesList deviceId={deviceId} />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Chọn thiết bị</CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="warning">
                <TriangleAlert className="h-4 w-4" />
                <AlertTitle>Chưa chọn thiết bị</AlertTitle>
                <AlertDescription>
                  Vui lòng chọn một thiết bị từ trang Dashboard để xem các quy
                  tắc.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </Layout>
  );
};

export default Rules;
