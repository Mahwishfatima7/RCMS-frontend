import { AlertTriangle, CheckCircle, XCircle, Clock } from "lucide-react";

interface SLAStatusBadgeProps {
  status: "Within SLA" | "At Risk" | "Breached";
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
}

export const SLAStatusBadge: React.FC<SLAStatusBadgeProps> = ({
  status,
  size = "md",
  showIcon = true,
}) => {
  // Normalize status to handle variations
  const normalizeStatus = (s: string) => {
    if (!s) return "Within SLA";
    const trimmed = s.trim().toLowerCase();
    if (trimmed.includes("breach")) return "Breached";
    if (trimmed.includes("risk")) return "At Risk";
    if (trimmed.includes("within")) return "Within SLA";
    return "Within SLA";
  };

  const normalizedStatus = normalizeStatus(status);

  const getStyles = (status: string) => {
    switch (status) {
      case "Within SLA":
        return {
          bg: "bg-emerald-500/20",
          text: "text-emerald-600",
          border: "border-emerald-200",
          icon: showIcon ? <CheckCircle className={getSizeClass("icon")} /> : null,
        };
      case "At Risk":
        return {
          bg: "bg-amber-500/20",
          text: "text-amber-600",
          border: "border-amber-200",
          icon: showIcon ? <AlertTriangle className={getSizeClass("icon")} /> : null,
        };
      case "Breached":
        return {
          bg: "bg-red-500/20",
          text: "text-red-600",
          border: "border-red-200",
          icon: showIcon ? <XCircle className={getSizeClass("icon")} /> : null,
        };
      default:
        return {
          bg: "bg-gray-500/20",
          text: "text-gray-600",
          border: "border-gray-200",
          icon: showIcon ? <Clock className={getSizeClass("icon")} /> : null,
        };
    }
  };

  const getSizeClass = (type: "text" | "icon" | "padding") => {
    if (type === "text") {
      switch (size) {
        case "sm":
          return "text-xs";
        case "lg":
          return "text-base";
        default:
          return "text-sm";
      }
    } else if (type === "icon") {
      switch (size) {
        case "sm":
          return "h-3 w-3";
        case "lg":
          return "h-5 w-5";
        default:
          return "h-4 w-4";
      }
    }
    return "";
  };

  const styles = getStyles(normalizedStatus);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border ${styles.bg} ${styles.text} ${styles.border} ${getSizeClass("text")} font-medium whitespace-nowrap`}
    >
      {styles.icon}
      <span>{normalizedStatus}</span>
    </span>
  );
};
