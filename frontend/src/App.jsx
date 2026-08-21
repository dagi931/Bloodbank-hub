import React, { useState, useEffect, useRef } from "react";
import {
  LogOut,
  Heart,
  Shield,
  Activity,
  User,
  Building,
  Warehouse,
  Sun,
  Moon,
  Menu,
  Users,
  BarChart3,
  ToggleLeft,
  History,
  Megaphone,
  Award,
  Calendar,
  Package,
  Truck,
  Search,
  Stethoscope,
  Key,
  Bell,
  CheckCircle2,
  UserCheck,
  FlaskConical,
  ClipboardList,
  Inbox,
  MessageSquare,
  AlertCircle,
  FileText,
  X,
  Check,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  ChevronLeft,
  Home,
} from "lucide-react";
import { api } from "./services/api";
import Landing from "./pages/Landing";
import Login from "./pages/auth/Login/auth";
import Register from "./pages/auth/Registration/Register";
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import DonorDashboard from "./pages/dashboards/DonorDashboard";
import StationDashboard from "./pages/dashboards/StationDashboard";
import LabDashboard from "./pages/dashboards/LabDashboard";
import WarehouseDashboard from "./pages/dashboards/WarehouseDashboard";
import HospitalDashboard from "./pages/dashboards/HospitalDashboard";
import ProfileView from "./components/common/ProfileView";
import BottomToast from "./components/common/BottomToast";
import { io } from "socket.io-client";

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [view, setView] = useState("landing"); // landing, login, register, dashboard
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "light",
  );
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 1024);
  const [menuOpen, setMenuOpen] = useState(false);
  const [subTab, setSubTab] = useState("dashboard");

  // Header state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [rawNotifications, setRawNotifications] = useState([]);
  const notificationsRef = useRef([]);
  const [readNotifIds, setReadNotifIds] = useState([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [incomingAlert, setIncomingAlert] = useState(null);

  const searchRef = useRef(null);
  const mobileSearchButtonRef = useRef(null);
  const mobileSearchPanelRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchFocused(false);
      }
      const inMobileSearchButton = mobileSearchButtonRef.current && mobileSearchButtonRef.current.contains(e.target);
      const inMobileSearchPanel = mobileSearchPanelRef.current && mobileSearchPanelRef.current.contains(e.target);
      if (!inMobileSearchButton && !inMobileSearchPanel) {
        setMobileSearchOpen(false);
        setSearchFocused(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle theme application
  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  // Dynamic window resizing listener to check mobile size
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 1024;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Initialize Auth from local storage cache
  useEffect(() => {
    const cachedToken = sessionStorage.getItem("token");
    const cachedUser = api.auth.getCurrentUser();
    if (cachedToken && cachedUser) {
      setToken(cachedToken);
      setUser(cachedUser);
      setView("dashboard");
      setSubTab("dashboard");
    }
  }, []);

  const handleLoginSuccess = (loggedInUser, authToken) => {
    setUser(loggedInUser);
    setToken(authToken);
    setView("dashboard");
    setSubTab("dashboard");
  };

  const handleLogout = () => {
    api.auth.logout();
    setUser(null);
    setToken(null);
    setView("login");
    setProfileOpen(false);
    setNotificationsOpen(false);
  };

  // Get search placeholder based on user role
  const getSearchPlaceholder = (role) => {
    switch (role) {
      case "admin":
        return "Search users, stations, logs...";
      case "donor":
        return "Search campaigns, stations...";
      case "station":
        return "Search donors, samples...";
      case "laboratory":
        return "Search samples, records...";
      case "warehouse":
        return "Search inventory, requests...";
      case "hospital":
        return "Search patients, requests...";
      default:
        return "Search...";
    }
  };

  // Role-specific searchable entities
  const getRoleSearchResults = (role, query) => {
    if (!query || query.trim().length === 0) return [];
    const q = query.toLowerCase();

    switch (role) {
      case "admin":
        return [
          {
            title: "Workstation Approvals",
            category: "Approvals",
            tab: "approvals",
            desc: "Pending hospital & station registrations",
          },
          {
            title: "Registered Users Directory",
            category: "Users",
            tab: "users",
            desc: "All user accounts and roles",
          },
          {
            title: "System Audit Logs",
            category: "Security",
            tab: "audit",
            desc: "Security events and action history",
          },
          {
            title: "Password Reset Tickets",
            category: "Support",
            tab: "resets",
            desc: "Active workstation reset requests",
          },
          {
            title: "System Analytics",
            category: "Reports",
            tab: "analytics",
            desc: "Monthly supply and demand analytics",
          },
        ].filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.desc.toLowerCase().includes(q),
        );

      case "donor":
        return [
          {
            title: "Upcoming Campaigns & Drives",
            category: "Campaigns",
            tab: "campaigns",
            desc: "Meskel Square & University drives",
          },
          {
            title: "Eligibility Status",
            category: "Medical",
            tab: "eligibility",
            desc: "Check your 90-day donation countdown",
          },
          {
            title: "My Reward Points",
            category: "Rewards",
            tab: "points",
            desc: "View loyalty tier and points leaderboard",
          },
          {
            title: "Donation History",
            category: "Records",
            tab: "history",
            desc: "Past donations and certificates",
          },
          {
            title: "Messages & Alerts",
            category: "Messages",
            tab: "messages",
            desc: "Notifications from medical team",
          },
        ].filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.desc.toLowerCase().includes(q),
        );

      case "station":
        return [
          {
            title: "Eligibility Check",
            category: "Screening",
            tab: "eligibility",
            desc: "Verify 90-day donation interval",
          },
          {
            title: "Collect Blood Sample",
            category: "Collection",
            tab: "collect",
            desc: "Pre-donation questionnaire & collection",
          },
          {
            title: "Registered Donors Directory",
            category: "Donors",
            tab: "donors",
            desc: "Search certified donor database",
          },
          {
            title: "Today's Collections Log",
            category: "Dispatches",
            tab: "collections",
            desc: "Track blood bags collected today",
          },
          {
            title: "Station Analytics Reports",
            category: "Reports",
            tab: "reports",
            desc: "Intake volume and blood type breakdown",
          },
        ].filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.desc.toLowerCase().includes(q),
        );

      case "laboratory":
        return [
          {
            title: "Pending Screening Queue",
            category: "Screening",
            tab: "pending",
            desc: "Blood samples awaiting viral test",
          },
          {
            title: "Confidential Lab Records",
            category: "Records",
            tab: "records",
            desc: "Verified screening history and markers",
          },
          {
            title: "Donor Reward Points",
            category: "Points",
            tab: "points",
            desc: "Points awarded after validation",
          },
          {
            title: "Inventory Out Dispatches",
            category: "Warehouse",
            tab: "inventory",
            desc: "Validated units routed to warehouse",
          },
          {
            title: "Laboratory Quality Reports",
            category: "Reports",
            tab: "reports",
            desc: "Negative pass rate and defect metrics",
          },
        ].filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.desc.toLowerCase().includes(q),
        );

      case "warehouse":
        return [
          {
            title: "Central Blood Bank Inventory",
            category: "Inventory",
            tab: "inventory",
            desc: "Current stock across all 8 blood types",
          },
          {
            title: "Incoming Stock",
            category: "Supply",
            tab: "incoming",
            desc: "Blood bags delivered from laboratories",
          },
          {
            title: "Hospital Dispatch Requests",
            category: "Orders",
            tab: "dispatch",
            desc: "Fulfill hospital requisition orders",
          },
          {
            title: "Campaign Announcements",
            category: "Drives",
            tab: "campaigns",
            desc: "Create public donation campaigns",
          },
          {
            title: "Emergency SMS Broadcast",
            category: "Alerts",
            tab: "alerts",
            desc: "Dispatch SMS for critical blood shortages",
          },
        ].filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.desc.toLowerCase().includes(q),
        );

      case "hospital":
        return [
          {
            title: "Central Requisition Order",
            category: "Orders",
            tab: "request",
            desc: "Order blood from central warehouse",
          },
          {
            title: "My Active Blood Requests",
            category: "Tracking",
            tab: "requests",
            desc: "Status of dispatched blood orders",
          },
          {
            title: "Hospital Patients (HMS)",
            category: "Patients",
            tab: "patients",
            desc: "Admit patients and assign blood units",
          },
          {
            title: "Facility Blood Reserve",
            category: "Stock",
            tab: "stock",
            desc: "On-site refrigeration inventory",
          },
          {
            title: "Emergency Vitals Lookup",
            category: "Medical",
            tab: "patients",
            desc: "FAYDA emergency medical history",
          },
        ].filter(
          (item) =>
            item.title.toLowerCase().includes(q) ||
            item.category.toLowerCase().includes(q) ||
            item.desc.toLowerCase().includes(q),
        );

      default:
        return [];
    }
  };

  // Live Notifications Fetching with Socket.IO and Fast Polling
  const getRoleNotificationFallback = async () => {
    if (user.role === 'laboratory') {
      const samples = await api.lab.getPendingSamples();
      return (samples || []).map(sample => ({
        id: `lab-sample-${sample.id}`,
        category: 'pending',
        title: 'Sample Awaiting Screening',
        desc: `Unit ${sample.id.slice(0, 8)} (${sample.blood_type}) received from collection station. Needs testing.`,
        time: 'Active',
        type: 'info',
        unread: true,
      }));
    }

    if (user.role === 'station') {
      const samples = await api.station.getSamples();
      return (samples || []).map(sample => ({
        id: `station-sample-${sample.id}`,
        category: 'collections',
        title: sample.status === 'validated' ? 'Sample Validated by Lab' : `Sample Status: ${sample.status.toUpperCase()}`,
        desc: `Unit ${sample.id.slice(0, 8)} (${sample.blood_type}) status is currently "${sample.status}".`,
        time: 'Active',
        type: sample.status === 'validated' ? 'success' : sample.status === 'discarded' ? 'warning' : 'info',
        unread: true,
      }));
    }

    if (user.role === 'warehouse') {
      const [stock, requests] = await Promise.all([
        api.warehouse.getStock(),
        api.warehouse.getRequests(),
      ]);
      return [
        ...(stock || []).filter(item => item.quantity <= 10).map(item => ({
          id: `wh-stock-${item.id}`,
          category: 'inventory',
          title: 'Low Stock Warning',
          desc: `${item.blood_type} inventory at critical level: ${item.quantity} units remaining in storage.`,
          time: 'Active Alert',
          type: item.quantity <= 3 ? 'warning' : 'info',
          unread: true,
        })),
        ...(requests || []).filter(request => request.status === 'pending').map(request => ({
          id: `wh-req-${request.id}`,
          category: 'dispatch',
          title: 'Hospital Requisition Order',
          desc: `${request.hospital?.entity_name || 'Hospital'} requested ${request.units_needed} units of ${request.blood_type}.`,
          time: 'Active',
          type: 'warning',
          unread: true,
        })),
      ];
    }

    if (user.role === 'hospital') {
      const [requests, stock] = await Promise.all([
        api.hospital.getRequests(),
        api.hospital.getStock(),
      ]);
      return [
        ...(requests || []).map(request => ({
          id: `hosp-req-${request.id}`,
          category: 'request',
          title: request.status === 'fulfilled' ? 'Requisition Dispatched' : `Requisition: ${request.status.toUpperCase()}`,
          desc: `Order for ${request.units_needed} units of ${request.blood_type} is "${request.status}".`,
          time: 'Active',
          type: request.status === 'fulfilled' ? 'success' : 'info',
          unread: true,
        })),
        ...(stock || []).filter(item => item.quantity <= 5).map(item => ({
          id: `hosp-stock-${item.id}`,
          category: 'stock',
          title: 'Local Reserve Critical',
          desc: `${item.blood_type} stock is low (${item.quantity} units). Requisition recommended.`,
          time: 'Active Alert',
          type: 'warning',
          unread: true,
        })),
      ];
    }

    return [];
  };

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      setLoadingNotifs(true);
      let notifs = [];
      try {
        const res = await api.notifications.getNotifications();
        if (res && Array.isArray(res.notifications)) {
          notifs = res.notifications;
        }
      } catch (e) {
        console.warn("[Notifications API]", e);
      }

      if (notifs.length === 0 && user.role !== 'admin') {
        try {
          notifs = await getRoleNotificationFallback();
        } catch (fallbackError) {
          console.warn('[Notifications fallback]', fallbackError);
          notifs = notificationsRef.current;
        }
      }

      // Safeguard for Admin: sync with pending users from admin API
      if (user.role === "admin") {
        try {
          const usersData = await api.admin.getUsers();
          const pendingWorkstations = (usersData || []).filter(
            (u) => u.status === "pending" && u.role !== "donor",
          );

          pendingWorkstations.forEach((u) => {
            const notifId = `admin-pending-user-${u.id}`;
            if (!notifs.some((n) => n.id === notifId)) {
              notifs.unshift({
                id: notifId,
                category: "approvals",
                title: "Workstation Registration Pending",
                desc: `${u.entity_name || u.email} (${(u.role || "").toUpperCase()}) submitted registration for authorization.`,
                time: "Awaiting Action",
                type: "warning",
                unread: true,
              });
            }
          });
        } catch (adminErr) {
          console.warn("[Admin pending users sync]", adminErr);
        }
      }

      notificationsRef.current = notifs;
      setRawNotifications(notifs);
    } catch (err) {
      console.warn("[Notifications] Failed to fetch live notifications:", err);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    if (!user) {
      notificationsRef.current = [];
      setReadNotifIds([]);
      setRawNotifications([]);
      return;
    }

    fetchNotifications();

    // Fast polling every 4 seconds
    const interval = setInterval(fetchNotifications, 4000);

    // Fetch immediately when user switches tabs/focuses window
    const handleFocus = () => fetchNotifications();
    window.addEventListener("focus", handleFocus);

    // Socket.io live updates
    let socket;
    try {
      socket = io("http://localhost:5000");
      socket.on("new_workstation_registered", (data) => {
        fetchNotifications();
        if (user.role === "admin") {
          setIncomingAlert(
            `🔔 ${data.message || "New workstation registration awaiting approval!"}`,
          );
        }
      });
      socket.on("notification", (data) => {
        if (data?.recipientRole && data.recipientRole !== user.role) return;
        if (data?.recipientId && data.recipientId !== user.id) return;
        fetchNotifications();
        if (data?.message) {
          setIncomingAlert(`🔔 ${data.message}`);
        }
      });
    } catch (e) {
      console.warn("[WebSocket Error]:", e);
    }

    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", handleFocus);
      if (socket) socket.disconnect();
    };
  }, [user?.id, subTab]);

  useEffect(() => {
    setReadNotifIds([]);
  }, [user?.id]);

  const handleMarkAsRead = (id) => {
    setReadNotifIds((prev) => [...new Set([...prev, id])]);
  };

  const handleMarkAllRead = () => {
    const allIds = rawNotifications.map((n) => n.id);
    setReadNotifIds((prev) => [...new Set([...prev, ...allIds])]);
  };

  // Get active dashboard component based on user role
  const renderDashboardContent = () => {
    if (!user) return null;
    if (subTab === "profile") {
      return (
        <ProfileView
          user={user}
          setTab={setSubTab}
          onBack={() => setSubTab("dashboard")}
        />
      );
    }
    switch (user.role) {
      case 'admin':
        return <AdminDashboard tab={subTab} setTab={setSubTab} isMobile={isMobile} />;
      case 'donor':
        return <DonorDashboard activeTab={subTab} setActiveTab={setSubTab} isMobile={isMobile} />;
      case 'station':
        return <StationDashboard tab={subTab} setTab={setSubTab} isMobile={isMobile} />;
      case 'laboratory':
        return <LabDashboard tab={subTab} setTab={setSubTab} isMobile={isMobile} />;
      case 'warehouse':
        return <WarehouseDashboard tab={subTab} setTab={setSubTab} isMobile={isMobile} />;
      case 'hospital':
        return <HospitalDashboard tab={subTab} setTab={setSubTab} isMobile={isMobile} />;
      default:
        return (
          <div style={{ color: "red" }}>Error: Unknown Workstation Role</div>
        );
    }
  };

  // Get role title label (clean, without numbering)
  const getRoleTitle = (role) => {
    switch (role) {
      case "admin":
        return "Admin Dashboard";
      case "donor":
        return "Donor Dashboard";
      case "station":
        return "Donation Station Dashboard";
      case "laboratory":
        return "Laboratory Dashboard";
      case "warehouse":
        return "Warehouse Dashboard";
      case "hospital":
        return "Hospital Dashboard";
      default:
        return "Dashboard";
    }
  };

  const getRoleBadgeTitle = (role) => {
    switch (role) {
      case "admin":
        return "Super Administrator";
      case "donor":
        return "Certified Blood Donor";
      case "station":
        return "Donation Collection Station";
      case "laboratory":
        return "Certified Laboratory";
      case "warehouse":
        return "Central Blood Bank Warehouse";
      case "hospital":
        return "Partner Hospital (HMS)";
      default:
        return role;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case "admin":
        return <Shield size={18} color="#ffffff" />;
      case "donor":
        return <Heart size={18} color="#ffffff" fill="#ffffff" />;
      case "station":
        return <Activity size={18} color="#ffffff" />;
      case "laboratory":
        return <FlaskConical size={18} color="#ffffff" />;
      case "warehouse":
        return <Warehouse size={18} color="#ffffff" />;
      case "hospital":
        return <Building size={18} color="#ffffff" />;
      default:
        return <User size={18} color="#ffffff" />;
    }
  };

  const searchResults = user
    ? getRoleSearchResults(user.role, searchQuery)
    : [];
  const notifications = rawNotifications.filter(
    (n) => !readNotifIds.includes(n.id),
  );
  const unreadNotifCount = notifications.filter(
    (n) => n.unread !== false,
  ).length;

  return (
    <div
      className={user ? `theme-${user.role}` : ""}
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "var(--bg-main)",
        color: "var(--text-primary)",
      }}
    >
      {/* Real-time incoming toast alert */}
      <BottomToast
        message={incomingAlert}
        onClose={() => setIncomingAlert(null)}
      />

      {/* Toggling Toolbar for Guest Views */}
      {view !== "dashboard" && view !== "landing" && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            zIndex: 100,
            display: "flex",
            gap: "10px",
          }}
        >
          <button
            onClick={toggleTheme}
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-color)",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "10px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backdropFilter: "blur(10px)",
              boxShadow: "var(--shadow-sm)",
            }}
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} Mode`}
          >
            {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      )}

      {/* Landing and Auth Views */}
      {view === "landing" && (
        <Landing
          onNavigateToLogin={() => setView("login")}
          onNavigateToRegister={() => setView("register")}
        />
      )}

      {view === "login" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            padding: "20px",
            background:
              "radial-gradient(circle at top right, rgba(239,35,60,0.07) 0%, transparent 50%)",
          }}
        >
          <div style={{ position: "absolute", top: "20px", left: "20px" }}>
            <button
              onClick={() => setView("landing")}
              className="btn"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                padding: "8px 16px",
              }}
            >
              ← Back to Home
            </button>
          </div>
          <Login
            onLoginSuccess={handleLoginSuccess}
            onNavigateToRegister={() => setView("register")}
          />
        </div>
      )}

      {view === "register" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            padding: "20px",
            background:
              "radial-gradient(circle at top left, rgba(58,134,255,0.06) 0%, transparent 50%)",
          }}
        >
          <div style={{ position: "absolute", top: "20px", left: "20px" }}>
            <button
              onClick={() => setView("landing")}
              className="btn"
              style={{
                background: "var(--bg-surface)",
                border: "1px solid var(--border-color)",
                color: "var(--text-primary)",
                padding: "8px 16px",
              }}
            >
              ← Back to Home
            </button>
          </div>
          <Register onNavigateToLogin={() => setView("login")} />
        </div>
      )}

      {/* Main Dashboard Layout */}
      {view === "dashboard" && user && (
        <div
          style={{
            display: "flex",
            flex: 1,
            height: "100vh",
            overflow: "hidden",
          }}
        >
          {/* Mobile Sidebar backdrop overlay */}
          {isMobile && menuOpen && (
            <div
              onClick={() => setMenuOpen(false)}
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: "rgba(0, 0, 0, 0.5)",
                zIndex: 9998,
                backdropFilter: "blur(2px)",
              }}
            />
          )}

          {/* Left Sidebar Navigation */}
          <aside
            style={{
              width: "240px",
              background: "var(--sidebar-bg, #0f172a)",
              color: "#ffffff",
              display: isMobile && !menuOpen ? "none" : "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "24px 16px 16px 16px",
              transition: "all 0.3s ease",
              zIndex: 9999,
              ...(isMobile
                ? {
                    position: "fixed",
                    top: 0,
                    left: 0,
                    height: "100vh",
                    boxShadow: "10px 0 30px rgba(0, 0, 0, 0.4)",
                  }
                : {}),
            }}
          >
            <div
              style={{ display: "flex", flexDirection: "column", gap: "22px" }}
            >
              {/* Header Title with Blood Drop Icon */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  paddingLeft: "8px",
                }}
              >
                <div
                  style={{
                    background: "#ffffff",
                    borderRadius: "8px",
                    padding: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Heart
                    size={18}
                    color="var(--primary, #ef233c)"
                    fill="var(--primary, #ef233c)"
                  />
                </div>
                <span
                  style={{
                    fontSize: "1.15rem",
                    fontWeight: 800,
                    color: "#ffffff",
                    letterSpacing: "-0.3px",
                  }}
                >
                  Blood Bank Hub
                </span>
              </div>

              {/* Dynamic Navigation Items per Role (Settings removed, Lab screen consolidated) */}
              {(() => {
                const navItems = [];
                if (user.role === "admin") {
                  navItems.push(
                    {
                      id: "dashboard",
                      label: "Dashboard",
                      icon: <BarChart3 size={16} />,
                    },
                    {
                      id: "approvals",
                      label: "Workstation Approvals",
                      icon: <Users size={16} />,
                    },
                    { id: "users", label: "Users", icon: <User size={16} /> },
                    {
                      id: "audit",
                      label: "Audit Logs",
                      icon: <Activity size={16} />,
                    },
                    {
                      id: "resets",
                      label: "Password Reset Tickets",
                      icon: <Key size={16} />,
                    },
                    {
                      id: "analytics",
                      label: "System Analytics",
                      icon: <BarChart3 size={16} />,
                    },
                  );
                } else if (user.role === "donor") {
                  navItems.push(
                    {
                      id: "dashboard",
                      label: "Dashboard",
                      icon: <BarChart3 size={16} />,
                    },
                    {
                      id: "profile",
                      label: "My Profile",
                      icon: <User size={16} />,
                    },
                    {
                      id: "campaigns",
                      label: "Campaigns",
                      icon: <Megaphone size={16} />,
                    },
                    {
                      id: "points",
                      label: "My Points",
                      icon: <Award size={16} />,
                    },
                    {
                      id: "eligibility",
                      label: "Eligibility Status",
                      icon: <CheckCircle2 size={16} />,
                    },
                    {
                      id: "history",
                      label: "Donation History",
                      icon: <History size={16} />,
                    },
                    {
                      id: "messages",
                      label: "Messages",
                      icon: <MessageSquare size={16} />,
                    },
                  );
                } else if (user.role === "station") {
                  navItems.push(
                    {
                      id: "dashboard",
                      label: "Dashboard",
                      icon: <BarChart3 size={16} />,
                    },
                    {
                      id: "eligibility",
                      label: "Eligibility Check",
                      icon: <CheckCircle2 size={16} />,
                    },
                    {
                      id: "collect",
                      label: "Collect Sample",
                      icon: <Activity size={16} />,
                    },
                    {
                      id: "collections",
                      label: "Today's Collections",
                      icon: <ClipboardList size={16} />,
                    },
                    {
                      id: "donors",
                      label: "Donors List",
                      icon: <Users size={16} />,
                    },
                    {
                      id: "reports",
                      label: "Reports",
                      icon: <FileText size={16} />,
                    },
                  );
                } else if (user.role === "laboratory") {
                  navItems.push(
                    {
                      id: "dashboard",
                      label: "Dashboard",
                      icon: <BarChart3 size={16} />,
                    },
                    {
                      id: "pending",
                      label: "Pending Samples",
                      icon: <FlaskConical size={16} />,
                    },
                    {
                      id: "records",
                      label: "Lab Records",
                      icon: <ClipboardList size={16} />,
                    },
                    {
                      id: "points",
                      label: "Donor Points",
                      icon: <Award size={16} />,
                    },
                    {
                      id: "reports",
                      label: "Reports",
                      icon: <FileText size={16} />,
                    },
                    {
                      id: "inventory",
                      label: "Inventory Out",
                      icon: <Package size={16} />,
                    },
                  );
                } else if (user.role === "warehouse") {
                  navItems.push(
                    {
                      id: "dashboard",
                      label: "Dashboard",
                      icon: <BarChart3 size={16} />,
                    },
                    {
                      id: "inventory",
                      label: "Inventory",
                      icon: <Package size={16} />,
                    },
                    {
                      id: "incoming",
                      label: "Incoming Stock",
                      icon: <Truck size={16} />,
                    },
                    {
                      id: "dispatch",
                      label: "Dispatch Requests",
                      icon: <ClipboardList size={16} />,
                    },
                    {
                      id: "campaigns",
                      label: "Campaigns",
                      icon: <Megaphone size={16} />,
                    },
                    {
                      id: "alerts",
                      label: "SMS Alerts",
                      icon: <AlertCircle size={16} />,
                    },
                    {
                      id: "reports",
                      label: "Reports",
                      icon: <FileText size={16} />,
                    },
                  );
                } else if (user.role === "hospital") {
                  navItems.push(
                    {
                      id: "dashboard",
                      label: "Dashboard",
                      icon: <BarChart3 size={16} />,
                    },
                    {
                      id: "request",
                      label: "Request Blood",
                      icon: <Truck size={16} />,
                    },
                    {
                      id: "patients",
                      label: "Patients",
                      icon: <Stethoscope size={16} />,
                    },
                    {
                      id: "stock",
                      label: "Available Stock",
                      icon: <Package size={16} />,
                    },
                  );
                }

                return (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "3px",
                    }}
                  >
                    {navItems.map((item) => {
                      const isActive = subTab === item.id;
                      // Category-specific count for this tab
                      const tabUnreadCount = notifications.filter(
                        (n) => n.category === item.id,
                      ).length;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setSubTab(item.id);
                            setMenuOpen(false);
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            width: "100%",
                            padding: "9px 12px",
                            borderRadius: "8px",
                            border: "none",
                            background: isActive
                              ? "var(--primary, #ef233c)"
                              : "transparent",
                            color: "#ffffff",
                            fontWeight: isActive ? 600 : 400,
                            fontSize: "0.82rem",
                            cursor: "pointer",
                            textAlign: "left",
                            opacity: isActive ? 1 : 0.8,
                            transition: "all 0.15s ease",
                            position: "relative",
                          }}
                          onMouseEnter={(e) => {
                            if (!isActive)
                              e.currentTarget.style.background =
                                "rgba(255, 255, 255, 0.08)";
                          }}
                          onMouseLeave={(e) => {
                            if (!isActive)
                              e.currentTarget.style.background = "transparent";
                          }}
                        >
                          {item.icon}
                          <span style={{ flex: 1 }}>{item.label}</span>
                          {tabUnreadCount > 0 && (
                            <span
                              style={{
                                background: "#ef233c",
                                color: "#fff",
                                borderRadius: "10px",
                                fontSize: "0.62rem",
                                fontWeight: 800,
                                minWidth: "18px",
                                height: "18px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                padding: "0 4px",
                                flexShrink: 0,
                              }}
                            >
                              {tabUnreadCount > 9 ? "9+" : tabUnreadCount}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

            {/* User Profile Badge at Bottom of Sidebar */}
            <div
              style={{
                borderTop: "1px solid rgba(255, 255, 255, 0.12)",
                paddingTop: "14px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "rgba(255, 255, 255, 0.15)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {getRoleIcon(user.role)}
                </div>
                <div style={{ overflow: "hidden", flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "#ffffff",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                    }}
                  >
                    {user.entity_name || user.email?.split("@")[0]}
                  </div>
                  <div
                    style={{
                      fontSize: "0.7rem",
                      color: "rgba(255, 255, 255, 0.65)",
                      textTransform: "capitalize",
                    }}
                  >
                    {getRoleBadgeTitle(user.role)}
                  </div>
                </div>
              </div>
              {/* Back to Dashboard + Sign Out row */}
              <div style={{ display: "flex", gap: "6px" }}>
                {subTab !== "dashboard" && (
                  <button
                    onClick={() => {
                      setSubTab("dashboard");
                      setMenuOpen(false);
                    }}
                    title="Back to Dashboard"
                    style={{
                      flex: 1,
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "rgba(255,255,255,0.85)",
                      cursor: "pointer",
                      padding: "6px 8px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "4px",
                      fontSize: "0.72rem",
                      fontWeight: 600,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.15)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        "rgba(255,255,255,0.08)")
                    }
                  >
                    <Home size={13} /> Dashboard
                  </button>
                )}
                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  style={{
                    flex: subTab !== "dashboard" ? "none" : 1,
                    background: "rgba(239,35,60,0.12)",
                    border: "1px solid rgba(239,35,60,0.25)",
                    color: "#ff6b6b",
                    cursor: "pointer",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "4px",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(239,35,60,0.22)";
                    e.currentTarget.style.color = "#ff8a8a";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(239,35,60,0.12)";
                    e.currentTarget.style.color = "#ff6b6b";
                  }}
                >
                  <LogOut size={13} /> Sign Out
                </button>
              </div>
            </div>
          </aside>

          {/* Main Content Workspace */}
          <main
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              background: "var(--bg-main)",
            }}
          >
            {/* Top Navbar Header */}
            <header style={{ 
              height: '56px', 
              background: 'var(--bg-surface)', 
              borderBottom: '1px solid var(--border-color)', 
              padding: isMobile ? '0 12px' : '0 24px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              flexShrink: 0,
              position: 'relative',
              zIndex: 100
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                {isMobile && (
                  <button 
                    onClick={() => setMenuOpen(prev => !prev)}
                    aria-label="Toggle navigation menu"
                    style={{
                      background: 'none',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      minHeight: '44px',
                      minWidth: '44px'
                    }}
                  >
                    <Menu size={18} />
                  </button>
                )}
              </div>

              {/* Search, Notifications, and Profile Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
                
                {/* Role-Specific Search Field (Desktop only) */}
                {!isMobile && (
                <div ref={searchRef} style={{ position: 'relative', width: '240px' }}>
                  <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text" 
                    placeholder={getSearchPlaceholder(user.role)}
                    value={searchQuery}
                    onFocus={() => setSearchFocused(true)}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchFocused(true);
                    }}
                    style={{
                      padding: "6px 28px 6px 30px",
                      fontSize: "0.78rem",
                      borderRadius: "6px",
                      border: "1px solid var(--border-color)",
                      background: "var(--bg-main)",
                      color: "var(--text-primary)",
                      outline: "none",
                      width: "100%",
                    }}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex' }}
                    >
                      <X size={12} />
                    </button>
                  )}

                  {/* Search Results Dropdown */}
                  {searchFocused && searchQuery.trim().length > 0 && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        right: 0,
                        width: "320px",
                        marginTop: "6px",
                        background: "var(--bg-surface)",
                        border: "1px solid var(--border-color)",
                        borderRadius: "8px",
                        boxShadow:
                          "var(--shadow-md, 0 10px 25px rgba(0,0,0,0.15))",
                        zIndex: 1000,
                        maxHeight: "340px",
                        overflowY: "auto",
                        padding: "8px",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "0.7rem",
                          fontWeight: 700,
                          color: "var(--text-muted)",
                          padding: "4px 8px",
                          textTransform: "uppercase",
                        }}
                      >
                        Search Results ({searchResults.length})
                      </div>

                      {searchResults.length === 0 ? (
                        <div
                          style={{
                            padding: "16px",
                            textAlign: "center",
                            fontSize: "0.8rem",
                            color: "var(--text-muted)",
                          }}
                        >
                          No matches found for "{searchQuery}"
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: "4px",
                          }}
                        >
                          {searchResults.map((res, i) => (
                            <div
                              key={i}
                              onClick={() => {
                                setSubTab(res.tab);
                                setSearchFocused(false);
                                setSearchQuery("");
                              }}
                              style={{
                                padding: "8px 10px",
                                borderRadius: "6px",
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                background: "transparent",
                                transition: "background 0.15s ease",
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background =
                                  "var(--bg-main)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background =
                                  "transparent")
                              }
                            >
                              <div>
                                <div
                                  style={{
                                    fontSize: "0.82rem",
                                    fontWeight: 600,
                                    color: "var(--text-primary)",
                                  }}
                                >
                                  {res.title}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.72rem",
                                    color: "var(--text-muted)",
                                  }}
                                >
                                  {res.desc}
                                </div>
                              </div>
                              <span
                                className="badge badge-approved"
                                style={{ fontSize: "0.65rem" }}
                              >
                                {res.category}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                )}

                {/* Mobile Search Icon */}
                {isMobile && (
                  <div ref={mobileSearchButtonRef} style={{ display: 'flex', alignItems: 'center' }}>
                    <button 
                      onClick={() => {
                        setMobileSearchOpen(prev => !prev);
                        setNotificationsOpen(false);
                        setProfileOpen(false);
                      }}
                      aria-label="Search"
                      title="Search"
                      className="header-action-btn"
                      style={{
                        color: mobileSearchOpen ? 'var(--primary)' : 'var(--text-secondary)'
                      }}
                    >
                      <Search size={18} />
                    </button>
                  </div>
                )}

                {/* Notification Bell Dropdown */}
                <div ref={notifRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => {
                      setNotificationsOpen((prev) => !prev);
                      setProfileOpen(false);
                    }}
                    className="header-action-btn"
                    style={{
                      color: notificationsOpen ? 'var(--primary)' : 'var(--text-secondary)'
                    }}
                    title="Notifications"
                  >
                    <Bell size={18} />
                    {unreadNotifCount > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: "-4px",
                          right: "-4px",
                          minWidth: "18px",
                          height: "18px",
                          background: "#ef233c",
                          borderRadius: "10px",
                          border: "2px solid var(--bg-surface)",
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          color: "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          padding: "0 3px",
                          lineHeight: 1,
                        }}
                      >
                        {unreadNotifCount > 9 ? "9+" : unreadNotifCount}
                      </span>
                    )}
                  </button>{" "}
                  {notificationsOpen && (
                    <div className="header-dropdown" style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      width: '320px',
                      marginTop: '10px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      boxShadow: 'var(--shadow-md, 0 10px 25px rgba(0,0,0,0.18))',
                      zIndex: 1000,
                      overflow: 'hidden'
                    }}>
                      <div style={{ padding: '12px 14px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <strong style={{ fontSize: '0.88rem' }}>Notifications</strong>
                          {unreadNotifCount > 0 && (
                            <span
                              className="badge badge-pending"
                              style={{
                                fontSize: "0.68rem",
                                padding: "2px 6px",
                              }}
                            >
                              {unreadNotifCount} new
                            </span>
                          )}
                        </div>
                        {unreadNotifCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            style={{
                              background: "none",
                              border: "none",
                              color: "var(--primary)",
                              fontSize: "0.72rem",
                              cursor: "pointer",
                              fontWeight: 600,
                            }}
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div
                        style={{
                          maxHeight: "340px",
                          overflowY: "auto",
                          display: "flex",
                          flexDirection: "column",
                        }}
                      >
                        {notifications.length === 0 ? (
                          <div
                            style={{
                              padding: "28px 16px",
                              textAlign: "center",
                              color: "var(--text-muted)",
                            }}
                          >
                            <CheckCircle2
                              size={30}
                              color="#06d6a0"
                              style={{ margin: "0 auto 8px", display: "block" }}
                            />
                            <div
                              style={{
                                fontSize: "0.85rem",
                                fontWeight: 600,
                                color: "var(--text-primary)",
                              }}
                            >
                              All caught up!
                            </div>
                            <div
                              style={{ fontSize: "0.75rem", marginTop: "2px" }}
                            >
                              No unread notifications
                            </div>
                          </div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                if (n.category) {
                                  setSubTab(n.category);
                                  setNotificationsOpen(false);
                                }
                                handleMarkAsRead(n.id);
                              }}
                              style={{
                                padding: "12px 14px",
                                borderBottom: "1px solid var(--border-color)",
                                background: "rgba(239,35,60,0.02)",
                                display: "flex",
                                gap: "10px",
                                alignItems: "flex-start",
                                cursor: n.category ? "pointer" : "default",
                                transition: "background 0.15s ease",
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.background =
                                  "rgba(239,35,60,0.06)";
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.background =
                                  "rgba(239,35,60,0.02)";
                              }}
                            >
                              <div
                                style={{
                                  width: "8px",
                                  height: "8px",
                                  borderRadius: "50%",
                                  background:
                                    n.type === "warning"
                                      ? "#f59e0b"
                                      : n.type === "success"
                                        ? "#06d6a0"
                                        : "var(--primary)",
                                  marginTop: "5px",
                                  flexShrink: 0,
                                }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: "0.82rem",
                                    fontWeight: 700,
                                    color: "var(--text-primary)",
                                    marginBottom: "2px",
                                  }}
                                >
                                  {n.title}
                                </div>
                                <div
                                  style={{
                                    fontSize: "0.75rem",
                                    color: "var(--text-secondary)",
                                    lineHeight: "1.4",
                                  }}
                                >
                                  {n.desc}
                                </div>
                                {n.time && (
                                  <div
                                    style={{
                                      fontSize: "0.68rem",
                                      color: "var(--text-muted)",
                                      marginTop: "4px",
                                    }}
                                  >
                                    {n.time}
                                  </div>
                                )}
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMarkAsRead(n.id);
                                }}
                                title="Mark as read (dismiss)"
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--text-muted)",
                                  cursor: "pointer",
                                  padding: "4px",
                                  borderRadius: "4px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  flexShrink: 0,
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.color = "#06d6a0";
                                  e.currentTarget.style.background =
                                    "rgba(6,214,160,0.12)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.color =
                                    "var(--text-muted)";
                                  e.currentTarget.style.background = "none";
                                }}
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Theme toggle */}
                <button
                  onClick={toggleTheme}
                  className="header-action-btn"
                  title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
                >
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                {/* User Avatar & Profile Dropdown */}
                <div ref={profileRef} style={{ position: "relative" }}>
                  <button
                    onClick={() => {
                      setProfileOpen((prev) => !prev);
                      setNotificationsOpen(false);
                    }}
                    className="header-action-btn"
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "var(--primary, #ef233c)",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.84rem",
                        fontWeight: 700,
                        boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                      }}
                    >
                      {user.entity_name
                        ? user.entity_name[0].toUpperCase()
                        : "U"}
                    </div>
                  </button>

                  {/* Profile Menu Dropdown */}
                  {profileOpen && (
                    <div className="header-dropdown" style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      width: '240px',
                      marginTop: '10px',
                      background: 'var(--bg-surface)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '10px',
                      boxShadow: 'var(--shadow-md, 0 10px 25px rgba(0,0,0,0.18))',
                      zIndex: 1000,
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '10px'
                    }}>
                      <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                        <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {user.entity_name || user.email?.split('@')[0]}
                        </div>
                        <div
                          style={{
                            fontSize: "0.74rem",
                            color: "var(--text-muted)",
                            wordBreak: "break-all",
                          }}
                        >
                          {user.email}
                        </div>
                        <span
                          className="badge badge-approved"
                          style={{
                            marginTop: "6px",
                            fontSize: "0.65rem",
                            display: "inline-block",
                          }}
                        >
                          {getRoleBadgeTitle(user.role)}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setSubTab("profile");
                          setProfileOpen(false);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'transparent',
                          color: 'var(--text-primary)',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background = "var(--bg-main)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background = "transparent")
                        }
                      >
                        <User size={15} /> My Profile
                      </button>

                      <button
                        onClick={handleLogout}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: 'none',
                          background: 'rgba(239,35,60,0.08)',
                          color: '#ef233c',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(239,35,60,0.15)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(239,35,60,0.08)")
                        }
                      >
                        <LogOut size={15} /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Mobile Search Panel (fixed under header) */}
            {isMobile && mobileSearchOpen && (
              <div ref={mobileSearchPanelRef} style={{
                position: 'fixed',
                top: '56px',
                left: 0,
                right: 0,
                zIndex: 999,
                background: 'var(--bg-surface)',
                borderBottom: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-md, 0 10px 25px rgba(0,0,0,0.12))',
                padding: '12px'
              }}>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input 
                    type="text"
                    autoFocus
                    placeholder={getSearchPlaceholder(user.role)}
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setSearchFocused(true);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px 40px',
                      fontSize: '0.85rem',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--bg-main)',
                      color: 'var(--text-primary)',
                      outline: 'none'
                    }}
                  />
                  {searchQuery && (
                    <button 
                      onClick={() => setSearchQuery('')}
                      aria-label="Clear search"
                      style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, display: 'flex', minHeight: '40px', minWidth: '40px', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {searchFocused && searchQuery.trim().length > 0 && (
                  <div style={{
                    marginTop: '8px',
                    maxHeight: '340px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 6px', textTransform: 'uppercase' }}>
                      Search Results ({searchResults.length})
                    </div>
                    {searchResults.length === 0 ? (
                      <div style={{ padding: '14px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        No matches found for "{searchQuery}"
                      </div>
                    ) : (
                      searchResults.map((res, i) => (
                        <div 
                          key={i}
                          onClick={() => {
                            setSubTab(res.tab);
                            setSearchFocused(false);
                            setSearchQuery('');
                            setMobileSearchOpen(false);
                          }}
                          style={{
                            padding: '10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'var(--bg-main)'
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '0.84rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                              {res.title}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {res.desc}
                            </div>
                          </div>
                          <span className="badge badge-approved" style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                            {res.category}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Dashboard Scrollable View Container */}
            <div style={{ flex: 1, padding: isMobile ? '16px' : '24px', overflowY: 'auto' }} className="animate-fade-in">
              {renderDashboardContent()}
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
