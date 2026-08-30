import { useEffect, useRef, useState } from 'react';
import { Bell, Check, CheckCircle2, LogOut, Menu, Moon, Search, Sun, User, X } from 'lucide-react';
import { getRoleConfig, searchRoleCatalog } from '../../config/roleConfig';

// Top navbar: hamburger (mobile), global search (desktop dropdown / mobile
// panel), notification bell with dropdown, theme toggle, and profile menu.
export default function Topbar({
  user,
  isMobile,
  onMenuToggle,
  theme,
  onToggleTheme,
  onNavigate,
  onLogout,
  notifications,
  unreadCount,
  markAsRead,
  markAllRead,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  // Close any open popover when clicking outside of it.
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchFocused(false);
      if (mobileSearchRef.current && !mobileSearchRef.current.contains(e.target)) setMobileSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotificationsOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const role = getRoleConfig(user.role);
  const searchResults = searchRoleCatalog(user.role, searchQuery);

  const closeAllPopovers = () => {
    setNotificationsOpen(false);
    setProfileOpen(false);
    setMobileSearchOpen(false);
  };

  const navigateTo = (tab) => {
    onNavigate(tab);
    closeAllPopovers();
    setSearchQuery('');
    setSearchFocused(false);
  };

  const searchInput = ({ autoFocus = false, inputStyle, iconSize }) => (
    <div style={{ position: 'relative' }}>
      <Search
        size={iconSize}
        style={{
          position: 'absolute',
          left: iconSize >= 15 ? '12px' : '10px',
          top: '50%',
          transform: 'translateY(-50%)',
          color: 'var(--text-muted)',
        }}
      />
      <input
        type="text"
        autoFocus={autoFocus}
        placeholder={role.searchPlaceholder}
        value={searchQuery}
        onFocus={() => setSearchFocused(true)}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setSearchFocused(true);
        }}
        style={inputStyle}
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          aria-label="Clear search"
          style={{
            position: 'absolute',
            right: '10px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '30px',
            minWidth: '30px',
          }}
        >
          <X size={iconSize + (-2)} />
        </button>
      )}
    </div>
  );

  const searchResultsList = ({ compact = false } = {}) => (
    <>
      <div
        style={{
          fontSize: '0.7rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          padding: compact ? '4px 6px' : '4px 8px',
          textTransform: 'uppercase',
        }}
      >
        Search Results ({searchResults.length})
      </div>
      {searchResults.length === 0 ? (
        <div
          style={{
            padding: compact ? '14px' : '16px',
            textAlign: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
          }}
        >
          No matches found for &quot;{searchQuery}&quot;
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {searchResults.map((res, i) => (
            <div
              key={`${res.tab}-${i}`}
              onClick={() => navigateTo(res.tab)}
              style={{
                padding: compact ? '10px' : '8px 10px',
                borderRadius: compact ? '8px' : '6px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '10px',
                background: compact ? 'var(--bg-main)' : 'transparent',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = compact ? 'rgba(255,255,255,0.05)' : 'var(--bg-main)')
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = compact ? 'var(--bg-main)' : 'transparent')
              }
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: compact ? '0.84rem' : '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {res.title}
                </div>
                <div style={{ fontSize: compact ? '0.74rem' : '0.72rem', color: 'var(--text-muted)' }}>{res.desc}</div>
              </div>
              <span className="badge badge-approved" style={{ fontSize: '0.65rem', flexShrink: 0 }}>
                {res.category}
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  );

  return (
    <header
      style={{
        height: '56px',
        background: 'var(--bg-surface)',
        borderBottom: '1px solid var(--border-color)',
        padding: isMobile ? '0 12px' : '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        position: 'relative',
        zIndex: 100,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        {isMobile && (
          <button
            onClick={onMenuToggle}
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
              minWidth: '44px',
            }}
          >
            <Menu size={18} />
          </button>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '8px' : '16px' }}>
        {/* Desktop search */}
        {!isMobile && (
          <div ref={searchRef} style={{ position: 'relative', width: '240px' }}>
            {searchInput({
              inputStyle: {
                padding: '6px 28px 6px 30px',
                fontSize: '0.78rem',
                borderRadius: '6px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-main)',
                color: 'var(--text-primary)',
                outline: 'none',
                width: '100%',
              },
              iconSize: 14,
            })}
            {searchFocused && searchQuery.trim().length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  width: '320px',
                  marginTop: '6px',
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  boxShadow: 'var(--shadow-md, 0 10px 25px rgba(0,0,0,0.15))',
                  zIndex: 1000,
                  maxHeight: '340px',
                  overflowY: 'auto',
                  padding: '8px',
                }}
              >
                {searchResultsList()}
              </div>
            )}
          </div>
        )}

        {/* Mobile search toggle */}
        {isMobile && (
          <button
            onClick={() => {
              setMobileSearchOpen((prev) => !prev);
              setNotificationsOpen(false);
              setProfileOpen(false);
            }}
            aria-label="Search"
            title="Search"
            className="header-action-btn"
            style={{ color: mobileSearchOpen ? 'var(--primary)' : 'var(--text-secondary)' }}
          >
            <Search size={18} />
          </button>
        )}

        {/* Notification bell */}
        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setNotificationsOpen((prev) => !prev);
              setProfileOpen(false);
            }}
            className="header-action-btn"
            style={{ color: notificationsOpen ? 'var(--primary)' : 'var(--text-secondary)' }}
            title="Notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  minWidth: '18px',
                  height: '18px',
                  background: '#ef233c',
                  borderRadius: '10px',
                  border: '2px solid var(--bg-surface)',
                  fontSize: '0.62rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                  lineHeight: 1,
                }}
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div
              style={{
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
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--border-color)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong style={{ fontSize: '0.88rem' }}>Notifications</strong>
                  {unreadCount > 0 && (
                    <span className="badge badge-pending" style={{ fontSize: '0.68rem', padding: '2px 6px' }}>
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.72rem',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div style={{ maxHeight: '340px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <CheckCircle2 size={30} color="#06d6a0" style={{ margin: '0 auto 8px', display: 'block' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>All caught up!</div>
                    <div style={{ fontSize: '0.75rem', marginTop: '2px' }}>No unread notifications</div>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        if (n.category) onNavigate(n.category);
                        markAsRead(n.id);
                      }}
                      style={{
                        padding: '12px 14px',
                        borderBottom: '1px solid var(--border-color)',
                        background: 'rgba(239,35,60,0.02)',
                        display: 'flex',
                        gap: '10px',
                        alignItems: 'flex-start',
                        cursor: n.category ? 'pointer' : 'default',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,35,60,0.06)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,35,60,0.02)')}
                    >
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background:
                            n.type === 'warning' ? '#f59e0b' : n.type === 'success' ? '#06d6a0' : 'var(--primary)',
                          marginTop: '5px',
                          flexShrink: 0,
                        }}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
                          {n.desc}
                        </div>
                        {n.time && (
                          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>{n.time}</div>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(n.id);
                        }}
                        title="Mark as read (dismiss)"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = '#06d6a0';
                          e.currentTarget.style.background = 'rgba(6,214,160,0.12)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-muted)';
                          e.currentTarget.style.background = 'none';
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
        <button onClick={onToggleTheme} className="header-action-btn" title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Profile avatar + menu */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <button
            onClick={() => {
              setProfileOpen((prev) => !prev);
              setNotificationsOpen(false);
            }}
            className="header-action-btn"
          >
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                background: 'var(--primary, #ef233c)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.84rem',
                fontWeight: 700,
                boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}
            >
              {user.entity_name ? user.entity_name[0].toUpperCase() : 'U'}
            </div>
          </button>

          {profileOpen && (
            <div
              style={{
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
                gap: '10px',
              }}
            >
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {user.entity_name || user.email?.split('@')[0]}
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', wordBreak: 'break-all' }}>{user.email}</div>
                <span
                  className="badge badge-approved"
                  style={{ marginTop: '6px', fontSize: '0.65rem', display: 'inline-block' }}
                >
                  {role.badgeTitle}
                </span>
              </div>

              <button
                onClick={() => navigateTo('profile')}
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
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <User size={15} /> My Profile
              </button>

              <button
                onClick={onLogout}
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
                  boxSizing: 'border-box',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,35,60,0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239,35,60,0.08)')}
              >
                <LogOut size={15} /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile search panel */}
      {isMobile && mobileSearchOpen && (
        <div
          ref={mobileSearchRef}
          style={{
            position: 'fixed',
            top: '56px',
            left: 0,
            right: 0,
            zIndex: 999,
            background: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-md, 0 10px 25px rgba(0,0,0,0.12))',
            padding: '12px',
          }}
        >
          {searchInput({
            autoFocus: true,
            iconSize: 15,
            inputStyle: {
              width: '100%',
              padding: '12px 40px',
              fontSize: '0.85rem',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-main)',
              color: 'var(--text-primary)',
              outline: 'none',
            },
          })}
          {searchFocused && searchQuery.trim().length > 0 && (
            <div style={{ marginTop: '8px', maxHeight: '340px', overflowY: 'auto' }}>
              {searchResultsList({ compact: true })}
            </div>
          )}
        </div>
      )}
    </header>
  );
}
