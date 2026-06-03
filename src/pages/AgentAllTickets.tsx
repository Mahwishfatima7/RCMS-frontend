import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { SLAStatusBadge } from "@/components/SLAStatusBadge";
import { motion } from "framer-motion";
import { Search, Eye, Loader } from "lucide-react";
import { complaintApi } from "@/services/apiService";
import { usePollingWithSmoothLoading } from "@/hooks/usePolling";

export default function AgentAllTickets() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchComplaints = async () => {
    try {
      const result = await complaintApi.getAll();
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
    true, // enabled
    () => setLoading(false),
    () => {} // Silent updates
  );

  const filtered = complaints.filter(
    (c) =>
      c.ticket_no?.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.serial_no?.toLowerCase().includes(search.toLowerCase()) ||
      c.agent_name?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display text-2xl font-bold mb-1">All Tickets</h1>
        <p className="text-sm text-muted-foreground mb-6">
          View all replacement requests from all agents
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
              No tickets found.
            </p>
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
                    <td className="px-4 py-3 text-foreground text-sm font-medium">
                      {c.agent_name || "—"}
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
                        onClick={() => setSelected(c)}
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
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl p-6 max-w-lg w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display font-bold text-lg">
                  {selected.ticket_no}
                </h2>
                <StatusBadge status={selected.status} />
              </div>

              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">AGENT</p>
                  <p className="text-foreground">{selected.agent_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CUSTOMER</p>
                  <p className="text-foreground">{selected.customer_name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">SERIAL NO</p>
                  <p className="font-mono text-primary">{selected.serial_no}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">DEVICE</p>
                  <p className="text-foreground">{selected.device_model}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">PHONE</p>
                  <p className="text-foreground">{selected.customer_phone}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">EMAIL</p>
                  <p className="text-foreground">{selected.customer_email}</p>
                </div>
                {selected.customer_account_no && (
                  <div>
                    <p className="text-xs text-muted-foreground">ACCOUNT NUMBER</p>
                    <p className="text-foreground">{selected.customer_account_no}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground">ISSUE</p>
                  <p className="text-foreground">{selected.issue_description}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">CREATED</p>
                  <p className="text-foreground">{selected.created_at}</p>
                </div>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="mt-6 w-full px-4 py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all"
              >
                Close
              </button>
            </motion.div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
