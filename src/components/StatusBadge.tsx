import { statusColors, Complaint } from '@/lib/mock-data';

export function StatusBadge({ status }: { status: Complaint['status'] }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[status]}`}>
      {status}
    </span>
  );
}
