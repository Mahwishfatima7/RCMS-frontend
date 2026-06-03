import { Clock, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { SLAStatusBadge } from "./SLAStatusBadge";

interface SLAInfoComponentProps {
  slaInfo?: {
    slaStatus: "Within SLA" | "At Risk" | "Breached";
    slaDeadline: string;
    timeRemaining: number;
    percentageUsed: number;
    priority: string;
    slaDuration: number;
  };
  compact?: boolean;
}

export const SLAInfoComponent: React.FC<SLAInfoComponentProps> = ({
  slaInfo,
  compact = false,
}) => {
  if (!slaInfo) {
    return (
      <div className="text-muted-foreground text-xs">No SLA info available</div>
    );
  }

  const deadline = new Date(slaInfo.slaDeadline);
  const formattedDeadline = deadline.toLocaleString();
  
  const hours = Math.floor(Math.abs(slaInfo.timeRemaining));
  const minutes = Math.floor((Math.abs(slaInfo.timeRemaining) % 1) * 60);
  const timeString = slaInfo.timeRemaining < 0 
    ? `${hours}h ${minutes}m overdue`
    : `${hours}h ${minutes}m remaining`;

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <SLAStatusBadge status={slaInfo.slaStatus} size="sm" />
        <span className="text-xs text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {timeString}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-4 bg-secondary/30 rounded-lg border border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            SLA Status
          </div>
          <SLAStatusBadge status={slaInfo.slaStatus} />
        </div>
        <div className="text-right">
          <div className="text-sm font-medium text-muted-foreground mb-2">
            Priority
          </div>
          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium capitalize">
            {slaInfo.priority}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <div className="text-xs text-muted-foreground mb-1">Time Remaining</div>
          <div className="text-sm font-mono font-semibold text-foreground">
            {timeString}
          </div>
        </div>
        <div>
          <div className="text-xs text-muted-foreground mb-1">Deadline</div>
          <div className="text-sm font-mono text-muted-foreground">
            {formattedDeadline}
          </div>
        </div>
      </div>

      <div>
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs text-muted-foreground">SLA Time Used</div>
          <div className="text-xs font-semibold">{slaInfo.percentageUsed}%</div>
        </div>
        <div className="w-full h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={`h-full transition-all ${
              slaInfo.slaStatus === "Breached"
                ? "bg-red-500"
                : slaInfo.slaStatus === "At Risk"
                ? "bg-amber-500"
                : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(slaInfo.percentageUsed, 100)}%` }}
          />
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        SLA Duration: <span className="font-semibold">{slaInfo.slaDuration}h</span>
      </div>
    </div>
  );
};
