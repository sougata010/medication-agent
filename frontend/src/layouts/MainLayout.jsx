import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useGlobalContext } from '../context/GlobalContext';
import { 
  Activity, MessageSquare, PlusSquare, 
  User, LogOut, Hexagon, Shield, Bell
} from 'lucide-react';

export default function MainLayout() {
  const { user, logout } = useGlobalContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col relative bg-bg-50 text-text-primary">
      
      {/* Crisp White Navbar */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto h-16 flex items-center justify-between px-6">
          
          {/* Brand */}
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <img src="/logo.png" alt="MedGraph Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
            <span className="text-lg font-heading font-bold tracking-tight">
              MedGraph
            </span>
          </div>
          
          {/* Navigation Links */}
          {user && (
            <nav className="hidden md:flex items-center gap-2">
              <NavLink 
                to="/dashboard" 
                className={({isActive}) => `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-bg-100 text-brand' : 'text-text-secondary hover:text-brand hover:bg-bg-50'}`}
              >
                <Activity w={16} h={16} /> Dashboard
              </NavLink>
              <NavLink 
                to="/chat" 
                className={({isActive}) => `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-bg-100 text-brand' : 'text-text-secondary hover:text-brand hover:bg-bg-50'}`}
              >
                <MessageSquare w={16} h={16} /> Companion
              </NavLink>
              <NavLink 
                to="/upload" 
                className={({isActive}) => `flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${isActive ? 'bg-bg-100 text-brand' : 'text-text-secondary hover:text-brand hover:bg-bg-50'}`}
              >
                <PlusSquare w={16} h={16} /> Add Rx
              </NavLink>
            </nav>
          )}
          
          {/* Topbar Right Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <button className="text-text-secondary hover:text-brand transition-colors relative">
                  <Bell w={18} h={18} />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-brand rounded-full"></span>
                </button>
                <div className="w-px h-6 bg-border"></div>
                <button 
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 text-sm text-text-secondary hover:text-brand transition-colors font-medium"
                >
                  <User w={16} h={16} />
                  <span className="hidden sm:inline-block">{user.username}</span>
                </button>
                <button 
                  onClick={handleLogout}
                  className="text-text-muted hover:text-state-danger transition-colors p-1"
                  title="Sign Out"
                >
                  <LogOut w={18} h={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <a href="/login" className="text-sm font-medium text-text-secondary hover:text-brand transition-colors">
                  Log In
                </a>
                <a href="/login" className="btn btn-primary text-sm py-1.5 px-4 hidden sm:inline-flex">
                  Get Started
                </a>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-10 pb-32 z-10 relative">
        <Outlet />
      </main>

      {/* Trust Footer */}
      <div className="mt-auto py-6 border-t border-border bg-white z-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-brand" />
            <span>MedGraph AI Intelligence Engine. Encrypted & HIPAA Compliant (Demo).</span>
          </div>
          <div className="flex items-center gap-6 font-medium">
            <a href="#" className="hover:text-brand transition-colors">Privacy</a>
            <a href="#" className="hover:text-brand transition-colors">Terms</a>
            <a href="#" className="hover:text-brand transition-colors">API</a>
          </div>
        </div>
      </div>
    </div>
  );
}
