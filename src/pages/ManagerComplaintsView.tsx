import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { SLAStatusBadge } from "@/components/SLAStatusBadge";
import { complaintApi, userApi } from "@/services/apiService";
import { motion } from "framer-motion";
import {
  Download,
  Filter,
  Loader,
  Search,
  Eye,
  X,
  Users,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Manager {
  id: number;
  name: string;
  email: string;
  phone?: string;
  agentCount: number;
  agents?: Agent[];
}

interface Agent {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

interface Complaint {
  id: number;
  ticket_no: string;
  agent_id: number;
  agent_name: string;
  agent_email: string;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  customer_account_no: string;
  serial_no: string;
  device_model: string;
  issue_description: string;
  status: "Pending" | "In-Progress" | "Replaced" | "Rejected";
  priority: "low" | "medium" | "high" | "critical";
  sla_status?: "Within SLA" | "At Risk" | "Breached";
  created_at: string;
  updated_at: string;
}

export default function ManagerComplaintsView() {
  // State management
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [expandedAgents, setExpandedAgents] = useState<Set<number>>(new Set());
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);

  // Filters and search
  const [statusFilter, setStatusFilter] = useState<string>("All");
  const [slaFilter, setSLAFilter] = useState<string>("All");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Loading states
  const [loadingManagers, setLoadingManagers] = useState(false);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(
    null
  );

  // Fetch managers on mount
  useEffect(() => {
    const fetchManagers = async () => {
      setLoadingManagers(true);
      try {
        const result = await userApi.getManagers();
        if (result.success) {
          const managersList = result.data || [];
          setManagers(managersList);
          // Auto-select first manager
          if (managersList.length > 0) {
            setSelectedManager(managersList[0]);
          }
        } else {
          toast.error("Failed to load managers");
        }
      } catch (error) {
                toast.error("Failed to load managers");
      } finally {
        setLoadingManagers(false);
      }
    };

    fetchManagers();
  }, []);

  // Fetch complaints for selected manager
  useEffect(() => {
    const fetchComplaints = async () => {
      if (!selectedManager || !selectedAgent) return;

      setLoadingComplaints(true);
      try {
        const result = await complaintApi.getByManager(selectedManager.name);
        if (result.success) {
          let complaints = result.data?.complaints || [];

          // Filter by selected agent
          if (selectedAgent) {
            complaints = complaints.filter(
              (c: Complaint) => c.agent_id === selectedAgent.id
            );
          }

          setComplaints(complaints);
        } else {
          toast.error("Failed to load complaints");
          setComplaints([]);
        }
      } catch (error) {
                toast.error("Failed to load complaints");
        setComplaints([]);
      } finally {
        setLoadingComplaints(false);
      }
    };

    fetchComplaints();
  }, [selectedManager, selectedAgent]);

  // Filter complaints based on search and filters
  const filteredComplaints = complaints.filter((complaint) => {
    // Search filter
    const searchLower = search.toLowerCase();
    const matchesSearch =
      !search ||
      complaint.ticket_no?.toLowerCase().includes(searchLower) ||
      complaint.customer_name?.toLowerCase().includes(searchLower) ||
      complaint.customer_phone?.toLowerCase().includes(searchLower) ||
      complaint.customer_email?.toLowerCase().includes(searchLower) ||
      complaint.serial_no?.toLowerCase().includes(searchLower) ||
      complaint.device_model?.toLowerCase().includes(searchLower) ||
      complaint.priority?.toLowerCase().includes(searchLower);

    // Status filter
    const matchesStatus =
      statusFilter === "All" || complaint.status === statusFilter;

    // SLA filter
    const matchesSLA = slaFilter === "All" || complaint.sla_status === slaFilter;

    return matchesSearch && matchesStatus && matchesSLA;
  });

  // Toggle agent expansion
  const toggleAgent = (agentId: number) => {
    const newExpanded = new Set(expandedAgents);
    if (newExpanded.has(agentId)) {
      newExpanded.delete(agentId);
    } else {
      newExpanded.add(agentId);
    }
    setExpandedAgents(newExpanded);
  };

  // Export to CSV
  const exportCSV = () => {
    if (filteredComplaints.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = [
      "Ticket No",
      "Agent",
      "Customer",
      "Phone",
      "Device",
      "Serial #",
      "Status",
      "Priority",
      "SLA Status",
      "Created",
    ];

    const rows = filteredComplaints.map((c) => [
      c.ticket_no,
      c.agent_name,
      c.customer_name,
      c.customer_phone,
      c.device_model,
      c.serial_no,
      c.status,
      c.priority,
      c.sla_status || "Unknown",
      new Date(c.created_at).toLocaleDateString(),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => {
            const str = String(cell || "");
            return str.includes(",") ? `"${str}"` : str;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `manager-complaints-${new Date().toISOString().split("T")[0]}.csv`
    );
    link.click();

    toast.success("Report exported successfully");
  };

  const breachedCount = complaints.filter(
    (c) => c.sla_status === "Breached"
  ).length;
  const atRiskCount = complaints.filter((c) => c.sla_status === "At Risk").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Manager Complaints View</h1>
          <p className="text-muted-foreground mt-1">
            Hierarchical view of managers, their agents, and complaints
          </p>
        </div>

        {/* Manager Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingManagers ? (
              <div className="flex items-center justify-center gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Loading managers...</span>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {managers.map((manager) => (
                  <button
                    key={manager.id}
                    onClick={() => {
                      setSelectedManager(manager);
                      setSelectedAgent(null);
                      setComplaints([]);
                    }}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedManager?.id === manager.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="font-semibold text-foreground">
                      {manager.name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {manager.email}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {manager.agentCount} agents
                      </Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Manager Details - Agents and Complaints */}
        {selectedManager && (
          <>
            {/* Agents Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Agents under {selectedManager.name}
                </CardTitle>
                <CardDescription>
                  {selectedManager.agents?.length || 0} agents assigned
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedManager.agents && selectedManager.agents.length > 0 ? (
                  <div className="space-y-2">
                    {selectedManager.agents.map((agent) => (
                      <motion.div
                        key={agent.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <button
                          onClick={() => {
                            setSelectedAgent(
                              selectedAgent?.id === agent.id ? null : agent
                            );
                            toggleAgent(agent.id);
                          }}
                          className={`w-full p-4 rounded-lg border transition-all text-left flex items-center justify-between ${
                            selectedAgent?.id === agent.id
                              ? "border-primary bg-primary/5"
                              : "border-border hover:border-primary/50"
                          }`}
                        >
                          <div className="flex-1">
                            <div className="font-semibold text-foreground">
                              {agent.name}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {agent.email}
                              {agent.phone && ` â€¢ ${agent.phone}`}
                            </div>
                          </div>
                          {expandedAgents.has(agent.id) ? (
                            <ChevronDown className="h-4 w-4 text-primary" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>

                        {/* Agent's Complaints */}
                        {expandedAgents.has(agent.id) && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            className="mt-2 ml-4 pl-4 border-l-2 border-primary/30 space-y-2"
                          >
                            {loadingComplaints ? (
                              <div className="flex items-center justify-center gap-2 py-4">
                                <Loader className="h-4 w-4 animate-spin" />
                                <span className="text-sm text-muted-foreground">
                                  Loading complaints...
                                </span>
                              </div>
                            ) : filteredComplaints.length === 0 ? (
                              <p className="text-sm text-muted-foreground py-2">
                                No complaints for this agent
                              </p>
                            ) : (
                              <div className="text-sm text-muted-foreground">
                                {filteredComplaints.length} complaint(s) found
                              </div>
                            )}
                          </motion.div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">
                    No agents assigned to this manager
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Complaints Section */}
            {selectedAgent && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        Complaints - {selectedAgent.name}
                      </CardTitle>
                      <CardDescription>
                        Total: {complaints.length} | Showing:{" "}
                        {filteredComplaints.length}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowFilters(!showFilters)}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <Filter className="h-4 w-4" />
                      </button>
                      <button
                        onClick={exportCSV}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </CardHeader>

                {/* Filters */}
                {showFilters && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="px-6 pb-4 space-y-3"
                  >
                    <div>
                      <label className="text-sm font-medium">Search</label>
                      <Input
                        placeholder="Search by ticket, customer, device..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="mt-2"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Status</label>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All Statuses</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="In-Progress">
                              In-Progress
                            </SelectItem>
                            <SelectItem value="Replaced">Replaced</SelectItem>
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="text-sm font-medium">SLA Status</label>
                        <Select value={slaFilter} onValueChange={setSLAFilter}>
                          <SelectTrigger className="mt-2">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All">All</SelectItem>
                            <SelectItem value="Within SLA">
                              Within SLA
                            </SelectItem>
                            <SelectItem value="At Risk">At Risk</SelectItem>
                            <SelectItem value="Breached">Breached</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {(breachedCount > 0 || atRiskCount > 0) && (
                      <div className="flex gap-2">
                        {breachedCount > 0 && (
                          <Badge variant="destructive">
                            {breachedCount} Breached
                          </Badge>
                        )}
                        {atRiskCount > 0 && (
                          <Badge variant="secondary">
                            {atRiskCount} At Risk
                          </Badge>
                        )}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Complaints Table */}
                <CardContent>
                  {loadingComplaints ? (
                    <div className="flex items-center justify-center gap-2 py-8">
                      <Loader className="h-5 w-5 animate-spin" />
                      <span className="text-muted-foreground">
                        Loading complaints...
                      </span>
                    </div>
                  ) : filteredComplaints.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No complaints found
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b">
                          <tr className="text-left text-xs font-semibold text-muted-foreground">
                            <th className="px-4 py-2">Ticket #</th>
                            <th className="px-4 py-2">Customer</th>
                            <th className="px-4 py-2">Device</th>
                            <th className="px-4 py-2">Status</th>
                            <th className="px-4 py-2">Priority</th>
                            <th className="px-4 py-2">SLA</th>
                            <th className="px-4 py-2">Created</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredComplaints.map((complaint) => (
                            <motion.tr
                              key={complaint.id}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              onClick={() => setSelectedComplaint(complaint)}
                              className="border-b hover:bg-secondary/50 cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-3 font-mono text-xs font-semibold">
                                {complaint.ticket_no}
                              </td>
                              <td className="px-4 py-3">
                                <div className="font-medium">
                                  {complaint.customer_name}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {complaint.customer_phone}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-xs">
                                {complaint.device_model}
                                <div className="text-muted-foreground">
                                  {complaint.serial_no}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <StatusBadge status={complaint.status} />
                              </td>
                              <td className="px-4 py-3">
                                <Badge
                                  variant={
                                    complaint.priority === "critical"
                                      ? "destructive"
                                      : "secondary"
                                  }
                                  className="text-xs capitalize"
                                >
                                  {complaint.priority}
                                </Badge>
                              </td>
                              <td className="px-4 py-3">
                                {complaint.sla_status && (
                                  <SLAStatusBadge
                                    status={complaint.sla_status}
                                  />
                                )}
                              </td>
                              <td className="px-4 py-3 text-xs text-muted-foreground">
                                {new Date(complaint.created_at).toLocaleDateString()}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Complaint Detail Modal */}
        {selectedComplaint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedComplaint(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-background rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">
                      {selectedComplaint.ticket_no}
                    </h2>
                    <p className="text-muted-foreground">
                      {selectedComplaint.customer_name}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedComplaint(null)}
                    className="p-2 hover:bg-secondary rounded-lg transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Status
                    </label>
                    <StatusBadge status={selectedComplaint.status} />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Priority
                    </label>
                    <Badge variant="secondary" className="capitalize">
                      {selectedComplaint.priority}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      SLA Status
                    </label>
                    {selectedComplaint.sla_status && (
                      <SLAStatusBadge
                        status={selectedComplaint.sla_status}
                      />
                    )}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Agent
                    </label>
                    <p className="font-medium">{selectedComplaint.agent_name}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Customer Details
                  </label>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-medium">Email:</span>{" "}
                      {selectedComplaint.customer_email}
                    </p>
                    <p>
                      <span className="font-medium">Phone:</span>{" "}
                      {selectedComplaint.customer_phone}
                    </p>
                    <p>
                      <span className="font-medium">Account:</span>{" "}
                      {selectedComplaint.customer_account_no}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Device & Serial
                  </label>
                  <p className="text-sm">{selectedComplaint.device_model}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {selectedComplaint.serial_no}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">
                    Issue Description
                  </label>
                  <p className="text-sm whitespace-pre-wrap">
                    {selectedComplaint.issue_description}
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </AppLayout>
  );
}

