import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { motion } from "framer-motion";
import {
  BarChart3,
  CheckCircle,
  AlertTriangle,
  XCircle,
  TrendingUp,
} from "lucide-react";
import { complaintApi } from "@/services/apiService";
import { usePollingWithSmoothLoading } from "@/hooks/usePolling";

interface SLAStats {
  total: number;
  withinSLA: number;
  atRisk: number;
  breached: number;
  criticalBreached: number;
  avgSLADuration: number;
}

export default function SLADashboard() {
  const [stats, setStats] = useState<SLAStats | null>(null);
  const [distribution, setDistribution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSLAData = async () => {
      setLoading(true);
      try {
        // Refresh all SLA statuses first to get latest data
        await complaintApi.refreshAllSLAStatuses();
        
        const result = await complaintApi.getSLAStatistics();
        if (result.success && result.data) {
          setStats(result.data.statistics);
          setDistribution(result.data.distribution || []);
        }
      } catch (error) {
              } finally {
        setLoading(false);
      }
    };

    fetchSLAData();
  }, []);

  const fetchSLADataForPolling = async () => {
    try {
      // Refresh all SLA statuses first for real-time updates
      await complaintApi.refreshAllSLAStatuses();
      
      const result = await complaintApi.getSLAStatistics();
      if (result.success && result.data) {
        setStats(result.data.statistics);
        setDistribution(result.data.distribution || []);
      }
    } catch (error) {
          }
  };

  usePollingWithSmoothLoading(
    fetchSLADataForPolling,
    30000, // 30 seconds for real-time SLA breach detection
    true, // enabled
    () => setLoading(false),
    () => {} // Silent updates
  );

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-muted-foreground">Loading SLA dashboard...</div>
        </div>
      </AppLayout>
    );
  }

  if (!stats) {
    return (
      <AppLayout>
        <div className="glass-card rounded-xl p-8 text-center">
          <p className="text-muted-foreground">No SLA data available</p>
        </div>
      </AppLayout>
    );
  }

  const slaPercentage =
    stats.total > 0
      ? Math.round((stats.withinSLA / stats.total) * 100)
      : 0;

  const StatCard = ({
    icon: Icon,
    label,
    value,
    subtitle,
    color,
  }: {
    icon: any;
    label: string;
    value: string | number;
    subtitle?: string;
    color: "emerald" | "amber" | "red" | "blue";
  }) => {
    const colorStyles = {
      emerald: "bg-emerald-500/20 text-emerald-600",
      amber: "bg-amber-500/20 text-amber-600",
      red: "bg-red-500/20 text-red-600",
      blue: "bg-blue-500/20 text-blue-600",
    };

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-xl p-6"
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-2">{label}</p>
            <p className="text-3xl font-bold text-foreground mb-1">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={`p-3 rounded-lg ${colorStyles[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold mb-2">SLA Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor service level agreements across all tickets
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard
            icon={BarChart3}
            label="Total Tickets"
            value={stats.total}
            color="blue"
          />
          <StatCard
            icon={CheckCircle}
            label="Within SLA"
            value={stats.withinSLA}
            subtitle={`${slaPercentage}% compliance`}
            color="emerald"
          />
          <StatCard
            icon={AlertTriangle}
            label="At Risk"
            value={stats.atRisk}
            color="amber"
          />
          <StatCard
            icon={XCircle}
            label="Breached"
            value={stats.breached}
            subtitle={stats.criticalBreached > 0 ? `${stats.criticalBreached} critical` : ""}
            color="red"
          />
          <StatCard
            icon={TrendingUp}
            label="Avg SLA Duration"
            value={`${stats.avgSLADuration}h`}
            color="blue"
          />
        </div>

        {/* Distribution Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card rounded-xl overflow-hidden"
        >
          <div className="p-6 border-b border-border/50">
            <h2 className="font-display text-lg font-bold">SLA Distribution by Priority</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 bg-secondary/20">
                  <th className="text-left px-6 py-3 font-semibold text-muted-foreground">
                    Priority
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-muted-foreground">
                    Within SLA
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-muted-foreground">
                    At Risk
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-muted-foreground">
                    Breached
                  </th>
                  <th className="text-left px-6 py-3 font-semibold text-muted-foreground">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {["critical", "high", "medium", "low"].map((priority) => {
                  const withinSLA = distribution
                    .filter((d) => d.priority === priority && d.sla_status === "Within SLA")
                    .reduce((sum, d) => sum + d.count, 0);
                  const atRisk = distribution
                    .filter((d) => d.priority === priority && d.sla_status === "At Risk")
                    .reduce((sum, d) => sum + d.count, 0);
                  const breached = distribution
                    .filter((d) => d.priority === priority && d.sla_status === "Breached")
                    .reduce((sum, d) => sum + d.count, 0);
                  const total = withinSLA + atRisk + breached;

                  return (
                    <tr
                      key={priority}
                      className={`${total === 0 ? 'bg-secondary/10' : 'hover:bg-secondary/20'} border-b border-border/20 transition-colors`}
                    >
                      <td className="px-6 py-4">
                        <span className={`inline-block px-3 py-1 rounded-full font-medium capitalize text-xs ${
                          total === 0 ? 'bg-secondary/50 text-muted-foreground' : 'bg-primary/10 text-primary'
                        }`}>
                          {priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-2 ${total === 0 ? 'text-muted-foreground' : 'text-emerald-600'}`}>
                          <CheckCircle className="h-4 w-4" />
                          {withinSLA}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-2 ${total === 0 ? 'text-muted-foreground' : 'text-amber-600'}`}>
                          <AlertTriangle className="h-4 w-4" />
                          {atRisk}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`flex items-center gap-2 ${total === 0 ? 'text-muted-foreground' : 'text-red-600'}`}>
                          <XCircle className="h-4 w-4" />
                          {breached}
                        </span>
                      </td>
                      <td className={`px-6 py-4 ${total === 0 ? 'text-muted-foreground' : 'font-semibold'}`}>{total}</td>
                    </tr>
                  );
                })}
                {/* Summary Footer */}
                {(() => {
                  let totalWithinSLA = 0;
                  let totalAtRisk = 0;
                  let totalBreached = 0;
                  
                  for (const priority of ["critical", "high", "medium", "low"]) {
                    const withinSLA = distribution
                      .filter((d) => d.priority === priority && d.sla_status === "Within SLA")
                      .reduce((sum, d) => sum + d.count, 0);
                    const atRisk = distribution
                      .filter((d) => d.priority === priority && d.sla_status === "At Risk")
                      .reduce((sum, d) => sum + d.count, 0);
                    const breached = distribution
                      .filter((d) => d.priority === priority && d.sla_status === "Breached")
                      .reduce((sum, d) => sum + d.count, 0);
                    
                    totalWithinSLA += withinSLA;
                    totalAtRisk += atRisk;
                    totalBreached += breached;
                  }
                  
                  return (
                    <tr className="bg-secondary/30 border-t-2 border-primary/50">
                      <td className="px-6 py-4">
                        <span className="font-semibold text-foreground">TOTAL</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 font-semibold text-emerald-600">
                          <CheckCircle className="h-4 w-4" />
                          {totalWithinSLA}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 font-semibold text-amber-600">
                          <AlertTriangle className="h-4 w-4" />
                          {totalAtRisk}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="flex items-center gap-2 font-semibold text-red-600">
                          <XCircle className="h-4 w-4" />
                          {totalBreached}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-bold text-lg">{totalWithinSLA + totalAtRisk + totalBreached}</td>
                    </tr>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </motion.div>
      </motion.div>
    </AppLayout>
  );
}

