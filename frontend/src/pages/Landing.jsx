import React, { useState, useEffect } from 'react';
import { 
  Heart, ShieldCheck, Activity, Users, ArrowRight, ShieldAlert, Award, 
  Globe, Menu, Phone, Clock, MapPin, CheckCircle2, ChevronRight, 
  Droplet, Sparkles, Building2, Stethoscope, Truck, Megaphone, 
  FileText, AlertCircle, X, Info, Calendar, Database, Check
} from 'lucide-react';

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

  const donorPhotos = [
    {
      src: '/images/donor_session_1.jpg',
      title: 'BBH Certified Phlebotomy Station',
      subtitle: 'Clinical staff administering safe venipuncture'
    },
    {
      src: '/images/donor_session_2.jpg',
      title: 'Voluntary Blood Donation Drive',
      subtitle: 'Smiling donors giving the gift of life'
    },
    {
      src: '/images/donor_session_3.jpg',
      title: 'University Youth Mobilization',
      subtitle: 'Student community champions in action'
    },
    {
      src: '/images/donor_session_4.jpg',
      title: 'Community Voluntary Champions',
      subtitle: 'Regular 90-day donors saving maternal lives'
    },
    {
      src: '/images/donor_session_5.jpg',
      title: 'Generations of Solidarity',
      subtitle: 'Inspiring youth through voluntary humanitarian action'
    }
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#ffffff', 
      display: 'flex', 
      flexDirection: 'column',
      color: '#1a1a24',
      position: 'relative',
      overflowX: 'hidden',
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      
      {/* 3D & Micro-Animation Style Sheet */}
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

        /* Sideways Infinite Moving Marquee */
        @keyframes scrollMarquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .marquee-viewport {
          overflow: hidden;
          width: 100%;
          position: relative;
          mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
          -webkit-mask-image: linear-gradient(to right, transparent, black 5%, black 95%, transparent);
        }
        .marquee-track {
          display: flex;
          gap: 24px;
          width: max-content;
          animation: scrollMarquee 32s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        .marquee-slide {
          width: 320px;
          height: 230px;
          border-radius: 12px;
          overflow: hidden;
          flex-shrink: 0;
          position: relative;
          border: 1px solid rgba(0,0,0,0.08);
          box-shadow: 0 10px 25px rgba(0,0,0,0.08);
          cursor: pointer;
        }
        .marquee-slide img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.4s ease;
        }
        .marquee-slide:hover img {
          transform: scale(1.06);
        }
        .marquee-caption {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 16px 14px 10px 14px;
          background: linear-gradient(to top, rgba(15,23,42,0.92) 0%, rgba(15,23,42,0.6) 60%, rgba(15,23,42,0) 100%);
          color: #ffffff;
        }

        .bbh-row {
          transition: background-color 0.2s ease;
        }
        .bbh-row:hover {
          background-color: rgba(239, 35, 60, 0.02);
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
            opacity: 0.06
          }}
        >
          <source src="https://assets.mixkit.co/videos/preview/mixkit-blood-cells-under-a-microscope-loop-33003-large.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Top Government Strip */}
      <div style={{
        background: '#0f172a',
        color: '#94a3b8',
        padding: '7px 5%',
        fontSize: '0.78rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        zIndex: 20,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ffffff', fontWeight: 600 }}>
            <Phone size={12} color="#ef233c" /> TOLL-FREE NATIONAL HOTLINE: <strong style={{ color: '#ef233c' }}>8040</strong>
          </span>
          <span style={{ display: isMobile ? 'none' : 'inline', opacity: 0.5 }}>|</span>
          <span style={{ display: isMobile ? 'none' : 'inline' }}>
            የኢትዮጵያ የደም እና የህብረ ህዋስ ባንክ አገልግሎት (BBH)
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ display: isMobile ? 'none' : 'inline' }}>
            Lideta Sub-City, Addis Ababa, Ethiopia
          </span>
          <button 
            onClick={onNavigateToLogin}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: '#ef233c', 
              fontSize: '0.78rem', 
              fontWeight: 700, 
              cursor: 'pointer' 
            }}
          >
            Staff Portal →
          </button>
        </div>
      </div>

      {/* Main Navigation Header */}
      <header style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: '16px 5%', 
        borderBottom: '1px solid #e2e8f0',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        zIndex: 15,
        position: 'sticky',
        top: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="pulse-droplet" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Heart size={26} color="#ef233c" fill="#ef233c" />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.5px', color: '#0f172a', lineHeight: 1.1 }}>
              Blood Bank Hub
            </span>
            <span style={{ fontSize: '0.68rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              National Blood Services Network (BBH)
            </span>
          </div>
        </div>

        {/* Desktop Links & Action Buttons */}
        {!isMobile && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ display: 'flex', gap: '18px', fontSize: '0.86rem', fontWeight: 600, color: '#475569' }}>
              <a href="#about" style={{ textDecoration: 'none', color: 'inherit' }}>About BBH</a>
              <a href="#gallery" style={{ textDecoration: 'none', color: 'inherit' }}>Donor Gallery</a>
              <a href="#pipeline" style={{ textDecoration: 'none', color: 'inherit' }}>Services</a>
              <a href="#eligibility" style={{ textDecoration: 'none', color: 'inherit' }}>Eligibility</a>
              <a href="#network" style={{ textDecoration: 'none', color: 'inherit' }}>Regional Centers</a>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '10px' }}>
              <button 
                onClick={onNavigateToLogin}
                style={{ 
                  background: 'transparent', 
                  color: '#334155', 
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontWeight: 600,
                  fontSize: '0.86rem',
                  padding: '8px 18px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Sign In
              </button>
              <button 
                onClick={onNavigateToRegister}
                style={{ 
                  background: '#ef233c',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.86rem',
                  padding: '8px 20px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239,35,60,0.25)',
                  transition: 'all 0.15s ease'
                }}
              >
                Register as Donor
              </button>
            </div>
          </div>
        )}

        {/* Mobile Menu Toggle */}
        {isMobile && (
          <button 
            onClick={() => setMenuOpen(prev => !prev)}
            style={{
              background: 'transparent',
              border: '1px solid #cbd5e1',
              color: '#334155',
              cursor: 'pointer',
              padding: '6px 10px',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        )}
      </header>

      {/* Mobile Drawer */}
      {isMobile && menuOpen && (
        <div style={{
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          padding: '16px 5%',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          zIndex: 14
        }}>
          <button 
            onClick={() => { setMenuOpen(false); onNavigateToLogin(); }}
            style={{ 
              width: '100%',
              background: '#f1f5f9', 
              color: '#0f172a', 
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontWeight: 600,
              padding: '10px'
            }}
          >
            Sign In to Workstation
          </button>
          <button 
            onClick={() => { setMenuOpen(false); onNavigateToRegister(); }}
            style={{ 
              width: '100%',
              background: '#ef233c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontWeight: 700,
              padding: '10px'
            }}
          >
            Register Donor Profile
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* HERO SECTION - EXACT REPRODUCTION (PRESERVED AS REQUESTED)                */}
      {/* ========================================================================= */}
      <section style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        textAlign: 'center', 
        padding: '110px 24px 90px 24px',
        maxWidth: '1100px',
        margin: '0 auto',
        zIndex: 5,
        position: 'relative',
        minHeight: '480px',
        width: '100%',
        boxSizing: 'border-box'
      }} className="hero-3d-container">
        
        {/* Floating 3D Biconcave Red Blood Cells (Positioned strictly in the Hero view) */}
        <div className="blood-cell-3d" style={{ top: '28%', left: isMobile ? '-10px' : '-35px', width: '135px', height: '135px', animationDelay: '0s' }} />
        <div className="blood-cell-3d" style={{ top: '6%', right: isMobile ? '-5px' : '45px', width: '95px', height: '95px', animationDelay: '-4s', animationDuration: '24s' }} />
        <div className="blood-cell-3d" style={{ top: '4%', left: '16%', width: '55px', height: '55px', animationDelay: '-8s', animationDuration: '19s' }} />
        <div className="blood-cell-3d" style={{ bottom: '10%', right: isMobile ? '-15px' : '-25px', width: '110px', height: '110px', animationDelay: '-6s', animationDuration: '26s' }} />

        {/* Badge Indicator */}
        <div style={{ 
          background: 'rgba(239,35,60,0.08)', 
          border: '1px solid rgba(239,35,60,0.2)', 
          color: '#ef233c', 
          padding: '6px 18px', 
          borderRadius: '30px', 
          fontSize: '0.76rem', 
          fontWeight: 800, 
          letterSpacing: '0.8px',
          textTransform: 'uppercase',
          marginBottom: '26px',
          zIndex: 2,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px'
        }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 900, background: '#ef233c', color: '#fff', padding: '1px 5px', borderRadius: '3px' }}>ET</span>
          ETHIOPIAN NATIONAL BLOOD SERVICES NETWORK
        </div>

        {/* 3D Hero Title */}
        <div className="hero-3d-card" style={{ zIndex: 2 }}>
          <h1 style={{ 
            fontSize: isMobile ? '2.5rem' : '3.8rem', 
            fontWeight: 900, 
            lineHeight: 1.12, 
            letterSpacing: '-1.5px', 
            marginBottom: '24px',
            color: '#0f172a'
          }}>
            Life-Saving Blood,<br />
            Synchronized in <span style={{ color: '#ef233c' }}>Real-Time</span>.
          </h1>
        </div>

        {/* Subtitle */}
        <p style={{ 
          fontSize: isMobile ? '1.05rem' : '1.18rem', 
          lineHeight: 1.65, 
          color: '#475569', 
          marginBottom: '38px',
          maxWidth: '750px',
          zIndex: 2
        }}>
          Connecting regional blood networks with the National FAYDA Registry to deliver faster care, better donor coordination, and life-saving support when every minute matters.
        </p>

        {/* Hero Action Buttons */}
        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', justifyContent: 'center', zIndex: 2 }}>
          <button 
            onClick={onNavigateToLogin}
            style={{ 
              background: '#d90429',
              color: '#ffffff',
              border: 'none',
              padding: '14px 28px', 
              fontSize: '0.98rem', 
              fontWeight: 700, 
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 8px 24px rgba(217, 4, 41, 0.3)',
              transition: 'all 0.2s ease'
            }}
          >
            Enter Workstation Portal <ArrowRight size={18} />
          </button>
          <button 
            onClick={onNavigateToRegister}
            style={{ 
              background: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              padding: '14px 28px', 
              fontSize: '0.98rem', 
              fontWeight: 700, 
              borderRadius: '8px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease'
            }}
          >
            Register Donor Profile
          </button>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 1: SIDEWAYS MOVING DONOR PHOTO GALLERY (INFINITE REPEAT MARQUEE)  */}
      {/* ========================================================================= */}
      <section id="gallery" style={{ 
        background: '#0f172a', 
        padding: '50px 0',
        zIndex: 5,
        position: 'relative'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto 24px auto', padding: '0 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ color: '#ef233c', fontWeight: 800, fontSize: '0.76rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
              VOICES OF HUMANITY: REGIONAL IMPACT
            </div>
            <h2 style={{ color: '#ffffff', fontSize: isMobile ? '1.5rem' : '1.9rem', fontWeight: 900, letterSpacing: '-0.5px', margin: 0 }}>
              Real Donors, Real Lives Saved Across Ethiopia
            </h2>
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.82rem' }}>
            Hover to pause • Continuous live field dispatches
          </div>
        </div>

        {/* Infinite Moving Marquee Viewport */}
        <div className="marquee-viewport">
          <div className="marquee-track">
            {/* Render two duplicated sets for seamless infinite repeating scroll */}
            {[...donorPhotos, ...donorPhotos].map((photo, index) => (
              <div key={index} className="marquee-slide">
                <img src={photo.src} alt={photo.title} />
                <div className="marquee-caption">
                  <div style={{ fontSize: '0.86rem', fontWeight: 800, lineHeight: 1.2 }}>
                    {photo.title}
                  </div>
                  <div style={{ fontSize: '0.74rem', opacity: 0.85, marginTop: '3px' }}>
                    {photo.subtitle}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 2: NATIONAL DATA & CAPACITY METRICS (NO CARDS - STAT BAR)         */}
      {/* ========================================================================= */}
      <section style={{ 
        background: '#f8fafc', 
        borderTop: '1px solid #e2e8f0', 
        borderBottom: '1px solid #e2e8f0',
        padding: '48px 5%',
        zIndex: 5
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '28px 16px' : '0'
        }}>
          
          {/* Metric 1 */}
          <div style={{ 
            padding: isMobile ? '0' : '0 32px',
            borderRight: isMobile ? 'none' : '1px solid #cbd5e1',
            textAlign: isMobile ? 'center' : 'left'
          }}>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#d90429', lineHeight: 1, letterSpacing: '-1px' }}>
              50+
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '6px' }}>
              Regional Blood Banks
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Operating across all regions & city administrations
            </div>
          </div>

          {/* Metric 2 */}
          <div style={{ 
            padding: isMobile ? '0' : '0 32px',
            borderRight: isMobile ? 'none' : '1px solid #cbd5e1',
            textAlign: isMobile ? 'center' : 'left'
          }}>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '-1px' }}>
              100%
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '6px' }}>
              Voluntary Donations
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Non-remunerated certified blood donors
            </div>
          </div>

          {/* Metric 3 */}
          <div style={{ 
            padding: isMobile ? '0' : '0 32px',
            borderRight: isMobile ? 'none' : '1px solid #cbd5e1',
            textAlign: isMobile ? 'center' : 'left'
          }}>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#0f172a', lineHeight: 1, letterSpacing: '-1px' }}>
              350K+
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '6px' }}>
              Screened Bags Annually
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              Gold-standard serology & viral screening
            </div>
          </div>

          {/* Metric 4 */}
          <div style={{ 
            padding: isMobile ? '0' : '0 32px',
            textAlign: isMobile ? 'center' : 'left'
          }}>
            <div style={{ fontSize: '2.6rem', fontWeight: 900, color: '#d90429', lineHeight: 1, letterSpacing: '-1px' }}>
              8040
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.6px', marginTop: '6px' }}>
              Toll-Free Hotline
            </div>
            <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '4px' }}>
              24/7 emergency dispatch & donor inquiries
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 3: ABOUT BBH & NATIONAL MANDATE (SPLIT EDITORIAL - NO CARDS)      */}
      {/* ========================================================================= */}
      <section id="about" style={{ 
        padding: '90px 5%',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        zIndex: 5
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1.1fr 1fr', 
          gap: isMobile ? '40px' : '60px',
          alignItems: 'center'
        }}>
          
          {/* Left Column: Heading, Mandate, Vision & Mission */}
          <div>
            <div style={{ color: '#d90429', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '12px' }}>
              OFFICIAL NATIONAL SERVICE • BBH
            </div>
            <h2 style={{ fontSize: isMobile ? '1.85rem' : '2.4rem', fontWeight: 900, letterSpacing: '-0.8px', lineHeight: 1.2, color: '#0f172a', marginBottom: '20px' }}>
              Ensuring Safe, Adequate, and Timely Blood for All Ethiopians.
            </h2>
            <p style={{ fontSize: '0.98rem', lineHeight: 1.7, color: '#475569', marginBottom: '18px' }}>
              The <strong>Blood Bank Hub (BBH)</strong> is the specialized national digital blood banking network coordinating collection stations, screening laboratories, and hospital blood banks across the country.
            </p>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.7, color: '#64748b', marginBottom: '26px' }}>
              Through automated FAYDA biometric validation, strict 90-day recovery intervals, multi-marker viral screening, and continuous cold-chain management, BBH guarantees that life-saving blood components reach maternal, surgical, and trauma patients in their moments of greatest need.
            </p>

            {/* Vision & Mission Horizontal Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px', paddingTop: '20px', borderTop: '1px solid #e2e8f0' }}>
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d90429', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                  OUR VISION
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  African Center of Excellence
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                  To sustainably avail safe blood and tissue products to all recipients, becoming a leading benchmark in Africa.
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#d90429', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '4px' }}>
                  OUR MISSION
                </div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f172a', marginBottom: '4px' }}>
                  Uninterrupted Healthcare Supply
                </div>
                <div style={{ fontSize: '0.82rem', color: '#64748b', lineHeight: 1.5 }}>
                  Ensure equitable availability of tested blood and components across all public and private hospitals in Ethiopia.
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Key Operational Principles */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px', borderLeft: isMobile ? 'none' : '2px solid #f1f5f9', paddingLeft: isMobile ? '0' : '40px' }}>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
              Core Institutional Commitments:
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#d90429" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>100% Voluntary Non-Remunerated:</strong> All blood collections are sourced from altruistic, unpaid community donors to maximize viral safety.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#d90429" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>FAYDA Biometric Identity Integration:</strong> Donor profiles link directly with the National ID system, enforcing strict 90-day recovery intervals.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#d90429" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>Continuous Cold-Chain Compliance:</strong> Automated temperature loggers preserve blood integrity between 2°C and 6°C across all distribution fleets.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#d90429" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>Immediate Bilingual Donor Feedback:</strong> Donors receive instant Amharic & English confirmation SMS regarding their donation and lab results.
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 4: BBH SERVICES PIPELINE (EDITORIAL NUMBERED ROWS - NO CARDS)     */}
      {/* ========================================================================= */}
      <section id="pipeline" style={{ 
        background: '#f8fafc', 
        borderTop: '1px solid #e2e8f0', 
        borderBottom: '1px solid #e2e8f0', 
        padding: '90px 5%',
        zIndex: 5
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          
          <div style={{ marginBottom: '50px' }}>
            <div style={{ color: '#d90429', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
              OPERATIONAL WORKFLOW & SERVICES
            </div>
            <h2 style={{ fontSize: isMobile ? '1.85rem' : '2.3rem', fontWeight: 900, letterSpacing: '-0.7px', color: '#0f172a', margin: 0 }}>
              The 5 Pillars of National Blood Safety
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.98rem', marginTop: '8px', maxWidth: '700px' }}>
              Standard operating procedures maintained by BBH to ensure complete clinical safety from voluntary donation to hospital infusion.
            </p>
          </div>

          {/* Step 1 */}
          <div className="bbh-row" style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '80px 1.2fr 1.5fr', 
            gap: isMobile ? '10px' : '30px', 
            padding: '28px 0', 
            borderTop: '1px solid #cbd5e1',
            alignItems: 'start'
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#d90429', fontFamily: 'monospace' }}>
              01
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                Voluntary Donor Mobilization & FAYDA Intake
              </h3>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Community Education • Mobile Phlebotomy • Biometric Verification
              </span>
            </div>
            <div>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: '#475569', margin: 0 }}>
                Coordinating high-capacity collection stations in universities, public squares, and mobile vans. FAYDA National ID integration verifies donor eligibility and enforces the mandatory 90-day recovery deferral.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bbh-row" style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '80px 1.2fr 1.5fr', 
            gap: isMobile ? '10px' : '30px', 
            padding: '28px 0', 
            borderTop: '1px solid #cbd5e1',
            alignItems: 'start'
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#d90429', fontFamily: 'monospace' }}>
              02
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                Laboratory Testing & Infection Screening
              </h3>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ABO & Rh Grouping • HIV 1/2 • Hepatitis B • Hepatitis C • Syphilis • Malaria
              </span>
            </div>
            <div>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: '#475569', margin: 0 }}>
                Every single collected blood unit undergoes rigorous, automated multi-marker serological testing in specialized BBH laboratories. Confirmatory protocols isolate any reactive units to prevent contaminated blood transfusions.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bbh-row" style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '80px 1.2fr 1.5fr', 
            gap: isMobile ? '10px' : '30px', 
            padding: '28px 0', 
            borderTop: '1px solid #cbd5e1',
            alignItems: 'start'
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#d90429', fontFamily: 'monospace' }}>
              03
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                Component Separation & Processing
              </h3>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Packed Red Blood Cells (PRBC) • Fresh Frozen Plasma (FFP) • Platelets • Cryoprecipitate
              </span>
            </div>
            <div>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: '#475569', margin: 0 }}>
                Whole blood is centrifugally separated into specialized therapeutic components so that one voluntary donation can treat up to three distinct patients — including burn victims, cancer patients, and trauma cases.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bbh-row" style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '80px 1.2fr 1.5fr', 
            gap: isMobile ? '10px' : '30px', 
            padding: '28px 0', 
            borderTop: '1px solid #cbd5e1',
            alignItems: 'start'
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#d90429', fontFamily: 'monospace' }}>
              04
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                Cold-Chain Storage & 35-Day Shelf Life Tracking
              </h3>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                2°C – 6°C Red Cell Refrigeration • -30°C Plasma Freezing • Real-Time Warehouse Stock
              </span>
            </div>
            <div>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: '#475569', margin: 0 }}>
                Validated units are received into central warehouse cold rooms with continuous digital temperature loggers. Automated expiry warnings alert managers well ahead of the 35-day whole blood lifespan.
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="bbh-row" style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '80px 1.2fr 1.5fr', 
            gap: isMobile ? '10px' : '30px', 
            padding: '28px 0', 
            borderTop: '1px solid #cbd5e1',
            borderBottom: '1px solid #cbd5e1',
            alignItems: 'start'
          }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#d90429', fontFamily: 'monospace' }}>
              05
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 6px 0' }}>
                Hospital Requisitions & 24/7 Emergency Dispatch
              </h3>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Hospital-to-Hospital Requisitions • Dedicated Cold Fleet • Rapid Delivery
              </span>
            </div>
            <div>
              <p style={{ fontSize: '0.92rem', lineHeight: 1.6, color: '#475569', margin: 0 }}>
                Partner hospitals submit electronic requisition orders via the BBH portal or request emergency stock peer-to-peer from neighboring medical centers, with dispatches expedited by dedicated cold-box transport.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 5: DONATION ELIGIBILITY & REQUIREMENTS (EDITORIAL 2-COLUMN)       */}
      {/* ========================================================================= */}
      <section id="eligibility" style={{ 
        padding: '90px 5%',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        zIndex: 5
      }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{ color: '#d90429', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
            DONOR ELIGIBILITY CRITERIA
          </div>
          <h2 style={{ fontSize: isMobile ? '1.85rem' : '2.3rem', fontWeight: 900, letterSpacing: '-0.7px', color: '#0f172a', margin: 0 }}>
            Can You Donate Blood Today?
          </h2>
          <p style={{ color: '#64748b', fontSize: '0.98rem', marginTop: '8px' }}>
            Standard clinical prerequisites mandated by BBH for the safety of both donor and recipient.
          </p>
        </div>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
          gap: isMobile ? '30px' : '60px' 
        }}>
          
          {/* Left Column: Basic Eligibility Requirements */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
              General Prerequisites:
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#d90429" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>Age Limit:</strong> Must be between <strong>18 and 65 years old</strong>.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#d90429" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>Body Weight:</strong> Minimum <strong>45 kg (99 lbs)</strong> or above.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#d90429" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>Recovery Interval:</strong> At least <strong>90 days (3 months)</strong> since your last whole blood donation.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#d90429" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>Hemoglobin Level:</strong> Minimum <strong>12.5 g/dL</strong> (screened for free on-site before donation).
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <CheckCircle2 size={18} color="#d90429" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>Identity:</strong> Valid <strong>FAYDA National ID</strong>, student ID, or government credential.
              </div>
            </div>
          </div>

          {/* Right Column: Pre-Donation Tips */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', borderLeft: isMobile ? 'none' : '2px solid #e2e8f0', paddingLeft: isMobile ? '0' : '40px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
              Tips for Donation Day:
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Droplet size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>Hydrate Well:</strong> Drink plenty of water (at least 2-3 glasses) before your donation appointment.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Check size={18} color="#059669" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>Eat a Healthy Meal:</strong> Have a wholesome breakfast or lunch; avoid donating on an empty stomach.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Clock size={18} color="#8338ec" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>Brief Rest:</strong> Relax for 10-15 minutes in the refreshment lounge after donation with provided juice and snacks.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <ShieldCheck size={18} color="#d90429" style={{ flexShrink: 0, marginTop: '3px' }} />
              <div>
                <strong>Instant SMS:</strong> Receive an automated bilingual confirmation message and laboratory screening confirmation directly on your phone.
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 6: REGIONAL BLOOD BANK NETWORK DIRECTORY (MULTI-COLUMN LIST)      */}
      {/* ========================================================================= */}
      <section id="network" style={{ 
        background: '#f8fafc',
        borderTop: '1px solid #e2e8f0',
        padding: '90px 5%',
        maxWidth: '100%',
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box',
        zIndex: 5
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ marginBottom: '40px' }}>
            <div style={{ color: '#d90429', fontWeight: 800, fontSize: '0.8rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
              NATIONAL FOOTPRINT
            </div>
            <h2 style={{ fontSize: isMobile ? '1.85rem' : '2.3rem', fontWeight: 900, letterSpacing: '-0.7px', color: '#0f172a', margin: 0 }}>
              BBH Regional Blood Bank Centers
            </h2>
            <p style={{ color: '#64748b', fontSize: '0.98rem', marginTop: '8px' }}>
              Over 50 certified collection and distribution facilities coordinating daily blood supplies across Ethiopia.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)', 
            gap: '30px',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '30px'
          }}>
            
            {/* Central & Addis Ababa */}
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px', borderBottom: '2px solid #d90429', paddingBottom: '6px' }}>
                Addis Ababa & Central
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.86rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>• BBH National HQ (Lideta)</li>
                <li>• Meskel Square Mobile Station</li>
                <li>• Tikur Anbessa Specialized Hub</li>
                <li>• St. Paul's Hospital Hub</li>
                <li>• Yekatit 12 Hospital Blood Unit</li>
              </ul>
            </div>

            {/* Oromia & South */}
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px', borderBottom: '2px solid #d90429', paddingBottom: '6px' }}>
                Oromia & Sidama
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.86rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>• Adama Regional Blood Bank</li>
                <li>• Hawassa Comprehensive Hub</li>
                <li>• Jimma University Medical Hub</li>
                <li>• Nekemte Regional Station</li>
                <li>• Shashemene Blood Center</li>
              </ul>
            </div>

            {/* Amhara & Tigray */}
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px', borderBottom: '2px solid #d90429', paddingBottom: '6px' }}>
                Amhara & Tigray
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.86rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>• Bahir Dar Regional Blood Bank</li>
                <li>• Gondar University Hub</li>
                <li>• Dessie Regional Blood Center</li>
                <li>• Mekelle Ayder Referral Hub</li>
                <li>• Debre Birhan Station</li>
              </ul>
            </div>

            {/* Eastern & Western */}
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0f172a', marginBottom: '12px', borderBottom: '2px solid #d90429', paddingBottom: '6px' }}>
                Eastern & South-West
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '0.86rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>• Dire Dawa Regional Blood Bank</li>
                <li>• Harar Jugal Hospital Hub</li>
                <li>• Jigjiga Karamara Referral Hub</li>
                <li>• Arba Minch General Hub</li>
                <li>• Wolaita Sodo Blood Bank</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 7: 24/7 EMERGENCY DISPATCH CALLOUT (FULL WIDTH - NO CARDS)        */}
      {/* ========================================================================= */}
      <section style={{ 
        background: 'linear-gradient(135deg, #d90429 0%, #9e0012 100%)', 
        color: '#ffffff', 
        padding: '70px 5%',
        textAlign: 'center',
        zIndex: 5
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.15)', padding: '6px 16px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800, marginBottom: '20px' }}>
            <AlertCircle size={16} /> NATIONAL BLOOD TRANSFUSION DISPATCH
          </div>
          <h2 style={{ fontSize: isMobile ? '2rem' : '2.8rem', fontWeight: 900, letterSpacing: '-1px', margin: '0 0 16px 0', lineHeight: 1.15 }}>
            Urgent Clinical Requisition? Call Toll-Free: 8040
          </h2>
          <p style={{ fontSize: '1.05rem', lineHeight: 1.6, opacity: 0.9, marginBottom: '32px' }}>
            Hospital clinicians and trauma centers can broadcast emergency cross-match requests or access real-time central warehouse stock via the national workstation portal.
          </p>
          <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button 
              onClick={onNavigateToLogin}
              style={{ 
                background: '#ffffff', 
                color: '#d90429', 
                border: 'none', 
                fontWeight: 800, 
                fontSize: '0.98rem', 
                padding: '14px 30px', 
                borderRadius: '8px', 
                cursor: 'pointer',
                boxShadow: '0 8px 20px rgba(0,0,0,0.2)'
              }}
            >
              Hospital Workstation Sign In
            </button>
            <button 
              onClick={onNavigateToRegister}
              style={{ 
                background: 'rgba(0,0,0,0.25)', 
                color: '#ffffff', 
                border: '1px solid rgba(255,255,255,0.4)', 
                fontWeight: 700, 
                fontSize: '0.98rem', 
                padding: '14px 30px', 
                borderRadius: '8px', 
                cursor: 'pointer' 
              }}
            >
              Register as Voluntary Donor
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* SECTION 8: OFFICIAL BBH FOOTER                                            */}
      {/* ========================================================================= */}
      <footer style={{ 
        background: '#0a0f1d', 
        color: '#94a3b8', 
        padding: '70px 5% 30px 5%', 
        borderTop: '1px solid #1e293b',
        fontSize: '0.86rem',
        zIndex: 5
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1fr 1fr 1.2fr', 
          gap: '40px',
          marginBottom: '50px'
        }}>
          
          {/* Col 1: Government Affiliation & Mandate */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
              <Heart size={22} color="#d90429" fill="#d90429" />
              <span style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.3px' }}>
                Blood Bank Hub (BBH)
              </span>
            </div>
            <p style={{ lineHeight: 1.65, fontSize: '0.84rem', color: '#94a3b8', margin: '0 0 16px 0' }}>
              Federal Democratic Republic of Ethiopia • Ministry of Health • Blood Bank Hub (BBH).
            </p>
            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
              Toll-Free Emergency Hotline: <strong style={{ color: '#ef233c' }}>8040 / 907</strong>
            </div>
          </div>

          {/* Col 2: Workstation Portals */}
          <div>
            <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
              Actors & Portals
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
              <span style={{ cursor: 'pointer', color: '#cbd5e1' }} onClick={onNavigateToRegister}>Donor Registration</span>
              <span style={{ cursor: 'pointer', color: '#cbd5e1' }} onClick={onNavigateToLogin}>Collection Station</span>
              <span style={{ cursor: 'pointer', color: '#cbd5e1' }} onClick={onNavigateToLogin}>Testing Laboratory</span>
              <span style={{ cursor: 'pointer', color: '#cbd5e1' }} onClick={onNavigateToLogin}>Central Warehouse</span>
              <span style={{ cursor: 'pointer', color: '#cbd5e1' }} onClick={onNavigateToLogin}>Hospital Transfusion Portal</span>
            </div>
          </div>

          {/* Col 3: Quality Standards */}
          <div>
            <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
              Clinical Quality
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.84rem' }}>
              <span>90-Day Deferral Synchronization</span>
              <span>FAYDA Biometric Validation</span>
              <span>WHO Blood Safety Standards</span>
              <span>Cold Chain Validation (2°C-6°C)</span>
              <span>Bilingual Donor Notification</span>
            </div>
          </div>

          {/* Col 4: Official Headquarters */}
          <div>
            <div style={{ color: '#ffffff', fontWeight: 800, fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
              Headquarters
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.84rem', color: '#94a3b8' }}>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <MapPin size={16} color="#d90429" style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>Lideta Sub-City, Near Ministry of Health, Addis Ababa, Ethiopia</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Phone size={15} color="#d90429" style={{ flexShrink: 0 }} />
                <span>Toll-Free: 8040 | Tel: +251-115-51-42-45</span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Globe size={15} color="#d90429" style={{ flexShrink: 0 }} />
                <span>info@bloodbankhub.et | bloodbankhub.et</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Hairline & Copyright */}
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          paddingTop: '24px', 
          borderTop: '1px solid #1e293b', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          fontSize: '0.78rem',
          color: '#64748b'
        }}>
          <div>
            &copy; {new Date().getFullYear()} Blood Bank Hub (BBH) • National Blood Services Network. All rights reserved.
          </div>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span>Privacy Policy</span>
            <span>Clinical Protocols</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
