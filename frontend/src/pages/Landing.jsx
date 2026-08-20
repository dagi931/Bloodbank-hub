import React, { useState, useEffect } from 'react';
import { Heart, ShieldCheck, Activity, Users, Calendar, CloudLightning, ArrowRight, ShieldAlert, Award, Globe, Menu, Server, Shield, HelpCircle } from 'lucide-react';

export default function Landing({ onNavigateToLogin, onNavigateToRegister }) {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMenuOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'var(--bg-main)', 
      display: 'flex', 
      flexDirection: 'column',
      color: 'var(--text-primary)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      
      {/* Self-contained 3D & Micro-Animation Style Sheet */}
      <style>{`
        .hero-3d-container {
          perspective: 1200px;
          position: relative;
        }
        .hero-3d-card {
          transition: transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
          transform-style: preserve-3d;
        }
        .hero-3d-card:hover {
          transform: rotateX(6deg) rotateY(-6deg) translateZ(15px);
        }
        .feature-3d-card {
          transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
          transform-style: preserve-3d;
          perspective: 1000px;
          cursor: pointer;
        }
        .feature-3d-card:hover {
          transform: translateY(-8px) scale(1.02) rotateX(4deg) rotateY(4deg);
          box-shadow: 0 20px 40px rgba(239,35,60,0.12) !important;
          border-color: rgba(239, 35, 60, 0.25) !important;
        }
        .pulse-droplet {
          animation: dropletPulse 2s infinite alternate ease-in-out;
        }
        @keyframes dropletPulse {
          0% { transform: scale(1); filter: drop-shadow(0 4px 6px rgba(239,35,60,0.3)); }
          100% { transform: scale(1.08); filter: drop-shadow(0 12px 20px rgba(239,35,60,0.6)); }
        }
        .blood-cell-3d {
          position: absolute;
          background: radial-gradient(circle at 30% 30%, #ff4d5a 0%, #e63946 70%, #b30010 100%);
          border-radius: 50%;
          box-shadow: 
            inset -8px -8px 20px rgba(0,0,0,0.32), 
            inset 8px 8px 16px rgba(255,255,255,0.45),
            0 15px 35px rgba(230,57,70,0.2);
          filter: blur(1px);
          animation: floatAround3D 22s infinite ease-in-out;
          pointer-events: none;
          z-index: 1;
          opacity: 0.82;
        }
        
        .blood-cell-3d::after {
          content: '';
          position: absolute;
          top: 25%;
          left: 25%;
          width: 50%;
          height: 50%;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(0,0,0,0.2) 0%, transparent 80%);
          box-shadow: inset 0 0 6px rgba(0,0,0,0.35);
        }

        @keyframes floatAround3D {
          0% { transform: translate(0, 0) rotate(0deg) scale(1) skew(0deg); }
          33% { transform: translate(60px, -40px) rotate(120deg) scale(1.06) skew(2deg); }
          66% { transform: translate(-30px, 80px) rotate(240deg) scale(0.94) skew(-2deg); }
          100% { transform: translate(0, 0) rotate(360deg) scale(1) skew(0deg); }
        }

        .video-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          z-index: 0;
          pointer-events: none;
        }
      `}</style>

      {/* Background Microscope Video loop fixed at the root level */}
      <div className="video-container">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: 0.08
          }}
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-blood-cells-under-a-microscope-loop-33003-large.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Floating 3D Biconcave Red Blood Cell Canvas elements */}
      <div className="blood-cell-3d" style={{ top: '15%', left: '8%', width: '120px', height: '120px', animationDelay: '0s' }} />
      <div className="blood-cell-3d" style={{ top: '45%', right: '10%', width: '160px', height: '160px', animationDelay: '-5s', animationDuration: '25s' }} />
      <div className="blood-cell-3d" style={{ bottom: '25%', left: '12%', width: '90px', height: '90px', animationDelay: '-10s', animationDuration: '22s' }} />
      <div className="blood-cell-3d" style={{ top: '8%', right: '25%', width: '70px', height: '70px', animationDelay: '-3s', animationDuration: '18s' }} />
      <div className="blood-cell-3d" style={{ bottom: '8%', right: '15%', width: '110px', height: '110px', animationDelay: '-7s', animationDuration: '28s' }} />

      {/* Top Navbar */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '20px 5%', 
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        zIndex: 10,
        position: 'relative',
        boxShadow: '0 1px 12px rgba(0,0,0,0.06)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="pulse-droplet" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={28} color="var(--primary)" fill="var(--primary)" />
          </div>
          <span style={{ fontSize: '1.4rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
            Blood Bank Hub
          </span>
        </div>

        {/* Desktop Buttons */}
        {!isMobile && (
          <div style={{ display: 'flex', gap: '16px' }}>
            <button 
              onClick={onNavigateToLogin}
              className="btn"
              style={{ 
                background: 'var(--bg-surface)', 
                color: 'var(--text-primary)', 
                border: '1px solid var(--border-color)',
                fontWeight: 600,
                padding: '8px 20px'
              }}
            >
              Sign In
            </button>
            <button 
              onClick={onNavigateToRegister}
              className="btn btn-primary"
              style={{ 
                fontWeight: 600,
                padding: '8px 20px'
              }}
            >
              Join Registry
            </button>
          </div>
        )}

        {/* Mobile Burger Sandwich Icon */}
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
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              zIndex: 100
            }}
          >
            <Menu size={18} />
          </button>
        )}
      </header>

      {/* Mobile Menu Dropdown drawer */}
      {isMobile && menuOpen && (
        <div style={{
          position: 'absolute',
          top: '70px',
          left: '5%',
          right: '5%',
          background: 'rgba(255,255,255,0.95)',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: '12px',
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          zIndex: 99,
          boxShadow: '0 10px 30px rgba(0,0,0,0.12)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)'
        }} className="animate-fade-in">
          <button 
            onClick={() => { setMenuOpen(false); onNavigateToLogin(); }}
            className="btn"
            style={{ 
              width: '100%',
              background: '#f4f5f8', 
              color: '#1a1a24', 
              border: '1px solid rgba(0,0,0,0.1)',
              fontWeight: 600,
              padding: '10px'
            }}
          >
            Sign In
          </button>
          <button 
            onClick={() => { setMenuOpen(false); onNavigateToRegister(); }}
            className="btn btn-primary"
            style={{ 
              width: '100%',
              fontWeight: 600,
              padding: '10px'
            }}
          >
            Join Registry
          </button>
        </div>
      )}
    
  
        {/* Hero Section with Microscope Background Video */}
      <section style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        textAlign: 'center', 
        padding: '100px 24px 80px 24px',
        maxWidth: '960px',
        margin: '0 auto',
        zIndex: 5
      }} className="animate-fade-in hero-3d-container">
        


        {/* Badge Indicator */}
        <div style={{ 
          background: 'rgba(239,35,60,0.08)', 
          border: '1px solid rgba(239,35,60,0.15)', 
          color: 'var(--primary)', 
          padding: '6px 16px', 
          borderRadius: '30px', 
          fontSize: '0.78rem', 
          fontWeight: 700, 
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          marginBottom: '24px',
          zIndex: 2
        }}>
          🇪🇹 Ethiopian National Blood Services Network
        </div>

        {/* 3D Hero Title block */}
        <div className="hero-3d-card" style={{ padding: '10px', zIndex: 2 }}>
          <h1 style={{ 
            fontSize: '3.6rem', 
            fontWeight: 900, 
            lineHeight: 1.1, 
            letterSpacing: '-1.8px', 
            marginBottom: '24px',
            color: 'var(--text-primary)'
          }}>
            Life-Saving Blood,<br />
            Synchronized in <span style={{ color: 'var(--primary)' }}>Real-Time</span>.
          </h1>
        </div>

        <p style={{ 
          fontSize: '1.2rem', 
          lineHeight: 1.6, 
          color: 'var(--text-secondary)', 
          marginBottom: '40px',
          maxWidth: '750px',
          zIndex: 2
        }}>
          Connecting regional blood networks with the National FAYDA Registry to deliver faster care, better donor coordination, and life-saving support when every minute matters.
        </p>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', zIndex: 2 }}>
          <button 
            onClick={onNavigateToLogin}
            className="btn btn-primary"
            style={{ 
              padding: '14px 28px', 
              fontSize: '1rem', 
              fontWeight: 'bold', 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 8px 24px rgba(239,35,60,0.2)'
            }}
          >
            Enter Workstation Portal <ArrowRight size={18} />
          </button>
          <button 
            onClick={onNavigateToRegister}
            className="btn"
            style={{ 
              padding: '14px 28px', 
              fontSize: '1rem', 
              fontWeight: 'bold', 
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              background: 'var(--bg-surface)'
            }}
          >
            Register Donor Profile
          </button>
        </div>
      </section>

      {/* NEW SECTION: Standard Blood Bank Tasks & Services */}
      <section style={{ 
        background: 'var(--bg-main)', 
        borderTop: '1px solid var(--border-color)', 
        padding: '80px 5%',
        zIndex: 5
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 850, letterSpacing: '-0.7px', marginBottom: '12px' }}>
              Core Blood Banking Life-Cycle & Services
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '650px', margin: '0 auto', fontSize: '1rem' }}>
              Standard operational procedures deployed nationwide to guarantee optimal patient safety and fluid logistics.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '24px' 
          }}>
            
            {/* Task 1: Donation Drives & Recruitment */}
            <div className="glass-card feature-3d-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'rgba(239,35,60,0.06)', color: 'var(--primary)', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 'bold', margin: 0 }}>1. Recruitment & Donation Drives</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                Coordinating mobile collection drives and donor check-ins. Voluntary donors schedule slots online, validating medical thresholds automatically.
              </p>
            </div>

            {/* Task 2: Testing & Screening */}
            <div className="glass-card feature-3d-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'rgba(6,214,160,0.06)', color: '#06d6a0', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={22} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 'bold', margin: 0 }}>2. Laboratory Disease Screening</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                Enforcing strict screening for ABO/Rh groups and infectious markers (HIV, Hepatitis B/C, Malaria, Syphilis) inside isolated lab databases.
              </p>
            </div>

            {/* Task 3: Real-Time Distribution */}
            <div className="glass-card feature-3d-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ background: 'rgba(131,56,236,0.06)', color: '#8338ec', width: '44px', height: '44px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Globe size={22} />
              </div>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 'bold', margin: 0 }}>3. Emergency Dispatch Logistics</h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, margin: 0 }}>
                Fulfilling critical hospital dispatches. Regional facilities exchange emergency stocks via peer-to-peer boards and live WebSocket channels.
              </p>
            </div>

          </div>
        </div>
      </section>
            {/* Feature Grid Section (Platform Features) */}
      <section style={{ 
        background: 'var(--bg-surface)', 
        borderTop: '1px solid var(--border-color)', 
        padding: '80px 5%',
        zIndex: 5
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '12px' }}>
              System Integration Features
            </h2>
            <p style={{ color: 'var(--text-secondary)', maxWidth: '600px', margin: '0 auto' }}>
              Advanced software configurations connecting collection drives, screening centers, and critical emergency boards.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '30px' 
          }}>
            
            {/* Feature 1 */}
            <div className="glass-card feature-3d-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(239,35,60,0.08)', color: 'var(--primary)', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Activity size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Real-Time Hub Requisitions</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                Connects regional Red Cross clinics with Central Warehouses. Requisition orders notify warehouse dispatchers instantly via socket channels.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card feature-3d-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(6,214,160,0.08)', color: '#06d6a0', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheck size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>Clinical Screen Isolation</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                Maintains separated database registries for platelet levels, diseases screening, and tested blood types. Results sync to FAYDA profiles.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card feature-3d-card" style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ background: 'rgba(58,134,255,0.08)', color: '#3a86ff', width: '48px', height: '48px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CloudLightning size={24} />
              </div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: 0 }}>IndexedDB Mobile Offline Caching</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.5, margin: 0 }}>
                Supports remote station campaigns during regional grid outages. Screenings cache locally in browser IndexedDB, syncing automatically on reconnection.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ 
        padding: '30px 5%', 
        borderTop: '1px solid var(--border-color)', 
        background: 'var(--bg-surface)', 
        textAlign: 'center',
        fontSize: '0.82rem',
        color: 'var(--text-muted)',
        zIndex: 5
      }}>
        <p style={{ margin: 0 }}>
          &copy; {new Date().getFullYear()} Ethiopian National Blood Bank Service Coordination Registry. Developed for healthcare providers.
        </p>
      </footer>

    </div>
  );
}
