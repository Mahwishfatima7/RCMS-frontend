import { useState, useEffect } from "react";
import { AppLayout } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { SLAStatusBadge } from "@/components/SLAStatusBadge";
import { complaintApi, bookingApi } from "@/services/apiService";
import { motion } from "framer-motion";
import { Search, BookOpen, Loader, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { usePollingWithSmoothLoading } from "@/hooks/usePolling";

export default function AdminBookings() {
  const [search, setSearch] = useState("");
  const [complaints, setComplaints] = useState<any[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [editingBooking, setEditingBooking] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editForm, setEditForm] = useState({
    booking_id: "",
    manufacturer_status: "",
    reference_no: "",
    notes: "",
    ticket_status: "",
  });

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const complaintsResult = await complaintApi.getAll();
        const bookingsResult = await bookingApi.getAll();

        if (complaintsResult.success) {
          setComplaints(complaintsResult.data?.complaints || []);
        }
        if (bookingsResult.success) {
          setBookings(bookingsResult.data?.bookings || []);
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchDataForPolling = async () => {
    try {
      const complaintsResult = await complaintApi.getAll();
      const bookingsResult = await bookingApi.getAll();

      if (complaintsResult.success) {
        setComplaints(complaintsResult.data?.complaints || []);
      }
      if (bookingsResult.success) {
        setBookings(bookingsResult.data?.bookings || []);
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    }
  };

  usePollingWithSmoothLoading(
    fetchDataForPolling,
    60000, // 60 seconds
    true, // enabled
    () => setLoading(false),
    () => {} // Silent updates
  );

  // Only show complaints that have manufacturer bookings
  const booked = complaints
    .map((c) => ({
      complaint: c,
      booking: bookings.find((b) => b.complaint_id === c.id),
    }))
    .filter((item) => item.booking);

  const filtered = booked.filter(
    ({ complaint: c, booking: b }) =>
      c.ticket_no?.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
      b?.booking_id?.toLowerCase().includes(search.toLowerCase()),
  );

  const handleEditBooking = (booking: any) => {
    // Find the associated complaint to get ticket status
    const complaint = complaints.find(c => c.id === booking.complaint_id);
    
    setSelectedBooking(booking);
    setEditForm({
      booking_id: booking.booking_id,
      manufacturer_status: booking.manufacturer_status,
      reference_no: booking.reference_no,
      notes: booking.notes || "",
      ticket_status: complaint?.status || "",
    });
    setEditingBooking(true);
  };

  const handleSaveBooking = async () => {
    if (!selectedBooking) return;
    setSubmitting(true);
    try {
      // Update booking details
      const bookingData = {
        booking_id: editForm.booking_id,
        manufacturer_status: editForm.manufacturer_status,
        reference_no: editForm.reference_no,
        notes: editForm.notes,
      };
      
      const result = await bookingApi.update(selectedBooking.id, bookingData);
      
      if (result.success) {
        // If ticket status changed, update the complaint status
        if (editForm.ticket_status) {
          const complaintId = selectedBooking.complaint_id;
          await complaintApi.updateStatus(complaintId, editForm.ticket_status);
        }
        
        toast.success("Booking updated successfully");
        setEditingBooking(false);
        setSelectedBooking(null);

        // Refresh bookings and complaints
        const refreshResult = await bookingApi.getAll();
        if (refreshResult.success) {
          setBookings(refreshResult.data?.bookings || []);
        }
        
        const complaintsResult = await complaintApi.getAll();
        if (complaintsResult.success) {
          setComplaints(complaintsResult.data?.complaints || []);
        }
      } else {
        toast.error(result.error || "Failed to update booking");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBooking = async (bookingId: number) => {
    if (!confirm("Are you sure you want to delete this booking?")) return;

    setSubmitting(true);
    try {
      const result = await bookingApi.delete(bookingId);
      if (result.success) {
        toast.success("Booking deleted successfully");
        setSelectedBooking(null);

        // Refresh bookings
        const refreshResult = await bookingApi.getAll();
        if (refreshResult.success) {
          setBookings(refreshResult.data?.bookings || []);
        }
      } else {
        toast.error(result.error || "Failed to delete booking");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h1 className="font-display text-2xl font-bold mb-1">
          Manufacturer Bookings
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          Track all manufacturer booking details and statuses
        </p>

        <div className="relative mb-4 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookings..."
            className="w-full pl-9 pr-3 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
        </div>

        {filtered.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <BookOpen className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-muted-foreground text-sm">
              No manufacturer bookings yet. Use the booking form on the
              Complaints page to add one.
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
                    "Priority",
                    "SLA Status",
                    "Booking ID",
                    "Booked Date",
                    "Mfg Status",
                    "Reference",
                    "Ticket Status",
                    "Notes",
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
                {filtered.map(({ complaint: c, booking: b }, i) => (
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
                    <td className="px-4 py-3 font-mono text-xs text-success">
                      {b?.booking_id}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {b?.booked_date}
                    </td>
                    <td className="px-4 py-3 text-xs text-foreground">
                      {b?.manufacturer_status}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {b?.reference_no}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                      {b?.notes}
                    </td>
                    <td className="px-4 py-3 flex gap-1">
                      <button
                        onClick={() => handleEditBooking(b)}
                        className="p-1 text-primary hover:bg-secondary/50 rounded transition-colors"
                        title="Edit booking"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteBooking(b.id)}
                        className="p-1 text-destructive hover:bg-secondary/50 rounded transition-colors"
                        title="Delete booking"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {selectedBooking && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
            onClick={() => setSelectedBooking(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-card rounded-2xl p-6 max-w-lg w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              {!editingBooking ? (
                <>
                  <h2 className="font-display font-bold text-lg mb-4">
                    Booking Details
                  </h2>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Booking ID
                      </p>
                      <p className="text-foreground font-medium">
                        {selectedBooking.booking_id}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Status</p>
                      <p className="text-foreground font-medium">
                        {selectedBooking.manufacturer_status}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Reference</p>
                      <p className="text-foreground font-medium">
                        {selectedBooking.reference_no}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Booked Date
                      </p>
                      <p className="text-foreground font-medium">
                        {selectedBooking.booked_date}
                      </p>
                    </div>
                  </div>
                  {selectedBooking.notes && (
                    <div className="mb-4">
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-sm text-foreground mt-1">
                        {selectedBooking.notes}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingBooking(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all"
                    >
                      <Edit className="h-4 w-4" /> Edit
                    </button>
                    <button
                      onClick={() => setSelectedBooking(null)}
                      className="flex-1 px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="font-display font-bold text-lg mb-4">
                    Edit Booking
                  </h2>
                  <div className="space-y-4 mb-4">
                    {[
                      {
                        key: "booking_id",
                        label: "Booking ID *",
                        placeholder: "e.g. MFG-HIK-12345",
                      },
                      {
                        key: "manufacturer_status",
                        label: "Manufacturer Status",
                        placeholder: "e.g. Under Review",
                      },
                      {
                        key: "reference_no",
                        label: "Reference Number",
                        placeholder: "e.g. REF-2026-XXXX",
                      },
                    ].map((f) => (
                      <div key={f.key}>
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                          {f.label}
                        </label>
                        <input
                          type="text"
                          value={editForm[f.key as keyof typeof editForm]}
                          onChange={(e) =>
                            setEditForm((prev) => ({
                              ...prev,
                              [f.key]: e.target.value,
                            }))
                          }
                          placeholder={f.placeholder}
                          className="mt-1 w-full px-3 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                        />
                      </div>
                    ))}
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Ticket Status
                      </label>
                      <select
                        value={editForm.ticket_status}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            ticket_status: e.target.value,
                          }))
                        }
                        className="mt-1 w-full px-3 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                      >
                        <option value="">Select Status</option>
                        <option value="Pending">Pending</option>
                        <option value="In-Progress">In-Progress</option>
                        <option value="Replaced">Replaced</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Notes
                      </label>
                      <textarea
                        value={editForm.notes}
                        onChange={(e) =>
                          setEditForm((prev) => ({
                            ...prev,
                            notes: e.target.value,
                          }))
                        }
                        placeholder="Internal notes..."
                        rows={3}
                        className="mt-1 w-full px-3 py-2.5 bg-secondary/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveBooking}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader className="h-4 w-4 animate-spin" /> Saving...
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4" /> Save Changes
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setEditingBooking(false)}
                      className="flex-1 px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
