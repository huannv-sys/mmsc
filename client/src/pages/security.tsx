import { useState } from "react";
import { Layout } from "@/components/layout";
import SecurityDashboard from "@/components/security/SecurityDashboard";

export default function SecurityPage() {
  return (
    <Layout>
      <div className="container mx-auto py-6">
        <SecurityDashboard />
      </div>
    </Layout>
  );
}
