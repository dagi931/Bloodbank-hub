import React, { useState, useEffect } from 'react';
import { LogOut, Heart, Shield, Activity, User, Building, Warehouse, Sun, Moon, Smartphone, Monitor, Menu, Users, BarChart3, ToggleLeft, History, Megaphone, Award, Calendar, Package, Truck, Search, Stethoscope, Key } from 'lucide-react';
import { api } from './services/api';
import Landing from './pages/Landing';
import Login from './pages/auth/Login/auth';
import Register from './pages/auth/Registration/Register';
import AdminDashboard from './pages/dashboards/AdminDashboard';
import DonorDashboard from './pages/dashboards/DonorDashboard';
import StationDashboard from './pages/dashboards/StationDashboard';
import LabDashboard from './pages/dashboards/LabDashboard';
import WarehouseDashboard from './pages/dashboards/WarehouseDashboard';
import HospitalDashboard from './pages/dashboards/HospitalDashboard';

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [view, setView] = useState('landing'); // landing, login, register, dashboard
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [menuOpen, setMenuOpen] = useState(false);
  const [subTab, setSubTab] = useState('');

  // Handle theme application
  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Dynamic window resizing listener to check mobile size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Initialize Auth from local storage cache
  useEffect(() => {
    const cachedToken = sessionStorage.getItem('token');
    const cachedUser = api.auth.getCurrentUser();
    if (cachedToken && cachedUser) {
      setToken(cachedToken);
      setUser(cachedUser);
      setView('dashboard');
    }
  }, []);

  // Sync subTab with user role on login
  useEffect(() => {
    if (user) {
      switch (user.role) {
        case 'admin': setSubTab('users'); break;
        case 'donor': setSubTab('history'); break;
        case 'hospital': setSubTab('internal'); break;
        case 'warehouse': setSubTab('inventory'); break;
        default: setSubTab('main');
      }
    }
  }, [user]);

  const handleLoginSuccess = (loggedInUser, authToken) => {
    setUser(loggedInUser);
    setToken(authToken);
    setView('dashboard');
  };

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    setToken(null);
    setView('login');
  };

  // Get active dashboard component based on user role
  const renderDashboardContent = () => {
    if (!user) return null;
    switch (user.role) {
      case 'admin':
        return <AdminDashboard tab={subTab} setTab={setSubTab} />;
      case 'donor':
        return <DonorDashboard activeTab={subTab} setActiveTab={setSubTab} />;
      case 'station':
        return <StationDashboard />;
      case 'laboratory':
        return <LabDashboard />;
      case 'warehouse':
        return <WarehouseDashboard tab={subTab} setTab={setSubTab} />;
      case 'hospital':
        return <HospitalDashboard tab={subTab} setTab={setSubTab} />;
      default:
        return <div style={{ color: 'red' }}>Error: Unknown Workstation Role</div>;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield size={18} color="var(--primary)" />;
      case 'donor':
        return <Heart size={18} color="var(--primary)" fill="var(--primary)" />;
      case 'station':
        return <Activity size={18} color="var(--primary)" />;
      case 'laboratory':
        return <Activity size={18} color="#06d6a0" />;
      case 'warehouse':
        return <Warehouse size={18} color="#3a86ff" />;
      case 'hospital':
        return <Building size={18} color="#8338ec" />;
      default:
        return <User size={18} />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--bg-main)', color: 'var(--text-primary)' }}>
      
      {/* Toggling Toolbar for Guest Views */}
      {view !== 'dashboard' && view !== 'landing' && (
        <div style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 100, display: 'flex', gap: '10px' }}>
          <button 
            onClick={toggleTheme}
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-secondary)',
              cursor: 'pointer',
              padding: '10px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(10px)',
              boxShadow: 'var(--shadow-sm)'
            }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      )}

      {/* Landing and Auth Views */}
      {view === 'landing' && (
        <Landing 
          onNavigateToLogin={() => setView('login')}
          onNavigateToRegister={() => setView('register')}
        />
      )}

      {view === 'login' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '20px', background: 'radial-gradient(circle at top right, rgba(239,35,60,0.07) 0%, transparent 50%)' }}>
          <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
            <button 
              onClick={() => setView('landing')} 
              className="btn" 
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 16px' }}
            >
              ← Back to Home
            </button>
          </div>
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRegister={() => setView('register')}
          />
        </div>
      )}

      {view === 'register' && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '20px', background: 'radial-gradient(circle at top left, rgba(58,134,255,0.06) 0%, transparent 50%)' }}>
          <div style={{ position: 'absolute', top: '20px', left: '20px' }}>
            <button 
              onClick={() => setView('landing')} 
              className="btn" 
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', color: 'var(--text-primary)', padding: '8px 16px' }}
            >
              ← Back to Home
            </button>
          </div>
          <Register 
            onNavigateToLogin={() => setView('login')}
          />
        </div>
      )}

      {/* Main Dashboard Layout */}
      {view === 'dashboard' && user && (
        <div style={{ display: 'flex', flex: 1, height: '100vh', overflow: 'hidden' }}>
          
          {/* Mobile Sidebar backdrop shadow overlay */}
          {isMobile && menuOpen && (
            <div 
              onClick={() => setMenuOpen(false)}
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0, 0, 0, 0.4)',
                zIndex: 9998,
                backdropFilter: 'blur(1.5px)',
                transition: 'opacity 0.25s ease'
              }}
            />
          )}

          <aside style={{ 
            width: '280px', 
            background: 'var(--bg-surface)', 
            borderRight: '1px solid var(--border-color)', 
            display: (isMobile && !menuOpen) ? 'none' : 'flex', 
            flexDirection: 'column', 
            justifyContent: 'space-between', 
            padding: '30px 20px', 
            ...(isMobile ? {
              position: 'fixed',
              top: 0,
              left: 0,
              height: '100vh',
              zIndex: 9999,
              boxShadow: '10px 0 30px rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(30px)'
            } : {
              backdropFilter: 'blur(20px)'
            })
          }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              {/* Header Title */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Heart size={26} color="var(--primary)" fill="var(--primary)" />
                <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                  Blood Bank Hub
                </span>
              </div>

              {/* User badge */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ background: 'rgba(239,35,60,0.1)', padding: '8px', borderRadius: '6px' }}>
                  {getRoleIcon(user.role)}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                    {user.entity_name}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {user.role} workspace
                  </div>
                </div>
              </div>

              {/* Dynamic Sub-Tab Sidebar Navigation */}
              {(() => {
                const navItems = [];
                if (user.role === 'admin') {
                  navItems.push(
                    { id: 'users', label: 'Workstation Registry', icon: <Users size={16} /> },
                    { id: 'analytics', label: 'System Analytics', icon: <BarChart3 size={16} /> },
                    { id: 'reminders', label: 'Reminders Panel', icon: <ToggleLeft size={16} /> },
                    { id: 'audit', label: 'System Audit Logs', icon: <Activity size={16} /> },
                    { id: 'resets', label: 'Password Resets', icon: <Key size={16} /> }
                  );
                } else if (user.role === 'donor') {
                  navItems.push(
                    { id: 'history', label: 'My Donation History', icon: <History size={16} /> },
                    { id: 'announcements', label: 'Central Announcements', icon: <Megaphone size={16} /> },
                    { id: 'leaderboard', label: 'Global Leaderboard', icon: <Award size={16} /> },
                    { id: 'appointments', label: 'Schedule Donation Slot', icon: <Calendar size={16} /> }
                  );
                } else if (user.role === 'hospital') {
                  navItems.push(
                    { id: 'internal', label: 'My Facility Stock', icon: <Package size={16} /> },
                    { id: 'central', label: 'Central Requisitions', icon: <Truck size={16} /> },
                    { id: 'inter', label: 'Hospital to Hospital', icon: <Building size={16} /> },
                    { id: 'emergency', label: 'Emergency Vitals Lookup', icon: <Search size={16} /> },
                    { id: 'hms', label: 'Patients & Orders', icon: <Stethoscope size={16} /> }
                  );
                } else if (user.role === 'warehouse') {
                  navItems.push(
                    { id: 'inventory', label: 'Inventory & Dispatch', icon: <Package size={16} /> },
                    { id: 'announcements', label: 'Campaign Announcements', icon: <Megaphone size={16} /> }
                  );
                } else if (user.role === 'station') {
                  navItems.push(
                    { id: 'main', label: 'Screening & Collections', icon: <Activity size={16} /> }
                  );
                } else if (user.role === 'laboratory') {
                  navItems.push(
                    { id: 'main', label: 'Clinical Lab Screening', icon: <Activity size={16} /> }
                  );
                }

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                      Navigation
                    </div>
                    {navItems.map(item => {
                      const isActive = subTab === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSubTab(item.id);
                            setMenuOpen(false); // Auto close sidebar drawer on mobile click
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            padding: '11px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            background: isActive ? 'var(--bg-hover)' : 'transparent',
                            color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                            fontWeight: isActive ? 600 : 500,
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            textAlign: 'left',
                            transition: 'all 0.15s ease'
                          }}
                          className={isActive ? 'sidebar-active' : 'sidebar-inactive'}
                        >
                          {item.icon}
                          <span>{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

            </div>

            {/* Logout button */}
            <button 
              onClick={handleLogout}
              className="btn"
              style={{ width: '100%', justifyContent: 'center', background: 'rgba(239,35,60,0.1)', color: '#ef233c', border: '1px solid rgba(239,35,60,0.2)', gap: '8px', height: '42px' }}
            >
              <LogOut size={16} /> Sign Out Workstation
            </button>
          </aside>

          {/* Main workspace */}
          <main style={{ flex: 1, padding: '40px', overflowY: 'auto', background: 'var(--bg-main)' }}>
            <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                {isMobile && (
                  <button 
                    onClick={() => setMenuOpen(prev => !prev)}
                    style={{
                      background: menuOpen ? 'rgba(239,35,60,0.1)' : 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      color: menuOpen ? '#ef233c' : 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="Toggle Workspace Menu"
                  >
                    <Menu size={16} />
                  </button>
                )}
                <div>
                  <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0, letterSpacing: '-0.5px', color: 'var(--text-primary)' }}>
                    Workstation Portal
                  </h1>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <button 
                  onClick={toggleTheme}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-secondary)',
                    cursor: 'pointer',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600
                  }}
                  title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                  {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                  <span>{theme === 'dark' ? 'Light Theme' : 'Dark Theme'}</span>
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', background: 'rgba(6,214,160,0.08)', border: '1px solid rgba(6,214,160,0.15)', color: '#06d6a0', padding: '6px 12px', borderRadius: '20px', fontWeight: 600 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06d6a0', display: 'inline-block' }} />
                  Online
                </div>
              </div>
            </header>

            {/* Workstation Dashboard Page Content */}
            <div className="animate-fade-in">
              {renderDashboardContent()}
            </div>
          </main>

        </div>
      )}

    </div>
  );
}
