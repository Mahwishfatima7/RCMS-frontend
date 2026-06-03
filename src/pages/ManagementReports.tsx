import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { SLAStatusBadge } from "@/components/SLAStatusBadge";
import { SLAInfoComponent } from "@/components/SLAInfoComponent";
import { analyticsApi, userApi } from "@/services/apiService";
import { motion } from "framer-motion";
import { Download, Filter, Loader, Search, Eye, X } from "lucide-react";
import { toast } from "sonner";

export default function ManagementReports() {
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [slaStatusFilter, setSLAStatusFilter] = useState<string>("All");
  const [managerFilter, setManagerFilter] = useState<string>("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [search, setSearch] = useState("");
  const [reports, setReports] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [selectedReportSLA, setSelectedReportSLA] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const filters: any = {};
        if (dateFrom) filters.dateFrom = dateFrom;
        if (dateTo) filters.dateTo = dateTo;

        const result = await analyticsApi.getReports(filters);
        if (result.success) {
          setReports(result.data?.complaints || []);
        }

        // Fetch managers list
        const managersResult = await userApi.getManagersList();
        if (managersResult.success) {
          setManagers(managersResult.data || []);
        }
      } catch (error) {
                toast.error("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [dateFrom, dateTo]);

  const filteredReports = reports.filter((c) => {
    // Search filter
    const matchesSearch = !search || 
      c.ticket_no?.toLowerCase().includes(search.toLowerCase()) ||
      c.agent_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.manager_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.agent_email?.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_phone?.toLowerCase().includes(search.toLowerCase()) ||
      c.serial_no?.toLowerCase().includes(search.toLowerCase()) ||
      c.device_model?.toLowerCase().includes(search.toLowerCase()) ||
      c.status?.toLowerCase().includes(search.toLowerCase()) ||
      c.priority?.toLowerCase().includes(search.toLowerCase()) ||
      c.sla_status?.toLowerCase().includes(search.toLowerCase());

    // Status filter
    const matchesStatus = statusFilter === "All" || c.status === statusFilter;

    // Manager filter
    const matchesManager = managerFilter === "All" || c.manager_name === managerFilter;

    // SLA Status filter
    const matchesSLAStatus = slaStatusFilter === "All" || c.sla_status === slaStatusFilter;

    return matchesSearch && matchesStatus && matchesManager && matchesSLAStatus;
  });

  const displayedReports = filteredReports;

  const getSLAInfo = (complaint: any) => {
    if (!complaint.sla_deadline) return null;

    const deadline = new Date(complaint.sla_deadline);
    const now = new Date();
    const timeRemaining = (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
    const totalDuration = complaint.sla_duration || 48;
    const percentageUsed = Math.max(
      0,
      Math.min(100, 100 - (timeRemaining / totalDuration) * 100)
    );

    return {
      slaStatus: complaint.sla_status || "Within SLA",
      slaDeadline: complaint.sla_deadline,
      timeRemaining,
      percentageUsed,
      priority: complaint.priority || "medium",
      slaDuration: complaint.sla_duration || 48,
    };
  };

  const breachedCount = reports.filter((c) => c.sla_status === "Breached").length;
  const atRiskCount = reports.filter((c) => c.sla_status === "At Risk").length;

  const exportCSV = () => {
    if (displayedReports.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Ticket No,Agent Name,Manager,Agent Email,Customer,Phone,Serial No,Device,Status,Priority,SLA Status,Created",
    ];
    const rows = displayedReports.map(
      (c) =>
        `${c.ticket_no},${c.agent_name || ""},${c.manager_name || ""},${c.agent_email || ""},${c.customer_name},${c.customer_phone},${c.serial_no},${c.device_model},${c.status},${c.priority || "Medium"},${c.sla_status || "Within SLA"},${c.created_at}`,
    );
    const csv = [...headers, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rcms-report.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-2xl font-bold mb-1">Reports</h1>
              <p className="text-sm text-muted-foreground">
                Filter and export complaint data
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={exportCSV}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90"
              >
                <Download className="h-4 w-4" /> Export CSV
              </button>
              {(breachedCount > 0 || atRiskCount > 0) && (
                <>
                  {breachedCount > 0 && (
                    <div className="px-3 py-2 rounded-lg bg-red-500/20 text-red-600 text-sm font-medium">
                      {breachedCount} Breached
                    </div>
                  )}
                  {atRiskCount > 0 && (
                    <div className="px-3 py-2 rounded-lg bg-amber-500/20 text-amber-600 text-sm font-medium">
                      {atRiskCount} At Risk
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search any column..."
                className="w-full pl-9 pr-3 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-2.5 rounded-lg border transition-all flex items-center gap-2 ${
                showFilters
                  ? "bg-primary/10 border-primary text-primary"
                  : "bg-secondary/30 border-border/50 text-muted-foreground hover:border-primary"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {(statusFilter !== "All" || managerFilter !== "All" || slaStatusFilter !== "All" || dateFrom || dateTo) && (
                <span className="text-xs font-bold">
                  {[
                    statusFilter !== "All" ? 1 : 0,
                    managerFilter !== "All" ? 1 : 0,
                    slaStatusFilter !== "All" ? 1 : 0,
                    dateFrom ? 1 : 0,
                    dateTo ? 1 : 0,
                  ].reduce((a, b) => a + b)}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-secondary/30 rounded-lg border border-border/50"
            >
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Status
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-1.5 bg-secondary border border-border/50 rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    {["All", "Pending", "In-Progress", "Replaced", "Rejected"].map(
                      (s) => (
                        <option key={s}>{s}</option>
                      )
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    Manager
                  </label>
                  <select
                    value={managerFilter}
                    onChange={(e) => setManagerFilter(e.target.value)}
                    className="px-3 py-1.5 bg-secondary border border-border/50 rounded-lg text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  >
                    <option>All</option>
                    {managers.map((m) => (
                      <option key={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    SLA Status
                  </label>
                  <div className="flex gap-2">
                    {(["Within SLA", "At Risk", "Breached"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() =>
                          setSLAStatusFilter(slaStatusFilter === status ? "All" : status)
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          slaStatusFilter === status
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary border border-border/50 text-muted-foreground hover:border-primary"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                    {slaStatusFilter !== "All" && (
                      <button
                        onClick={() => setSLAStatusFilter("All")}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary border border-border/50 text-muted-foreground hover:border-primary flex items-center gap-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    From
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="px-3 py-1.5 bg-secondary border border-border/50 rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    To
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="px-3 py-1.5 bg-secondary border border-border/50 rounded-lg text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Showing <span className="font-semibold text-foreground">{filteredReports.length}</span> of <span className="font-semibold text-foreground">{reports.length}</span> results
              </p>
            </motion.div>
          )}
        </div>

        {loading ? (
          <div className="glass-card rounded-xl p-8 text-center flex items-center justify-center gap-2">
            <Loader className="h-4 w-4 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading reports...</p>
          </div>
        ) : filteredReports.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm">No reports found.</p>
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 sticky top-0 bg-background z-20">
                    {[
                      "Ticket #",
                      "Agent Name",
                      "Manager",
                      "Agent Email",
                      "Customer",
                      "Account No",
                      "Phone",
                      "Serial",
                      "Device",
                      "Status",
                      "Priority",
                      "SLA Status",
                      "Date",
                      "Actions",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide whitespace-nowrap"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((c, i) => {
                    const slaInfo = getSLAInfo(c);
                    return (
                      <motion.tr
                        key={c.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className={`border-b border-border/30 transition-colors ${
                          c.sla_status === "Breached"
                            ? "hover:bg-red-500/10 bg-red-500/5"
                            : c.sla_status === "At Risk"
                            ? "hover:bg-amber-500/10 bg-amber-500/5"
                            : "hover:bg-secondary/30"
                        }`}
                      >
                        <td className="px-4 py-3 font-mono text-xs text-primary font-semibold whitespace-nowrap">
                          {c.ticket_no}
                        </td>
                        <td className="px-4 py-3 text-foreground text-sm font-medium whitespace-nowrap">
                          {c.agent_name || "â€”"}
                        </td>
                        <td className="px-4 py-3 text-foreground text-sm whitespace-nowrap">
                          {c.manager_name || "â€”"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                          {c.agent_email || "â€”"}
                        </td>
                        <td className="px-4 py-3 text-foreground text-sm whitespace-nowrap">
                          {c.customer_name}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {c.customer_account_no || "â€”"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                          {c.customer_phone}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">
                          {c.serial_no || "â€”"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                          {c.device_model}
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={c.status} />
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-block px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
                            {c.priority || "Medium"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {slaInfo && (
                            <SLAStatusBadge
                              status={slaInfo.slaStatus}
                              size="sm"
                              showIcon={true}
                            />
                          )}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                          {c.created_at
                            ? new Date(c.created_at).toLocaleDateString()
                            : "â€”"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedReport(c);
                              setSelectedReportSLA(slaInfo);
                            }}
                            className="text-primary hover:text-primary/80 transition-colors"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {selectedReport && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => {
              setSelectedReport(null);
              setSelectedReportSLA(null);
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
                    {selectedReport.ticket_no}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedReport.customer_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelectedReport(null);
                    setSelectedReportSLA(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* SLA Information */}
                {selectedReportSLA && (
                  <div>
                    <h3 className="font-semibold mb-3 text-sm">SLA Information</h3>
                    <SLAInfoComponent slaInfo={selectedReportSLA} />
                  </div>
                )}

                {/* Ticket Details */}
                <div>
                  <h3 className="font-semibold mb-3 text-sm">Ticket Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">STATUS</p>
                      <StatusBadge status={selectedReport.status} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">PRIORITY</p>
                      <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
                        {selectedReport.priority || "medium"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">AGENT</p>
                      <p className="text-sm">{selectedReport.agent_name || "â€”"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">CREATED</p>
                      <p className="text-sm font-mono text-xs">
                        {new Date(selectedReport.created_at).toLocaleString()}
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
                      <p>{selectedReport.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">PHONE</p>
                      <p>{selectedReport.customer_phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">EMAIL</p>
                      <p className="break-all">{selectedReport.customer_email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ADDRESS</p>
                      <p>{selectedReport.customer_address || "â€”"}</p>
                    </div>
                    {selectedReport.customer_account_no && (
                      <div>
                        <p className="text-xs text-muted-foreground">ACCOUNT NUMBER</p>
                        <p className="font-mono">{selectedReport.customer_account_no}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Device Information */}
                <div>
                  <h3 className="font-semibold mb-3 text-sm">Device Information</h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">MODEL</p>
                      <p>{selectedReport.device_model}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">SERIAL NO</p>
                      <p className="font-mono text-primary">{selectedReport.serial_no || "â€”"}</p>
                    </div>
                    {selectedReport.item_no && (
                      <div>
                        <p className="text-xs text-muted-foreground">ITEM NO</p>
                        <p className="font-mono">{selectedReport.item_no}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Issue Description */}
                {selectedReport.issue_description && (
                  <div>
                    <h3 className="font-semibold mb-3 text-sm">ISSUE DESCRIPTION</h3>
                    <p className="text-sm text-muted-foreground bg-secondary/20 p-3 rounded-lg">
                      {selectedReport.issue_description}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}

