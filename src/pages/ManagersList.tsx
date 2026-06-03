import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/AppLayout';
import { StatusBadge } from '@/components/StatusBadge';
import { SLAStatusBadge } from '@/components/SLAStatusBadge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Loader, ChevronRight, X, Search } from 'lucide-react';
import { toast } from 'sonner';

interface Manager {
  id: number;
  name: string;
  email: string;
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
  customer_name: string;
  customer_phone: string;
  serial_no: string;
  device_model: string;
  status: string;
  priority: string;
  sla_status?: string;
  created_at: string;
}

export default function ManagersList() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedManager, setSelectedManager] = useState<Manager | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loadingComplaints, setLoadingComplaints] = useState(false);
  const [agentSearch, setAgentSearch] = useState('');
  const [complaintSearch, setComplaintSearch] = useState('');

  // Fetch managers on mount
  useEffect(() => {
    const fetchManagers = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('auth_token');
        const response = await fetch('/api/users/managers', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) throw new Error('Failed to fetch managers');
        
        const data = await response.json();
        let managersList = data.data || [];
        
        // Sort managers by name (Manager One, Manager Two, etc.)
        const numberWords: { [key: string]: number } = {
          'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5, 
          'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10
        };
        
        managersList.sort((a: Manager, b: Manager) => {
          const wordA = a.name.toLowerCase().split(' ').pop() || '';
          const wordB = b.name.toLowerCase().split(' ').pop() || '';
          const numA = numberWords[wordA] || 999;
          const numB = numberWords[wordB] || 999;
          return numA - numB;
        });
        
        setManagers(managersList);
        
        // Auto-select first manager
        if (managersList.length > 0) {
          setSelectedManager(managersList[0]);
        }
      } catch (err) {
                toast.error('Failed to load managers');
      } finally {
        setLoading(false);
      }
    };

    fetchManagers();
  }, []);

  // Fetch complaints when agent is selected
  useEffect(() => {
    if (!selectedAgent || !selectedManager) return;

    const fetchComplaints = async () => {
      setLoadingComplaints(true);
      try {
        const token = localStorage.getItem('auth_token');
        const response = await fetch(
          `/api/complaints/manager/${encodeURIComponent(selectedManager.name)}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );

        if (!response.ok) throw new Error('Failed to fetch complaints');
        
        const data = await response.json();
        let allComplaints = data.data?.complaints || [];
        
        // Filter by selected agent
        const filtered = allComplaints.filter(
          (c: Complaint) => c.agent_id === selectedAgent.id
        );
        setComplaints(filtered);
      } catch (err) {
                toast.error('Failed to load complaints');
        setComplaints([]);
      } finally {
        setLoadingComplaints(false);
      }
    };

    fetchComplaints();
  }, [selectedAgent, selectedManager]);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Managers & Agents</h1>
          <p className="text-muted-foreground mt-1">View managers, their agents, and agent complaints</p>
        </div>

        {/* Managers Buttons Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Manager
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Loading managers...</span>
              </div>
            ) : managers.length === 0 ? (
              <p className="text-center text-muted-foreground">No managers found</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {managers.map((manager) => (
                  <button
                    key={manager.id}
                    onClick={() => {
                      setSelectedManager(manager);
                      setSelectedAgent(null);
                      setComplaints([]);
                      setComplaintSearch('');
                    }}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedManager?.id === manager.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                    }`}
                  >
                    <p className="font-semibold text-foreground">{manager.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{manager.email}</p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {manager.agentCount} agents
                    </Badge>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Agents Section */}
        {selectedManager && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Agents - {selectedManager.name}
              </CardTitle>
              <CardDescription>
                {selectedManager.agents?.length || 0} agents assigned
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedManager.agents && selectedManager.agents.length > 0 ? (
                <>
                  <div className="mb-4 flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-lg border border-border">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search agents by name or email..."
                      value={agentSearch}
                      onChange={(e) => setAgentSearch(e.target.value)}
                      className="bg-transparent outline-none flex-1 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    {selectedManager.agents
                      .filter((agent) =>
                        agent.name.toLowerCase().includes(agentSearch.toLowerCase()) ||
                        agent.email.toLowerCase().includes(agentSearch.toLowerCase())
                      )
                      .map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => {
                          setSelectedAgent(agent);
                          setComplaintSearch('');
                        }}
                        className={`p-4 rounded-lg border-2 transition-all text-left ${
                          selectedAgent?.id === agent.id
                            ? 'border-primary bg-primary/10'
                            : 'border-border hover:border-primary/50 hover:bg-secondary/30'
                      }`}
                    >
                      <div className="flex flex-col">
                        <p className="font-semibold text-foreground">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">{agent.email}</p>
                        {agent.phone && (
                          <p className="text-xs text-muted-foreground mt-1">{agent.phone}</p>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </>
              ) : (
                <p className="text-center text-muted-foreground">No agents assigned to this manager</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Complaints Section */}
        {selectedAgent && selectedManager && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Complaints - {selectedAgent.name}</span>
                <button
                  onClick={() => setSelectedAgent(null)}
                  className="p-1 hover:bg-secondary rounded"
                >
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </CardTitle>
              <CardDescription>
                {complaints.length} complaint(s) found
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingComplaints ? (
                <div className="flex items-center justify-center gap-2 py-8">
                  <Loader className="h-5 w-5 animate-spin" />
                  <span className="text-muted-foreground">Loading complaints...</span>
                </div>
              ) : complaints.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No complaints found for this agent
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-lg border border-border">
                    <Search className="h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search complaints by ticket, customer, or serial..."
                      value={complaintSearch}
                      onChange={(e) => setComplaintSearch(e.target.value)}
                      className="bg-transparent outline-none flex-1 text-sm"
                    />
                  </div>
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
                        {complaints
                          .filter((complaint) =>
                            complaint.ticket_no.toLowerCase().includes(complaintSearch.toLowerCase()) ||
                            complaint.customer_name.toLowerCase().includes(complaintSearch.toLowerCase()) ||
                            complaint.serial_no.toLowerCase().includes(complaintSearch.toLowerCase())
                          )
                          .map((complaint) => (
                        <tr
                          key={complaint.id}
                          className="border-b hover:bg-secondary/50 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-xs font-semibold">
                            {complaint.ticket_no}
                          </td>
                          <td className="px-4 py-3">
                            <div className="font-medium">{complaint.customer_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {complaint.customer_phone}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs">
                            {complaint.device_model}
                            <div className="text-muted-foreground">{complaint.serial_no}</div>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={complaint.status} />
                          </td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="text-xs capitalize">
                              {complaint.priority}
                            </Badge>
                          </td>
                          <td className="px-4 py-3">
                            <SLAStatusBadge status={complaint.sla_status || 'Unknown'} />
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(complaint.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}

