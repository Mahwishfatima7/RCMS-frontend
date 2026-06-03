import { Complaint, ManufacturerUpdate, mockComplaints, mockManufacturerUpdates, mockSerials } from './mock-data';

// Simple in-memory store that persists across components
let complaints: Complaint[] = [...mockComplaints];
let manufacturerUpdates: ManufacturerUpdate[] = [...mockManufacturerUpdates];
let nextTicketNum = 6; // Start after existing mock data

// Fix existing ticket numbers to new format
complaints = complaints.map((c, i) => ({
  ...c,
  ticketNo: `RCMS-${String(i + 1).padStart(6, '0')}`,
}));

export function getComplaints() {
  return complaints;
}

export function getComplaintsByAgent(agentId: string) {
  return complaints.filter(c => c.agentId === agentId);
}

export function getManufacturerUpdates() {
  return manufacturerUpdates;
}

export function getManufacturerUpdate(complaintId: string) {
  return manufacturerUpdates.find(u => u.complaintId === complaintId);
}

export function addComplaint(data: {
  agentId: string;
  agentName: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerAddress: string;
  serialNo: string;
  deviceModel: string;
  issueDescription: string;
  purchaseDate: string;
  warrantyExpiry: string;
  warrantyValid: boolean;
}): Complaint {
  const ticketNo = `RCMS-${String(nextTicketNum).padStart(6, '0')}`;
  const now = new Date().toISOString().split('T')[0];
  const complaint: Complaint = {
    id: String(nextTicketNum),
    ticketNo,
    ...data,
    status: 'Pending',
    createdAt: now,
    updatedAt: now,
  };
  nextTicketNum++;
  complaints = [complaint, ...complaints];
  return complaint;
}

export function updateComplaintStatus(complaintId: string, status: Complaint['status']) {
  complaints = complaints.map(c =>
    c.id === complaintId ? { ...c, status, updatedAt: new Date().toISOString().split('T')[0] } : c
  );
}

export function addManufacturerUpdate(data: Omit<ManufacturerUpdate, 'id' | 'updatedAt'>) {
  const update: ManufacturerUpdate = {
    ...data,
    id: String(manufacturerUpdates.length + 1),
    updatedAt: new Date().toISOString().split('T')[0],
  };
  manufacturerUpdates = [...manufacturerUpdates, update];
  return update;
}

export function validateSerial(serialNo: string) {
  const found = mockSerials.find(s => s.serialNo.toLowerCase() === serialNo.toLowerCase());
  if (!found) return { status: 'not-found' as const, entry: null };
  const expired = new Date(found.warrantyExpiry) < new Date();
  return { status: expired ? 'expired' as const : 'valid' as const, entry: found };
}
