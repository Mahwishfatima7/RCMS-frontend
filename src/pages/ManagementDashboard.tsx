import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { StatCard } from "@/components/StatCard";
import { SLAStatusBadge } from "@/components/SLAStatusBadge";
import { SLAInfoComponent } from "@/components/SLAInfoComponent";
import { StatusBadge } from "@/components/StatusBadge";
import { complaintApi, analyticsApi } from "@/services/apiService";
import { motion } from "framer-motion";
import { usePollingWithSmoothLoading } from "@/hooks/usePolling";
import {
  ClipboardList,
  CheckCircle,
  Clock,
  XCircle,
  Truck,
  Loader,
  AlertTriangle,
  TrendingUp,
  Eye,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

// Colors mapped to status order: Pending, In-Progress, Replaced, Rejected
const COLORS = [
  "hsl(38, 92%, 50%)",  // Pending - warning (orange)
  "hsl(200, 72%, 47%)", // In-Progress - primary (blue)
  "hsl(142, 71%, 45%)", // Replaced - success (green)
  "hsl(0, 72%, 51%)",   // Rejected - destructive (red)
];

const monthlyData = [
  { month: "Oct", complaints: 8, resolved: 6 },
  { month: "Nov", complaints: 12, resolved: 10 },
  { month: "Dec", complaints: 6, resolved: 5 },
  { month: "Jan", complaints: 15, resolved: 11 },
  { month: "Feb", complaints: 10, resolved: 9 },
  { month: "Mar", complaints: 5, resolved: 2 },
];

export default function ManagementDashboard() {
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<any>(null);
  const [slaStats, setSLAStats] = useState<any>(null);
  const [slaDistribution, setSLADistribution] = useState<any[]>([]);
  const [filteredTickets, setFilteredTickets] = useState<any[]>([]);
  const [selectedSLAFilter, setSelectedSLAFilter] = useState<string | null>("Breached");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [totalLoading, setTotalLoading] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [selectedTicketSLA, setSelectedTicketSLA] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const result = await analyticsApi.getDashboard();
        if (result.success) {
          setDashboard(result.data);
        }
        
        // Fetch SLA statistics
        const slaResult = await complaintApi.getSLAStatistics();
        if (slaResult.success && slaResult.data) {
          setSLAStats(slaResult.data.statistics);
          setSLADistribution(slaResult.data.distribution || []);
        }

        // Fetch filtered tickets by SLA status
        const ticketsResult = await complaintApi.getComplaintsBySLAStatus("Breached");
        if (ticketsResult.success) {
          setFilteredTickets(ticketsResult.data.complaints || []);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const result = await analyticsApi.getDashboard();
      if (result.success) {
        setDashboard(result.data);
      }
      
      const slaResult = await complaintApi.getSLAStatistics();
      if (slaResult.success && slaResult.data) {
        setSLAStats(slaResult.data.statistics);
        setSLADistribution(slaResult.data.distribution || []);
      }

      if (selectedSLAFilter === null) {
        const allComplaintsResult = await complaintApi.getAll();
        if (allComplaintsResult.success) {
          setFilteredTickets(allComplaintsResult.data?.complaints || []);
        }
      } else {
        const ticketsResult = await complaintApi.getComplaintsBySLAStatus(selectedSLAFilter);
        if (ticketsResult.success) {
          setFilteredTickets(ticketsResult.data.complaints || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch dashboard:", error);
    }
  };

  const getSLAInfo = (ticket: any) => {
    if (!ticket.sla_deadline) return null;
    const deadline = new Date(ticket.sla_deadline);
    const now = new Date();
    const timeRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    const totalDuration = ticket.sla_duration || 48;
    const percentageUsed = Math.max(0, Math.min(100, 100 - (timeRemaining / totalDuration) * 100));
    return {
      slaStatus: ticket.sla_status || "Within SLA",
      slaDeadline: ticket.sla_deadline,
      timeRemaining,
      percentageUsed,
      priority: ticket.priority || "medium",
      slaDuration: ticket.sla_duration || 48,
    };
  };

  const handleSLAFilterChange = async (status: string | null) => {
    setSelectedSLAFilter(status);
    setTotalLoading(true);
    try {
      if (status === null) {
        const allComplaintsResult = await complaintApi.getAll();
        if (allComplaintsResult.success) {
          setFilteredTickets(allComplaintsResult.data?.complaints || []);
        }
      } else {
        const ticketsResult = await complaintApi.getComplaintsBySLAStatus(status);
        if (ticketsResult.success) {
          setFilteredTickets(ticketsResult.data.complaints || []);
        }
      }
    } catch (error) {
      console.error("Failed to fetch filtered tickets:", error);
    } finally {
      setTotalLoading(false);
    }
  };

  // TODO: Re-add polling after fixing syntax
  // usePollingWithSmoothLoading(fetchDashboardData, 60000, true, () => setLoading(false), () => {});

  const statusCounts = dashboard?.statusDistribution || {
    Pending: 0,
    "In-Progress": 0,
    Replaced: 0,
    Rejected: 0,
  };

  const pieData = Array.isArray(statusCounts)
    ? statusCounts.map((item: any) => ({
        name: item.status,
        value: item.count,
      }))
    : Object.entries(statusCounts).map(([name, value]) => ({
        name,
        value,
      }));

  // Calculate resolved and pending complaints from statusDistribution
  const resolvedComplaints = Array.isArray(statusCounts)
    ? statusCounts
        .filter((item: any) =>
          ["Replaced", "Rejected"].includes(item.status),
        )
        .reduce((sum, item: any) => sum + (item.count || 0), 0)
    : (statusCounts.Replaced || 0) + (statusCounts.Rejected || 0);

  const pendingComplaints = Array.isArray(statusCounts)
    ? statusCounts
        .filter((item: any) =>
          ["Pending", "In-Progress"].includes(item.status),
        )
        .reduce((sum, item: any) => sum + (item.count || 0), 0)
    : (statusCounts.Pending || 0) +
      (statusCounts["In-Progress"] || 0);



  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-screen gap-2">
          <Loader className="h-6 w-6 animate-spin" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold mb-1">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            RCMS Overview & Analytics
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <StatCard
            label="Total"
            value={dashboard?.totalComplaints || 0}
            icon={ClipboardList}
          />
          <StatCard
            label="Pending"
            value={
              Array.isArray(statusCounts)
                ? statusCounts.find((s: any) => s.status === "Pending")
                    ?.count || 0
                : statusCounts.Pending || 0
            }
            icon={Clock}
            colorClass="text-warning"
          />

          <StatCard
            label="In Progress"
            value={
              Array.isArray(statusCounts)
                ? statusCounts.find((s: any) => s.status === "In-Progress")
                    ?.count || 0
                : statusCounts["In-Progress"] || 0
            }
            icon={Truck}
            colorClass="text-primary"
          />
          <StatCard
            label="Replaced"
            value={
              Array.isArray(statusCounts)
                ? statusCounts.find((s: any) => s.status === "Replaced")
                    ?.count || 0
                : statusCounts.Replaced || 0
            }
            icon={CheckCircle}
            colorClass="text-success"
          />
          <StatCard
            label="Rejected"
            value={
              Array.isArray(statusCounts)
                ? statusCounts.find((s: any) => s.status === "Rejected")
                    ?.count || 0
                : statusCounts.Rejected || 0
            }
            icon={XCircle}
            colorClass="text-destructive"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card rounded-xl p-5"
          >
            <h3 className="font-display font-semibold text-sm mb-4">
              Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "hsl(216, 45%, 16%)",
                    border: "1px solid hsl(216, 30%, 25%)",
                    borderRadius: "8px",
                    color: "hsl(210, 40%, 96%)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-xl p-5"
          >
            <h3 className="font-display font-semibold text-sm mb-4">
              Monthly Trends
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dashboard?.monthlyTrends || monthlyData}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="hsl(216, 30%, 25%)"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }}
                />
                <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(216, 45%, 16%)",
                    border: "1px solid hsl(216, 30%, 25%)",
                    borderRadius: "8px",
                    color: "hsl(210, 40%, 96%)",
                  }}
                />
                <Bar
                  dataKey="submitted"
                  fill="hsl(200, 72%, 47%)"
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="resolved"
                  fill="hsl(142, 71%, 45%)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="glass-card rounded-xl p-5">
            <h3 className="font-display font-semibold text-sm mb-4">
              Complaint Resolution Rate
            </h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-muted-foreground">Resolved</span>
                  <span className="text-sm font-semibold text-success">
                    {dashboard?.totalComplaints > 0
                      ? Math.round(
                          (resolvedComplaints /
                            dashboard?.totalComplaints) *
                            100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full transition-all"
                    style={{
                      width: `${dashboard?.totalComplaints > 0 ? (resolvedComplaints / dashboard?.totalComplaints) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs text-muted-foreground">Pending</span>
                  <span className="text-sm font-semibold text-warning">
                    {dashboard?.totalComplaints > 0
                      ? Math.round(
                          (pendingComplaints /
                            dashboard?.totalComplaints) *
                            100,
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-warning rounded-full transition-all"
                    style={{
                      width: `${dashboard?.totalComplaints > 0 ? (pendingComplaints / dashboard?.totalComplaints) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
              <div className="pt-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">
                    {resolvedComplaints}
                  </span>
                  {" "}of{" "}
                  <span className="font-medium text-foreground">
                    {dashboard?.totalComplaints || 0}
                  </span>
                  {" "}resolved
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* SLA Section */}
        {slaStats && (
          <>
            <div className="mt-12 mb-6">
              <h2 className="font-display text-xl font-bold mb-1">Service Level Agreement (SLA)</h2>
              <p className="text-sm text-muted-foreground">
                SLA compliance and performance metrics
              </p>
            </div>

            {/* SLA KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
              <StatCard
                label="Total Tickets"
                value={slaStats.total || 0}
                icon={ClipboardList}
              />
              <StatCard
                label="Within SLA"
                value={slaStats.withinSLA || 0}
                colorClass="text-success"
                icon={CheckCircle}
              />
              <StatCard
                label="At Risk"
                value={slaStats.atRisk || 0}
                colorClass="text-warning"
                icon={AlertTriangle}
              />
              <StatCard
                label="Breached"
                value={slaStats.breached || 0}
                colorClass="text-destructive"
                icon={XCircle}
              />
              <StatCard
                label="Avg Duration"
                value={`${slaStats.avgSLADuration || 0}h`}
                colorClass="text-primary"
                icon={TrendingUp}
              />
            </div>

            {/* SLA Compliance Progress */}
            <div className="glass-card rounded-xl p-5 mb-8">
              <h3 className="font-display font-semibold text-sm mb-4">
                SLA Compliance Rate
              </h3>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs text-muted-foreground">Compliance</span>
                    <span className="text-sm font-semibold text-success">
                      {slaStats.total > 0
                        ? Math.round((slaStats.withinSLA / slaStats.total) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-success rounded-full transition-all"
                      style={{
                        width: `${slaStats.total > 0 ? (slaStats.withinSLA / slaStats.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* SLA Distribution Table */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
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
                      const withinSLA = slaDistribution
                        .filter((d) => d.priority === priority && d.sla_status === "Within SLA")
                        .reduce((sum, d) => sum + d.count, 0);
                      const atRisk = slaDistribution
                        .filter((d) => d.priority === priority && d.sla_status === "At Risk")
                        .reduce((sum, d) => sum + d.count, 0);
                      const breached = slaDistribution
                        .filter((d) => d.priority === priority && d.sla_status === "Breached")
                        .reduce((sum, d) => sum + d.count, 0);
                      const total = withinSLA + atRisk + breached;

                      if (total === 0) return null;

                      return (
                        <tr
                          key={priority}
                          className="border-b border-border/20 hover:bg-secondary/20 transition-colors"
                        >
                          <td className="px-6 py-4">
                            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
                              {priority}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2 text-success">
                              <CheckCircle className="h-4 w-4" />
                              {withinSLA}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2 text-warning">
                              <AlertTriangle className="h-4 w-4" />
                              {atRisk}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2 text-destructive">
                              <XCircle className="h-4 w-4" />
                              {breached}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-semibold">{total}</td>
                        </tr>
                      );
                    })}
                    {/* TOTAL ROW */}
                    {(() => {
                      let totalWithinSLA = 0;
                      let totalAtRisk = 0;
                      let totalBreached = 0;
                      
                      for (const priority of ["critical", "high", "medium", "low"]) {
                        const withinSLA = slaDistribution
                          .filter((d) => d.priority === priority && d.sla_status === "Within SLA")
                          .reduce((sum, d) => sum + d.count, 0);
                        const atRisk = slaDistribution
                          .filter((d) => d.priority === priority && d.sla_status === "At Risk")
                          .reduce((sum, d) => sum + d.count, 0);
                        const breached = slaDistribution
                          .filter((d) => d.priority === priority && d.sla_status === "Breached")
                          .reduce((sum, d) => sum + d.count, 0);
                        
                        totalWithinSLA += withinSLA;
                        totalAtRisk += atRisk;
                        totalBreached += breached;
                      }
                      
                      const grandTotal = totalWithinSLA + totalAtRisk + totalBreached;
                      
                      return (
                        <tr className="bg-secondary/30 border-t-2 border-primary/50">
                          <td className="px-6 py-4">
                            <span className="font-semibold text-foreground">TOTAL</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2 font-semibold text-success">
                              <CheckCircle className="h-4 w-4" />
                              {totalWithinSLA}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2 font-semibold text-warning">
                              <AlertTriangle className="h-4 w-4" />
                              {totalAtRisk}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="flex items-center gap-2 font-semibold text-destructive">
                              <XCircle className="h-4 w-4" />
                              {totalBreached}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-bold text-lg">{grandTotal}</td>
                        </tr>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Filtered Tickets by SLA Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="glass-card rounded-xl overflow-hidden mt-8"
            >
              <div className="p-6 border-b border-border/50">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="font-display text-lg font-bold">Filtered Tickets by SLA Status</h2>
                    <p className="text-xs text-muted-foreground mt-1">View and manage tickets by SLA compliance</p>
                  </div>
                  <div className="text-xs text-destructive bg-destructive/10 px-3 py-1 rounded-full font-medium">
                    {slaStats?.breached || 0} Breached
                  </div>
                </div>

                {/* Search and Filters Row */}
                <div className="flex gap-3 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search any column..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary/50 border border-border text-sm placeholder-muted-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors">
                    <SlidersHorizontal className="h-4 w-4" />
                    Filters
                  </button>
                </div>

                {/* SLA Status Filter Buttons */}
                <div>
                  <p className="text-xs text-muted-foreground mb-3 font-medium">SLA Status</p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => handleSLAFilterChange(null)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedSLAFilter === null
                          ? "bg-secondary text-foreground border border-foreground/30"
                          : "bg-secondary/70 text-muted-foreground hover:bg-secondary/80"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => handleSLAFilterChange("Within SLA")}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedSLAFilter === "Within SLA"
                          ? "bg-secondary text-foreground border border-foreground/30"
                          : "bg-secondary/70 text-muted-foreground hover:bg-secondary/80"
                      }`}
                    >
                      Within SLA
                    </button>
                    <button
                      onClick={() => handleSLAFilterChange("At Risk")}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedSLAFilter === "At Risk"
                          ? "bg-secondary text-foreground border border-foreground/30"
                          : "bg-secondary/70 text-muted-foreground hover:bg-secondary/80"
                      }`}
                    >
                      At Risk
                    </button>
                    <button
                      onClick={() => handleSLAFilterChange("Breached")}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                        selectedSLAFilter === "Breached"
                          ? "bg-secondary text-foreground border border-foreground/30"
                          : "bg-secondary/70 text-muted-foreground hover:bg-secondary/80"
                      }`}
                    >
                      Breached
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50 sticky top-0 bg-background z-20">
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        TICKET #
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        AGENT
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        CUSTOMER
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        STATUS
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        PRIORITY
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        SLA STATUS
                      </th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        DATE
                      </th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap">
                        ACTION
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {totalLoading ? (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                          <div className="flex items-center justify-center gap-2">
                            <Loader className="h-4 w-4 animate-spin" />
                            Loading tickets...
                          </div>
                        </td>
                      </tr>
                    ) : filteredTickets && filteredTickets.length > 0 ? (
                      filteredTickets
                        .filter((ticket: any) =>
                          searchQuery === "" ||
                          ticket.ticket_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ticket.agent_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          ticket.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((ticket: any, i: number) => (
                          <motion.tr
                            key={ticket.id}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={`border-b border-border/30 transition-colors ${
                              ticket.sla_status === "Breached"
                                ? "hover:bg-red-500/10 bg-red-500/5"
                                : ticket.sla_status === "At Risk"
                                ? "hover:bg-amber-500/10 bg-amber-500/5"
                                : "hover:bg-secondary/30"
                            }`}
                          >
                            <td className="px-4 py-3 font-mono text-xs text-primary font-semibold whitespace-nowrap">
                              {ticket.ticket_no}
                            </td>
                            <td className="px-4 py-3 text-foreground text-sm font-medium whitespace-nowrap">
                              {ticket.agent_name || "—"}
                            </td>
                            <td className="px-4 py-3 text-foreground text-sm whitespace-nowrap">
                              {ticket.customer_name}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={ticket.status} />
                            </td>
                            <td className="px-4 py-3">
                              <span className="inline-block px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
                                {ticket.priority || "Medium"}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <SLAStatusBadge
                                status={ticket.sla_status}
                                size="sm"
                                showIcon={true}
                              />
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(ticket.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => {
                                  setSelectedTicket(ticket);
                                  setSelectedTicketSLA(getSLAInfo(ticket));
                                }}
                                className="text-primary hover:text-primary/80 transition-colors"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </td>
                          </motion.tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground text-sm">
                          No tickets found {selectedSLAFilter ? `for ${selectedSLAFilter} status` : ''}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </>
        )}

        {/* Ticket Details Modal */}
        {selectedTicket && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => {
              setSelectedTicket(null);
              setSelectedTicketSLA(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-background border-b border-border/50 p-6 flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-lg">
                    {selectedTicket.ticket_no}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedTicket.customer_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedTicket(null);
                    setSelectedTicketSLA(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* SLA Information */}
                {selectedTicketSLA && (
                  <div>
                    <h3 className="font-semibold mb-3 text-sm">SLA Information</h3>
                    <SLAInfoComponent slaInfo={selectedTicketSLA} />
                  </div>
                )}

                {/* Ticket Details */}
                <div>
                  <h3 className="font-semibold mb-3 text-sm">Ticket Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">STATUS</p>
                      <StatusBadge status={selectedTicket.status} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">PRIORITY</p>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                        selectedTicket.priority === 'critical' ? 'bg-red-500/20 text-red-600' :
                        selectedTicket.priority === 'high' ? 'bg-orange-500/20 text-orange-600' :
                        selectedTicket.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
                        'bg-blue-500/20 text-blue-600'
                      }`}>
                        {selectedTicket.priority?.charAt(0).toUpperCase() + selectedTicket.priority?.slice(1) || 'Medium'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">AGENT</p>
                      <p className="text-sm">{selectedTicket.agent_name || "—"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">CREATED</p>
                      <p className="text-sm font-mono text-xs">
                        {new Date(selectedTicket.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Customer Information */}
                <div>
                  <h3 className="font-semibold mb-3 text-sm">Customer Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">NAME</p>
                      <p>{selectedTicket.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">PHONE</p>
                      <p>{selectedTicket.customer_phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">EMAIL</p>
                      <p className="break-all">{selectedTicket.customer_email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ADDRESS</p>
                      <p>{selectedTicket.customer_address}</p>
                    </div>
                    {selectedTicket.customer_account_no && (
                      <div>
                        <p className="text-xs text-muted-foreground">ACCOUNT NUMBER</p>
                        <p className="font-mono">{selectedTicket.customer_account_no}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Device Information */}
                <div>
                  <h3 className="font-semibold mb-3 text-sm">Device Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">SERIAL NO</p>
                      <p className="font-mono text-primary">{selectedTicket.serial_no}</p>
                    </div>
                    {selectedTicket.item_no && (
                      <div>
                        <p className="text-xs text-muted-foreground">ITEM NO</p>
                        <p className="font-mono">{selectedTicket.item_no}</p>
                      </div>
                    )}
                    {selectedTicket.item_description && (
                      <div>
                        <p className="text-xs text-muted-foreground">ITEM DESCRIPTION</p>
                        <p>{selectedTicket.item_description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Issue Description */}
                <div>
                  <h3 className="font-semibold mb-3 text-sm">ISSUE DESCRIPTION</h3>
                  <p className="text-sm text-muted-foreground bg-secondary/20 p-3 rounded-lg">
                    {selectedTicket.issue_description}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedTicket(null);
                      setSelectedTicketSLA(null);
                    }}
                    className="flex-1 px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
