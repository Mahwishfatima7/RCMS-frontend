import { useState, ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/auth-context';
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog';
import dxbLogo from '@/assets/dxb-logo.png';
import {
  LayoutDashboard, FileText, PlusCircle, ClipboardList,
  BarChart3, LogOut, ChevronRight, Users,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const navItems = {
  agent: [
    { label: 'New Complaint', path: '/agent/new', icon: PlusCircle },
    { label: 'My Tickets', path: '/agent/tickets', icon: ClipboardList },
    { label: 'All Tickets', path: '/agent/all-tickets', icon: FileText },
  ],
  admin: [
    { label: 'All Complaints', path: '/admin/complaints', icon: FileText },
    { label: 'Mfg Bookings', path: '/admin/bookings', icon: ClipboardList },
  ],
  management: [
    { label: 'Dashboard', path: '/management/dashboard', icon: LayoutDashboard },
    { label: 'Reports', path: '/management/reports', icon: BarChart3 },
    { label: 'Managers and Agents', path: '/management/managers', icon: Users },
    { label: 'Register New Agent', path: '/management/register-agent', icon: PlusCircle },
  ],
};

export function AppLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);

  if (!user) return null;

  const items = navItems[user.role];
  const roleLabel = user.role === 'agent' ? 'ISP Agent' : user.role === 'admin' ? 'DXB Admin' : 'Management';

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col border-r border-border/50 shrink-0"
        style={{ background: 'var(--gradient-sidebar)' }}>
        <div className="p-5 border-b border-border/30">
          <div className="flex items-center gap-3">
            <img src={dxbLogo} alt="DXB Technologies" className="h-10 w-10 object-contain" />
            <div>
              <p className="font-display font-bold text-sm text-foreground">RCMS</p>
              <p className="text-[11px] text-muted-foreground">Case Management</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {items.map(item => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group ${
                  active
                    ? 'bg-primary/15 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
                }`}>
                <item.icon className="h-4 w-4" />
                <span>{item.label}</span>
                {active && <ChevronRight className="h-3 w-3 ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border/30">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
              {user.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground">{roleLabel}</p>
            </div>
          </div>
          <div className="space-y-1.5">
            {/* Change Password Button (above Sign Out) */}
            {user.role === 'agent' && (
              <div className="pb-1.5">
                <ChangePasswordDialog />
              </div>
            )}
            <button onClick={() => setShowSignOutDialog(true)}
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive transition-colors w-full px-2 py-1.5 rounded hover:bg-destructive/10">
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>

      {/* Sign Out Confirmation Dialog */}
      <AlertDialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out? You'll need to log in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                logout();
                navigate('/');
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Sign Out
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
