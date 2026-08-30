import {
  Activity,
  AlertCircle,
  Award,
  BarChart3,
  Building,
  CheckCircle2,
  ClipboardList,
  FileText,
  FlaskConical,
  Heart,
  History,
  Key,
  Megaphone,
  MessageSquare,
  Package,
  Search,
  Shield,
  Stethoscope,
  Truck,
  User,
  Users,
} from 'lucide-react';

// Single source of truth for everything that varies per role: sidebar
// navigation, global-search catalog, labels, and icons. Adding a tab for a
// role only requires editing that role's entry here.
export const ROLES = ['admin', 'donor', 'station', 'laboratory', 'warehouse', 'hospital'];

export const ROLE_CONFIG = {
  admin: {
    badgeTitle: 'Super Administrator',
    searchPlaceholder: 'Search users, stations, logs...',
    icon: <Shield size={18} color="#ffffff" />,
    nav: [
      { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
      { id: 'approvals', label: 'Workstation Approvals', icon: <Users size={16} /> },
      { id: 'users', label: 'Users', icon: <User size={16} /> },
      { id: 'audit', label: 'Audit Logs', icon: <Activity size={16} /> },
      { id: 'resets', label: 'Password Reset Tickets', icon: <Key size={16} /> },
      { id: 'analytics', label: 'System Analytics', icon: <BarChart3 size={16} /> },
    ],
    searchCatalog: [
      { title: 'Workstation Approvals', category: 'Approvals', tab: 'approvals', desc: 'Pending hospital & station registrations' },
      { title: 'Registered Users Directory', category: 'Users', tab: 'users', desc: 'All user accounts and roles' },
      { title: 'System Audit Logs', category: 'Security', tab: 'audit', desc: 'Security events and action history' },
      { title: 'Password Reset Tickets', category: 'Support', tab: 'resets', desc: 'Active workstation reset requests' },
      { title: 'System Analytics', category: 'Reports', tab: 'analytics', desc: 'Monthly supply and demand analytics' },
    ],
  },

  donor: {
    badgeTitle: 'Certified Blood Donor',
    searchPlaceholder: 'Search campaigns, stations...',
    icon: <Heart size={18} color="#ffffff" fill="#ffffff" />,
    nav: [
      { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
      { id: 'profile', label: 'My Profile', icon: <User size={16} /> },
      { id: 'campaigns', label: 'Campaigns', icon: <Megaphone size={16} /> },
      { id: 'points', label: 'My Points', icon: <Award size={16} /> },
      { id: 'eligibility', label: 'Eligibility Status', icon: <CheckCircle2 size={16} /> },
      { id: 'history', label: 'Donation History', icon: <History size={16} /> },
      { id: 'messages', label: 'Messages', icon: <MessageSquare size={16} /> },
    ],
    searchCatalog: [
      { title: 'Upcoming Campaigns & Drives', category: 'Campaigns', tab: 'campaigns', desc: 'Meskel Square & University drives' },
      { title: 'Eligibility Status', category: 'Medical', tab: 'eligibility', desc: 'Check your 90-day donation countdown' },
      { title: 'My Reward Points', category: 'Rewards', tab: 'points', desc: 'View loyalty tier and points leaderboard' },
      { title: 'Donation History', category: 'Records', tab: 'history', desc: 'Past donations and certificates' },
      { title: 'Messages & Alerts', category: 'Messages', tab: 'messages', desc: 'Notifications from medical team' },
    ],
  },

  station: {
    badgeTitle: 'Donation Collection Station',
    searchPlaceholder: 'Search donors, samples...',
    icon: <Activity size={18} color="#ffffff" />,
    nav: [
      { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
      { id: 'eligibility', label: 'Eligibility Check', icon: <CheckCircle2 size={16} /> },
      { id: 'collect', label: 'Collect Sample', icon: <Activity size={16} /> },
      { id: 'collections', label: "Today's Collections", icon: <ClipboardList size={16} /> },
      { id: 'donors', label: 'Donors List', icon: <Users size={16} /> },
      { id: 'reports', label: 'Reports', icon: <FileText size={16} /> },
    ],
    searchCatalog: [
      { title: 'Eligibility Check', category: 'Screening', tab: 'eligibility', desc: 'Verify 90-day donation interval' },
      { title: 'Collect Blood Sample', category: 'Collection', tab: 'collect', desc: 'Pre-donation questionnaire & collection' },
      { title: 'Registered Donors Directory', category: 'Donors', tab: 'donors', desc: 'Search certified donor database' },
      { title: "Today's Collections Log", category: 'Dispatches', tab: 'collections', desc: 'Track blood bags collected today' },
      { title: 'Station Analytics Reports', category: 'Reports', tab: 'reports', desc: 'Intake volume and blood type breakdown' },
    ],
  },

  laboratory: {
    badgeTitle: 'Certified Laboratory',
    searchPlaceholder: 'Search samples, records...',
    icon: <FlaskConical size={18} color="#ffffff" />,
    nav: [
      { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
      { id: 'pending', label: 'Pending Samples', icon: <FlaskConical size={16} /> },
      { id: 'records', label: 'Lab Records', icon: <ClipboardList size={16} /> },
      { id: 'points', label: 'Donor Points', icon: <Award size={16} /> },
      { id: 'reports', label: 'Reports', icon: <FileText size={16} /> },
      { id: 'inventory', label: 'Inventory Out', icon: <Package size={16} /> },
    ],
    searchCatalog: [
      { title: 'Pending Screening Queue', category: 'Screening', tab: 'pending', desc: 'Blood samples awaiting viral test' },
      { title: 'Confidential Lab Records', category: 'Records', tab: 'records', desc: 'Verified screening history and markers' },
      { title: 'Donor Reward Points', category: 'Points', tab: 'points', desc: 'Points awarded after validation' },
      { title: 'Inventory Out Dispatches', category: 'Warehouse', tab: 'inventory', desc: 'Validated units routed to warehouse' },
      { title: 'Laboratory Quality Reports', category: 'Reports', tab: 'reports', desc: 'Negative pass rate and defect metrics' },
    ],
  },

  warehouse: {
    badgeTitle: 'Central Blood Bank Warehouse',
    searchPlaceholder: 'Search inventory, requests...',
    icon: <Building size={18} color="#ffffff" />,
    nav: [
      { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
      { id: 'inventory', label: 'Inventory', icon: <Package size={16} /> },
      { id: 'incoming', label: 'Incoming Stock', icon: <Truck size={16} /> },
      { id: 'dispatch', label: 'Dispatch Requests', icon: <ClipboardList size={16} /> },
      { id: 'campaigns', label: 'Campaigns', icon: <Megaphone size={16} /> },
      { id: 'alerts', label: 'SMS Alerts', icon: <AlertCircle size={16} /> },
      { id: 'reports', label: 'Reports', icon: <FileText size={16} /> },
    ],
    searchCatalog: [
      { title: 'Central Blood Bank Inventory', category: 'Inventory', tab: 'inventory', desc: 'Current stock across all 8 blood types' },
      { title: 'Incoming Stock', category: 'Supply', tab: 'incoming', desc: 'Blood bags delivered from laboratories' },
      { title: 'Hospital Dispatch Requests', category: 'Orders', tab: 'dispatch', desc: 'Fulfill hospital requisition orders' },
      { title: 'Campaign Announcements', category: 'Drives', tab: 'campaigns', desc: 'Create public donation campaigns' },
      { title: 'Emergency SMS Broadcast', category: 'Alerts', tab: 'alerts', desc: 'Dispatch SMS for critical blood shortages' },
    ],
  },

  hospital: {
    badgeTitle: 'Partner Hospital (HMS)',
    searchPlaceholder: 'Search patients, requests...',
    icon: <Stethoscope size={18} color="#ffffff" />,
    nav: [
      { id: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={16} /> },
      { id: 'request', label: 'Request Blood', icon: <Truck size={16} /> },
      { id: 'patients', label: 'Patients', icon: <Stethoscope size={16} /> },
      { id: 'stock', label: 'Available Stock', icon: <Package size={16} /> },
      { id: 'lookup', label: 'Emergency Lookup', icon: <Search size={16} /> },
    ],
    searchCatalog: [
      { title: 'Central Requisition Order', category: 'Orders', tab: 'request', desc: 'Order blood from central warehouse' },
      { title: 'My Active Blood Requests', category: 'Tracking', tab: 'request', desc: 'Status of dispatched blood orders' },
      { title: 'Hospital Patients (HMS)', category: 'Patients', tab: 'patients', desc: 'Admit patients and assign blood units' },
      { title: 'Facility Blood Reserve', category: 'Stock', tab: 'stock', desc: 'On-site refrigeration inventory' },
      { title: 'Emergency Patient Lookup', category: 'Emergency', tab: 'lookup', desc: 'Search donor medical history by FAYDA ID or name' },
    ],
  },
};

const FALLBACK_CONFIG = {
  badgeTitle: 'Member',
  searchPlaceholder: 'Search...',
  icon: <User size={18} color="#ffffff" />,
  nav: [],
  searchCatalog: [],
};

export function getRoleConfig(role) {
  return ROLE_CONFIG[role] || FALLBACK_CONFIG;
}

// Filters a role's search catalog by query across title/category/description.
export function searchRoleCatalog(role, query) {
  if (!query || !query.trim()) return [];
  const q = query.toLowerCase();
  return getRoleConfig(role).searchCatalog.filter(
    (item) =>
      item.title.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.desc.toLowerCase().includes(q),
  );
}
