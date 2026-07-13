import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import {
  LayoutDashboard, Pill, FlaskConical, Bell, MapPin,
  Upload, MessageSquare, Settings, LogOut, Search,
  AlertTriangle, ChevronRight, User, Menu, X
} from 'lucide-react';

export default function DashboardLayout() {
  const { user, logout, reminders, insights } = useGlobalContext();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const pendingReminders = reminders?.filter(r => r.status === 'pending') || [];
  const notifications = [
    ...(insights || []).map(ins => ({
      id: `ins-${ins.id}`,
      title: 'Health Insight',
      message: ins.text,
      type: ins.type || 'info',
      time: 'Just now'
    })),
    ...pendingReminders.map(r => {
      const timeStr = new Date(r.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        id: `rem-${r.id}`,
        title: 'Medication Reminder',
        message: `Time to take ${r.medicine?.name || 'your medication'}`,
        type: 'warning',
        time: timeStr
      };
    })
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navItems = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, end: true },
    { to: '/dashboard/medications', label: 'Medications', icon: Pill },
    { to: '/dashboard/reports', label: 'Lab Reports', icon: FlaskConical },
    { to: '/dashboard/reminders', label: 'Reminders', icon: Bell },
    { to: '/dashboard/upload', label: 'Upload Document', icon: Upload },
    { to: '/dashboard/chat', label: 'AI Chat', icon: MessageSquare },
    { to: '/dashboard/pharmacies', label: 'Pharmacy Finder', icon: MapPin },
  ];

  const NavItem = ({ item }) => (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={() => setMobileMenuOpen(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
          isActive
            ? 'bg-gray-900 text-white shadow-sm'
            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <item.icon className={`w-[18px] h-[18px] ${isActive ? 'text-white' : 'text-gray-400'}`} />
          <span>{item.label}</span>
        </>
      )}
    </NavLink>
  );

  return (
    <div className="h-screen flex bg-white">
      {/* Desktop Sidebar */}
      <nav className="hidden lg:flex flex-col w-64 border-r border-gray-100 bg-white shrink-0">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <img src="/logo.png" alt="VitaLeaf" className="w-7 h-7 object-contain" />
            <span className="font-extrabold text-lg tracking-tight text-gray-900">VitaLeaf</span>
          </div>
        </div>

        {/* User Card */}
        <div className="px-4 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
            <div className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center text-xs font-bold">
              {user?.name?.substring(0, 2).toUpperCase() || 'VL'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-gray-900 truncate">{user?.name || 'Patient'}</div>
            </div>
          </div>
        </div>

        {/* Nav Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-1">
          {navItems.map(item => (
            <NavItem key={item.to} item={item} />
          ))}
        </div>

        {/* Bottom */}
        <div className="px-3 pb-4 border-t border-gray-100 pt-3 flex flex-col gap-1">
          <NavLink
            to="/dashboard/profile"
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-gray-900 text-white' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Settings className={`w-[18px] h-[18px] ${isActive ? 'text-white' : 'text-gray-400'}`} />
                <span>Settings</span>
              </>
            )}
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors w-full text-left"
          >
            <LogOut className="w-[18px] h-[18px]" />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-6 shrink-0 z-30">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2">
            <img src="/logo.png" alt="VitaLeaf" className="w-6 h-6 object-contain" />
            <span className="font-extrabold text-base tracking-tight text-gray-900">VitaLeaf</span>
          </div>

          {/* Desktop Search */}
          <div className="hidden lg:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2 w-80 group focus-within:border-gray-300 focus-within:bg-white transition-all">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search medications, reports..."
              className="flex-1 bg-transparent border-none outline-none text-sm text-gray-900 placeholder:text-gray-400"
            />
            <kbd className="hidden sm:inline text-[10px] font-mono text-gray-400 border border-gray-200 rounded px-1.5 py-0.5 bg-white">⌘K</kbd>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 relative">
            <button 
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 text-gray-400 hover:text-gray-900 transition-colors"
            >
              <Bell className="w-5 h-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
              )}
            </button>

            {notificationsOpen && (
              <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                  <h3 className="font-extrabold text-gray-900">Notifications</h3>
                  <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                    {notifications.length} New
                  </span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-sm font-medium text-gray-500">
                      You're all caught up!
                    </div>
                  ) : (
                    <div className="flex flex-col">
                      {notifications.map((notif, i) => (
                        <div key={notif.id || i} className="p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                              notif.type === 'warning' ? 'bg-amber-100 text-amber-600' :
                              notif.type === 'success' ? 'bg-emerald-100 text-emerald-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              <Bell className="w-4 h-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-gray-900">{notif.title}</p>
                              <p className="text-xs font-medium text-gray-500 mt-0.5">{notif.message}</p>
                              <p className="text-[10px] font-bold text-gray-400 mt-1.5">{notif.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {notifications.length > 0 && (
                  <div className="p-3 border-t border-gray-100 bg-gray-50/50 text-center">
                    <button 
                      onClick={() => setNotificationsOpen(false)}
                      className="text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      Mark all as read
                    </button>
                  </div>
                )}
              </div>
            )}
            
            <div className="hidden lg:flex w-8 h-8 rounded-full bg-gray-900 text-white items-center justify-center text-xs font-bold cursor-pointer">
              {user?.name?.substring(0, 2).toUpperCase() || 'VL'}
            </div>
          </div>
        </header>

        {/* Mobile Nav Overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-16 z-40 bg-white border-t border-gray-100 overflow-y-auto">
            <div className="px-4 py-4 flex flex-col gap-1">
              {navItems.map(item => (
                <NavItem key={item.to} item={item} />
              ))}
              <div className="border-t border-gray-100 mt-3 pt-3">
                <NavLink
                  to="/dashboard/profile"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                >
                  <Settings className="w-[18px] h-[18px] text-gray-400" />
                  <span>Settings</span>
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 w-full text-left"
                >
                  <LogOut className="w-[18px] h-[18px]" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50">
          <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
