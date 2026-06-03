export type UserRole = 'agent' | 'admin' | 'management';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
}

export interface Complaint {
  id: string;
  ticketNo: string;
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
  status: 'Pending' | 'In-Progress' | 'Replaced' | 'Rejected';
  createdAt: string;
  updatedAt: string;
}

export interface ManufacturerUpdate {
  id: string;
  complaintId: string;
  bookingId: string;
  bookedDate: string;
  manufacturerStatus: string;
  referenceNo: string;
  notes: string;
  updatedAt: string;
}

export interface SerialEntry {
  serialNo: string;
  purchaseDate: string;
  warrantyExpiry: string;
  model: string;
}

export const mockUsers: User[] = [
  { id: '1', name: 'Ahmed Khan', role: 'agent', email: 'ahmed@isp.com' },
  { id: '2', name: 'Sara Admin', role: 'admin', email: 'sara@dxb.net' },
  { id: '3', name: 'Mohammed Dir', role: 'management', email: 'mohammed@dxb.net' },
];

export const mockSerials: SerialEntry[] = [
  { serialNo: 'CAM-2024-001', purchaseDate: '2024-03-15', warrantyExpiry: '2026-03-15', model: 'HikVision DS-2CD2143G2' },
  { serialNo: 'CAM-2024-002', purchaseDate: '2024-06-20', warrantyExpiry: '2026-06-20', model: 'Dahua IPC-HDW3841T' },
  { serialNo: 'CAM-2023-003', purchaseDate: '2023-01-10', warrantyExpiry: '2025-01-10', model: 'HikVision DS-2DE4425IW' },
  { serialNo: 'CAM-2024-004', purchaseDate: '2024-09-01', warrantyExpiry: '2026-09-01', model: 'Dahua IPC-HFW2831T' },
  { serialNo: 'CAM-2023-005', purchaseDate: '2023-07-22', warrantyExpiry: '2025-07-22', model: 'HikVision DS-2CD2347G2' },
];

export const mockComplaints: Complaint[] = [
  {
    id: '1', ticketNo: 'RCMS-2026-0001', agentId: '1', agentName: 'Ahmed Khan',
    customerName: 'Ali Hassan', customerPhone: '+971501234567', customerEmail: 'ali@email.com',
    customerAddress: 'Dubai Marina, Tower 5, Apt 1202', serialNo: 'CAM-2024-001',
    deviceModel: 'HikVision DS-2CD2143G2', issueDescription: 'Camera showing black screen intermittently, IR LEDs not working at night',
    purchaseDate: '2024-03-15', warrantyExpiry: '2026-03-15', warrantyValid: true,
    status: 'Pending', createdAt: '2026-03-28', updatedAt: '2026-03-28',
  },
  {
    id: '2', ticketNo: 'RCMS-2026-0002', agentId: '1', agentName: 'Ahmed Khan',
    customerName: 'Fatima Al-Rashid', customerPhone: '+971559876543', customerEmail: 'fatima@email.com',
    customerAddress: 'JBR, Rimal Tower 3, Unit 805', serialNo: 'CAM-2024-002',
    deviceModel: 'Dahua IPC-HDW3841T', issueDescription: 'Water damage to camera housing, condensation inside lens',
    purchaseDate: '2024-06-20', warrantyExpiry: '2026-06-20', warrantyValid: true,
    status: 'In-Progress', createdAt: '2026-03-26', updatedAt: '2026-03-27',
  },
  {
    id: '3', ticketNo: 'RCMS-2026-0003', agentId: '1', agentName: 'Ahmed Khan',
    customerName: 'Omar Khalil', customerPhone: '+971504445556', customerEmail: 'omar@email.com',
    customerAddress: 'Business Bay, Executive Tower B, Office 1501', serialNo: 'CAM-2023-003',
    deviceModel: 'HikVision DS-2DE4425IW', issueDescription: 'PTZ motor malfunction, camera stuck in one position',
    purchaseDate: '2023-01-10', warrantyExpiry: '2025-01-10', warrantyValid: false,
    status: 'Rejected', createdAt: '2026-03-25', updatedAt: '2026-03-26',
  },
  {
    id: '4', ticketNo: 'RCMS-2026-0004', agentId: '1', agentName: 'Ahmed Khan',
    customerName: 'Layla Mahmoud', customerPhone: '+971507778889', customerEmail: 'layla@email.com',
    customerAddress: 'Downtown Dubai, Burj Views, Apt 2304', serialNo: 'CAM-2024-004',
    deviceModel: 'Dahua IPC-HFW2831T', issueDescription: 'Network connectivity issues, camera goes offline frequently',
    purchaseDate: '2024-09-01', warrantyExpiry: '2026-09-01', warrantyValid: true,
    status: 'In-Progress', createdAt: '2026-03-24', updatedAt: '2026-03-29',
  },
  {
    id: '5', ticketNo: 'RCMS-2026-0005', agentId: '1', agentName: 'Ahmed Khan',
    customerName: 'Youssef Nasser', customerPhone: '+971502223334', customerEmail: 'youssef@email.com',
    customerAddress: 'Al Barsha, Villa 12, Street 4', serialNo: 'CAM-2023-005',
    deviceModel: 'HikVision DS-2CD2347G2', issueDescription: 'Complete hardware failure, no power indicator',
    purchaseDate: '2023-07-22', warrantyExpiry: '2025-07-22', warrantyValid: false,
    status: 'Replaced', createdAt: '2026-03-20', updatedAt: '2026-03-30',
  },
];

export const mockManufacturerUpdates: ManufacturerUpdate[] = [
  {
    id: '1', complaintId: '2', bookingId: 'MFG-DAH-78542',
    bookedDate: '2026-03-27', manufacturerStatus: 'Replacement Approved',
    referenceNo: 'REF-2026-4521', notes: 'Replacement approved, shipping in 2 days',
    updatedAt: '2026-03-27',
  },
  {
    id: '2', complaintId: '4', bookingId: 'MFG-DAH-78601',
    bookedDate: '2026-03-29', manufacturerStatus: 'Under Review',
    referenceNo: 'REF-2026-4588', notes: 'Manufacturer requested additional diagnostics photos',
    updatedAt: '2026-03-29',
  },
  {
    id: '3', complaintId: '5', bookingId: 'MFG-HIK-32104',
    bookedDate: '2026-03-22', manufacturerStatus: 'Replacement Delivered',
    referenceNo: 'REF-2026-4302', notes: 'Camera replaced and installed at customer premises',
    updatedAt: '2026-03-30',
  },
];

export const statusColors: Record<Complaint['status'], string> = {
  'Pending': 'bg-warning/20 text-warning border-warning/30',
  'In-Progress': 'bg-primary/20 text-primary border-primary/30',
  'Replaced': 'bg-success/20 text-success border-success/30',
  'Rejected': 'bg-destructive/20 text-destructive border-destructive/30',
};
