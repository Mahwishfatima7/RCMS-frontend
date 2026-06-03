import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import {
  CheckCircle,
  AlertTriangle,
  XCircle,
  Send,
  Loader,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { serialApi, complaintApi } from "@/services/apiService";

export default function AgentNewComplaint() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [serialNo, setSerialNo] = useState("");
  const [serialStatus, setSerialStatus] = useState<
    "valid" | "expired" | "not-found" | null
  >(null);
  const [serialEntry, setSerialEntry] = useState<any>(null);
  const [validating, setValidating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    customerAddress: "",
    customerAccountNo: "",
    issueDescription: "",
    priority: "medium" as "low" | "medium" | "high" | "critical",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [complaintNumber, setComplaintNumber] = useState("");
  const [duplicateComplaintError, setDuplicateComplaintError] = useState("");
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  // Debounced serial validation
  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (serialNo.length === 0) {
      setSerialStatus(null);
      setSerialEntry(null);
      return;
    }

    // Set debounce timer for serial validation
    debounceTimer.current = setTimeout(async () => {
      setValidating(true);
      setDuplicateComplaintError("");
      try {
        const result = await serialApi.validate(serialNo);
        if (result.success && result.data.exists) {
          const serial = result.data.serial;
          setSerialEntry({
            serial_number: serial.serial_number,
            item_no: serial.item_no,
            item_description: serial.item_description,
          });
          setSerialStatus("valid");

          // Check if a complaint already exists for this serial number
          const complaintsResult = await complaintApi.getAll();
          if (complaintsResult.success) {
            const existingComplaint = complaintsResult.data?.complaints?.find(
              (c: any) => c.serial_no === serialNo && c.status !== "Rejected"
            );
            if (existingComplaint) {
              setDuplicateComplaintError(
                `⚠ Complaint already registered for this camera (Ticket: ${existingComplaint.ticket_no})`
              );
            }
          }
        } else {
          setSerialStatus("not-found");
          setSerialEntry(null);
        }
      } catch (error) {
        setSerialStatus("not-found");
        setSerialEntry(null);
      } finally {
        setValidating(false);
      }
    }, 500); // 500ms debounce

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [serialNo]);
  const validateCustomerName = (name: string) => {
    if (!name.trim()) return "Full name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    return "";
  };

  const validateCustomerPhone = (phone: string) => {
    if (!phone.trim()) return "Phone number is required";
    if (!/^[\d\s\-\+\(\)]+$/.test(phone)) return "Please enter a valid phone number";
    if (phone.replace(/\D/g, "").length < 7) return "Phone number must be at least 7 digits";
    return "";
  };

  const validateCustomerEmail = (email: string) => {
    if (!email.trim()) return "Email is required";
    if (!email.includes("@") || !email.includes(".")) {
      return "Please enter a valid email address";
    }
    return "";
  };

  const validateIssueDescription = (desc: string) => {
    if (!desc.trim()) return "Issue description is required";
    if (desc.trim().length < 10) return "Description must be at least 10 characters";
    return "";
  };

  const validateCustomerAccountNo = (accountNo: string) => {
    if (!accountNo.trim()) return "Account number is required";
    return "";
  };

  // Handle field changes with validation
  const handleFieldChange = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    
    let error = "";
    if (key === "customerName") error = validateCustomerName(value);
    else if (key === "customerPhone") error = validateCustomerPhone(value);
    else if (key === "customerEmail") error = validateCustomerEmail(value);
    else if (key === "customerAccountNo") error = validateCustomerAccountNo(value);
    else if (key === "issueDescription") error = validateIssueDescription(value);

    setFieldErrors((prev) => ({
      ...prev,
      [key]: error,
    }));
  };

  const handleSerialInput = (val: string) => {
    setSerialNo(val);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !serialEntry) return;

    // Validate all fields
    const errors: Record<string, string> = {
      customerName: validateCustomerName(form.customerName),
      customerPhone: validateCustomerPhone(form.customerPhone),
      customerEmail: validateCustomerEmail(form.customerEmail),
      customerAccountNo: validateCustomerAccountNo(form.customerAccountNo),
      issueDescription: validateIssueDescription(form.issueDescription),
    };

    setFieldErrors(errors);

    // Check if there are any errors
    const hasErrors = Object.values(errors).some((err) => err !== "");
    if (hasErrors) {
      toast.error("Please fix the errors above");
      return;
    }

    setSubmitting(true);
    try {
      const result = await complaintApi.create({
        customerName: form.customerName,
        customerPhone: form.customerPhone,
        customerEmail: form.customerEmail,
        customerAddress: form.customerAddress,
        customerAccountNo: form.customerAccountNo,
        serialNo: serialEntry.serial_number,
        deviceModel: serialEntry.item_description,
        issueDescription: form.issueDescription,
        priority: form.priority,
      });

      if (result.success) {
        const ticketNo = result.data?.complaint?.ticket_no || "Unknown";
        setComplaintNumber(ticketNo);
        setShowSuccessModal(true);
        toast.success("Complaint submitted successfully!");
      } else {
        // Handle duplicate complaint error
        if (result.error && result.error.includes("already registered")) {
          setDuplicateComplaintError(result.error);
          toast.error(result.error);
        } else {
          toast.error(result.error || "Failed to submit complaint");
        }
      }
    } catch (error) {
      toast.error("An error occurred while submitting");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold mb-1">
            New Replacement Request
          </h1>
          <p className="text-sm text-muted-foreground">
            Submit a camera replacement complaint for a customer
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
          {/* Serial Validation */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-sm text-foreground">
              Device Verification
            </h2>
            <p className="text-xs text-muted-foreground">
              Enter the camera serial number to verify it was supplied by DXB
              Technologies and check warranty status.
            </p>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Camera Serial Number *
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={serialNo}
                  onChange={(e) => handleSerialInput(e.target.value)}
                  placeholder="AK-XXXX-XXXXX"
                  className="w-full px-3 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                {validating && (
                  <Loader className="absolute right-3 top-3 h-4 w-4 animate-spin text-primary" />
                )}
                {!validating && serialStatus === "valid" && (
                  <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-success" />
                )}
                {!validating && serialStatus === "expired" && (
                  <AlertTriangle className="absolute right-3 top-3 h-4 w-4 text-warning" />
                )}
                {!validating && serialStatus === "not-found" && (
                  <XCircle className="absolute right-3 top-3 h-4 w-4 text-destructive" />
                )}
              </div>
              {serialStatus === "not-found" && (
                <p className="text-xs text-destructive mt-1">
                  Serial number not found — this camera is not in DXB's records
                </p>
              )}
              {serialStatus === "expired" && (
                <p className="text-xs text-warning mt-1">
                  ⚠ Warranty expired — complaint will be flagged for review
                </p>
              )}
              {serialStatus === "valid" && (
                <p className="text-xs text-success mt-1">
                  ✓ Device verified
                </p>
              )}
              {duplicateComplaintError && (
                <p className="text-xs text-warning mt-1">
                  {duplicateComplaintError}
                </p>
              )}
            </div>

            {serialEntry && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="grid grid-cols-2 gap-3 p-3 bg-secondary/30 rounded-lg"
              >
                <div>
                  <p className="text-[10px] text-muted-foreground">Item Number</p>
                  <p className="text-xs font-medium text-foreground">
                    {serialEntry.item_no}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] text-muted-foreground">
                    Item Description
                  </p>
                  <p className="text-xs font-medium text-foreground">
                    {serialEntry.item_description}
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Customer Info */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-sm text-foreground">
              Customer Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {[
                {
                  key: "customerName",
                  label: "Full Name *",
                  placeholder: "Customer full name",
                },
                {
                  key: "customerPhone",
                  label: "Phone *",
                  placeholder: "+971...",
                },
                {
                  key: "customerEmail",
                  label: "Email *",
                  placeholder: "customer@email.com",
                },
                {
                  key: "customerAccountNo",
                  label: "Account Number *",
                  placeholder: "e.g., 123456",
                },
                {
                  key: "customerAddress",
                  label: "Address",
                  placeholder: "Full address",
                },
              ].map((f) => (
                <div key={f.key} className={f.key === "customerAddress" ? "col-span-2" : ""}>
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {f.label}
                  </label>
                  <input
                    type="text"
                    value={form[f.key as keyof typeof form]}
                    onChange={(e) =>
                      handleFieldChange(f.key, e.target.value)
                    }
                    placeholder={f.placeholder}
                    disabled={submitting}
                    className={`mt-1 w-full px-3 py-2.5 bg-secondary/50 border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all disabled:opacity-50 ${
                      fieldErrors[f.key]
                        ? "border-red-500/50 focus:ring-red-500/50"
                        : "border-border/50 focus:ring-primary/50"
                    }`}
                  />
                  {fieldErrors[f.key] && (
                    <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      {fieldErrors[f.key]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Issue */}
          <div className="glass-card rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-sm text-foreground">
              Issue Details
            </h2>
            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Description *
              </label>
              <textarea
                value={form.issueDescription}
                onChange={(e) =>
                  handleFieldChange("issueDescription", e.target.value)
                }
                disabled={submitting}
                placeholder="Describe the issue in detail..."
                rows={4}
                className={`mt-1 w-full px-3 py-2.5 bg-secondary/50 border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all resize-none disabled:opacity-50 ${
                  fieldErrors.issueDescription
                    ? "border-red-500/50 focus:ring-red-500/50"
                    : "border-border/50 focus:ring-primary/50"
                }`}
              />
              {fieldErrors.issueDescription && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {fieldErrors.issueDescription}
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                Priority *
              </label>
              <select
                value={form.priority}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    priority: e.target.value as "low" | "medium" | "high" | "critical",
                  }))
                }
                disabled={submitting}
                className="mt-1 w-full px-3 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all disabled:opacity-50"
              >
                <option value="low">Low - 72 hours</option>
                <option value="medium">Medium - 48 hours</option>
                <option value="high">High - 24 hours</option>
                <option value="critical">Critical - 8 hours</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                SLA time available for this priority level
              </p>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !serialEntry}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Submit Complaint
              </>
            )}
          </button>
        </form>

        {/* Success Modal */}
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl p-8 max-w-sm w-full mx-4"
            >
              <div className="flex items-center justify-center mb-4">
                <CheckCircle className="h-12 w-12 text-success" />
              </div>
              <h2 className="font-display font-bold text-lg text-center mb-2">
                Complaint Submitted Successfully
              </h2>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Your complaint has been registered in the system
              </p>
              <div className="bg-secondary/30 rounded-lg p-4 mb-6">
                <p className="text-xs text-muted-foreground mb-1">
                  COMPLAINT NUMBER
                </p>
                <p className="text-xl font-mono font-bold text-primary">
                  {complaintNumber}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSuccessModal(false);
                  navigate("/agent/tickets");
                }}
                className="w-full px-4 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-all"
              >
                View My Tickets
              </button>
            </motion.div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
