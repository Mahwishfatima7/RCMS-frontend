import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { SLAStatusBadge } from "@/components/SLAStatusBadge";
import { SLAInfoComponent } from "@/components/SLAInfoComponent";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import { Search, Eye, Loader, X } from "lucide-react";
import { complaintApi } from "@/services/apiService";
import { usePollingWithSmoothLoading } from "@/hooks/usePolling";

export default function AgentTickets() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [selectedSLA, setSelectedSLA] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const fetchComplaints = async () => {
    if (!user) return;
    try {
      const result = await complaintApi.getByAgent(user.id);
      if (result.success) {
        setComplaints(result.data?.complaints || []);
      }
    } catch (error) {
      console.error("Failed to fetch complaints:", error);
    }
  };

  usePollingWithSmoothLoading(
    fetchComplaints,
    60000, // 60 seconds
    !!user, // enabled when user is available
    () => setLoading(false),
    () => {} // Silent updates
  );

  const filtered = complaints.filter(
    (c) =>
      c.ticket_no?.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.serial_no?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display text-2xl font-bold mb-1">My Tickets</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Track your submitted replacement requests
        </p>

        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tickets..."
            className="w-full pl-9 pr-3 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        {loading ? (
          <div className="glass-card rounded-xl p-8 text-center flex items-center justify-center gap-2">
            <Loader className="h-4 w-4 animate-spin" />
            <p className="text-muted-foreground text-sm">Loading tickets...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <p className="text-muted-foreground text-sm">
              No tickets found. Submit a new complaint to get started.
            </p>
          </div>
        ) : (
          <div className="glass-card rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  {[
                    "Ticket #",
                    "Customer",
                    "Account No",
                    "Serial No",
                    "Device",
                    "Priority",
                    "SLA Status",
                    "Status",
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
                {filtered.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/30 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-primary">
                      {c.ticket_no}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {c.customer_name}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {c.customer_account_no || "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {c.serial_no}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">
                      {c.device_model}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        c.priority === 'critical' ? 'bg-red-500/20 text-red-600' :
                        c.priority === 'high' ? 'bg-orange-500/20 text-orange-600' :
                        c.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
                        'bg-blue-500/20 text-blue-600'
                      }`}>
                        {c.priority?.charAt(0).toUpperCase() + c.priority?.slice(1) || 'Medium'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <SLAStatusBadge status={c.sla_status} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {c.created_at}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          setSelected(c);
                          setSelectedSLA(getSLAInfo(c));
                        }}
                        className="text-primary hover:text-primary/80"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

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

                {/* Ticket Information */}
                <div>
                  <h3 className="font-semibold mb-3 text-sm">Ticket Details</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">STATUS</p>
                      <StatusBadge status={selected.status} />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">PRIORITY</p>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                        selected.priority === 'critical' ? 'bg-red-500/20 text-red-600' :
                        selected.priority === 'high' ? 'bg-orange-500/20 text-orange-600' :
                        selected.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-600' :
                        'bg-blue-500/20 text-blue-600'
                      }`}>
                        {selected.priority?.charAt(0).toUpperCase() + selected.priority?.slice(1) || 'Medium'}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">DEVICE MODEL</p>
                      <p>{selected.device_model}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">CREATED</p>
                      <p className="text-xs font-mono">
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
                      <p className="text-xs text-muted-foreground">SERIAL NO</p>
                      <p className="font-mono text-primary">{selected.serial_no}</p>
                    </div>
                    {selected.item_no && (
                      <div>
                        <p className="text-xs text-muted-foreground">ITEM NO</p>
                        <p className="font-mono">{selected.item_no}</p>
                      </div>
                    )}
                    {selected.item_description && (
                      <div>
                        <p className="text-xs text-muted-foreground">ITEM DESCRIPTION</p>
                        <p>{selected.item_description}</p>
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
