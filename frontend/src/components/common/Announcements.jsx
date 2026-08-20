
import React from 'react';
import { Megaphone, Calendar, MapPin, Sparkles } from 'lucide-react';

export default function Announcements({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '30px' }}>
        <Megaphone size={36} color="var(--text-muted)" style={{ marginBottom: '12px', opacity: 0.5 }} />
        <p style={{ color: 'var(--text-secondary)' }}>No announcements from Blood Bank Inventory at the moment.</p>
      </div>
    );
  }

  const formatAnnouncementDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
        <Megaphone size={22} color="var(--primary)" />
        <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Latest Campaigns & Station Postings</h3>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
        {data.map((ann, idx) => (
          <div key={ann.id || idx} className="glass-card" style={{
            position: 'relative',
            borderLeft: ann.type === 'campaign' ? '4px solid var(--primary)' : '4px solid #3a86ff',
            padding: '20px',
            overflow: 'hidden'
          }}>
            {/* Subtle glow for campaign types */}
            {ann.type === 'campaign' && (
              <div style={{
                position: 'absolute', top: 0, right: 0,
                background: 'rgba(239, 35, 60, 0.05)',
                padding: '4px 12px', borderRadius: '0 0 0 12px',
                fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', gap: '4px'
              }}>
                <Sparkles size={10} /> Active Campaign
              </div>
            )}
            
            {ann.type !== 'campaign' && (
              <div style={{
                position: 'absolute', top: 0, right: 0,
                background: 'rgba(58, 134, 255, 0.08)',
                padding: '4px 12px', borderRadius: '0 0 0 12px',
                fontSize: '0.75rem', fontWeight: 'bold', color: '#3a86ff'
              }}>
                Temporary Station
              </div>
            )}

            <h4 style={{ fontSize: '1.1rem', marginTop: 0, marginBottom: '8px', paddingRight: '110px' }}>
              {ann.title}
            </h4>
            
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: '1.5' }}>
              {ann.content}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              {ann.station_location && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={14} color="var(--primary)" />
                  <span style={{ fontWeight: 500, color: 'var(--text-main)' }}>{ann.station_location}</span>
                </div>
              )}

              {ann.start_date && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Calendar size={14} />
                  <span>
                    Duration: <strong>{formatAnnouncementDate(ann.start_date)}</strong>
                    {ann.end_date && <> to <strong>{formatAnnouncementDate(ann.end_date)}</strong></>}
                  </span>
                </div>
              )}
            </div>

            <div style={{ 
              marginTop: '12px', 
              fontSize: '0.75rem', 
              color: 'var(--text-muted)', 
              textAlign: 'right', 
              borderTop: '1px solid rgba(255,255,255,0.05)',
              paddingTop: '8px'
            }}>
              Published by: {ann.publisher}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
