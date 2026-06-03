import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { SLAStatusBadge } from "@/components/SLAStatusBadge";
import { SLAInfoComponent } from "@/components/SLAInfoComponent";
import { motion } from "framer-motion";
import { Search, Eye, Loader, Filter, X } from "lucide-react";
import { complaintApi } from "@/services/apiService";
import { usePollingWithSmoothLoading } from "@/hooks/usePolling";

export default function AgentAllTicketsWithSLA() {
  const [search, setSearch] = useState("");
  const [slaFilter, setSLAFilter] = useState<"" | "Within SLA" | "At Risk" | "Breached">("");
  const [selected, setSelected] = useState<any>(null);
  const [selectedSLA, setSelectedSLA] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchComplaints = async () => {
    try {
      // Refresh all SLA statuses first for real-time updates
      await complaintApi.refreshAllSLAStatuses();
      
      const result = await complaintApi.getAll();
      if (result.success) {
        setComplaints(result.data?.complaints || []);
        setLastUpdated(new Date());
      }
    } catch (error) {
          }
  };

  usePollingWithSmoothLoading(
    fetchComplaints,
    30000, // 30 seconds for real-time SLA breach detection
    true, // enabled
    () => {
      // On first load
      setLoading(false);
    },
    () => {
      // On subsequent data updates (no loading state change)
      // Data updates smoothly in background
    }
  );

  const filtered = complaints.filter((c) => {
    const searchLower = search.toLowerCase();
    const matchesSearch =
      c.ticket_no?.toLowerCase().includes(searchLower) ||
      c.customer_name?.toLowerCase().includes(searchLower) ||
      c.customer_phone?.toLowerCase().includes(searchLower) ||
      c.customer_email?.toLowerCase().includes(searchLower) ||
      c.customer_account_no?.toLowerCase().includes(searchLower) ||
      c.serial_no?.toLowerCase().includes(searchLower) ||
      c.device_model?.toLowerCase().includes(searchLower) ||
      c.agent_name?.toLowerCase().includes(searchLower) ||
      c.agent_email?.toLowerCase().includes(searchLower) ||
      c.priority?.toLowerCase().includes(searchLower) ||
      c.status?.toLowerCase().includes(searchLower) ||
      c.sla_status?.toLowerCase().includes(searchLower);

    const matchesSLA = !slaFilter || c.sla_status === slaFilter;

    return matchesSearch && matchesSLA;
  });

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

  const breachedCount = complaints.filter((c) => c.sla_status === "Breached")
    .length;
  const atRiskCount = complaints.filter((c) => c.sla_status === "At Risk").length;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="font-display text-2xl font-bold mb-1">All Tickets</h1>
              <p className="text-sm text-muted-foreground">
                View all replacement requests from all agents
              </p>
            </div>
            {(breachedCount > 0 || atRiskCount > 0) && (
              <div className="flex gap-3">
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
              </div>
            )}
          </div>

          <div className="flex gap-3 mb-4">
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
              {(slaFilter) && <span className="text-xs font-bold">1</span>}
            </button>
          </div>

          {showFilters && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-secondary/30 rounded-lg border border-border/50"
            >
              <div className="flex flex-wrap gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    SLA Status
                  </label>
                  <div className="flex gap-2">
                    {(["Within SLA", "At Risk", "Breached"] as const).map((status) => (
                      <button
                        key={status}
                        onClick={() =>
                          setSLAFilter(slaFilter === status ? "" : status)
                        }
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                          slaFilter === status
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary border border-border/50 text-muted-foreground hover:border-primary"
                        }`}
                      >
                        {status}
                      </button>
                    ))}
                    {slaFilter && (
                      <button
                        onClick={() => setSLAFilter("")}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary border border-border/50 text-muted-foreground hover:border-primary flex items-center gap-1"
                      >
                        <X className="h-3 w-3" />
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {loading ? (
          <div className="glass-card rounded-xl p-8 text-center flex items-center justify-center gap-2">
            <Loader className="h-4 w-4 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading tickets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm">No tickets found.</p>
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  {[
                    "Ticket #",
                    "Agent",
                    "Customer",
                    "Account No",
                    "Serial No",
                    "Status",
                    "SLA Status",
                    "Time Remaining",
                    "Priority",
                    "Date",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const slaInfo = getSLAInfo(c);
                  const timeString = slaInfo
                    ? slaInfo.timeRemaining < 0
                      ? `${Math.abs(Math.floor(slaInfo.timeRemaining))}h overdue`
                      : `${Math.floor(slaInfo.timeRemaining)}h left`
                    : "â€”";

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
                      <td className="px-4 py-3 font-mono text-xs text-primary font-semibold">
                        {c.ticket_no}
                      </td>
                      <td className="px-4 py-3 text-foreground text-sm font-medium">
                        {c.agent_name || "â€”"}
                      </td>
                      <td className="px-4 py-3 text-foreground text-sm">
                        {c.customer_name}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {c.customer_account_no || "â€”"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {c.serial_no || "â€”"}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={c.status} />
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
                      <td className="px-4 py-3 text-xs font-mono text-muted-foreground">
                        {timeString}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
                          {c.priority || "medium"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : "â€”"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            setSelected(c);
                            setSelectedSLA(slaInfo);
                          }}
                          className="text-primary hover:text-primary/80 transition-colors"
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
        )}

        {/* Detail Modal */}
        {selected && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => {
              setSelected(null);
              setSelectedSLA(null);
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
                    {selected.ticket_no}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selected.customer_name}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setSelected(null);
                    setSelectedSLA(null);
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* SLA Information */}
                {selectedSLA && (
                  <div>
                    <h3 className="font-semibold mb-3 text-sm">SLA Information</h3>
                    <SLAInfoComponent slaInfo={selectedSLA} />
                  </div>
                )}

                {/* Ticket Details */}
                <div>
                  <h3 className="font-semibold mb-3 text-sm">Ticket Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">STATUS</p>
                      <StatusBadge status={selected.status} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">PRIORITY</p>
                      <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
                        {selected.priority || "medium"}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">AGENT</p>
                      <p className="text-sm">{selected.agent_name || "â€”"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">CREATED</p>
                      <p className="text-sm font-mono text-xs">
                        {new Date(selected.created_at).toLocaleString()}
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
                      <p>{selected.customer_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">PHONE</p>
                      <p>{selected.customer_phone}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">EMAIL</p>
                      <p className="break-all">{selected.customer_email}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">ADDRESS</p>
                      <p>{selected.customer_address}</p>
                    </div>
                    {selected.customer_account_no && (
                      <div>
                        <p className="text-xs text-muted-foreground">ACCOUNT NUMBER</p>
                        <p className="font-mono">{selected.customer_account_no}</p>
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
                      <p>{selected.device_model}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">SERIAL NO</p>
                      <p className="font-mono text-primary">{selected.serial_no}</p>
                    </div>
                    {selected.item_no && (
                      <div>
                        <p className="text-xs text-muted-foreground">ITEM NO</p>
                        <p className="font-mono">{selected.item_no}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Issue Description */}
                <div>
                  <h3 className="font-semibold mb-3 text-sm">ISSUE DESCRIPTION</h3>
                  <p className="text-sm text-muted-foreground bg-secondary/20 p-3 rounded-lg">
                    {selected.issue_description}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}

