
import React from 'react';
import { Award, Heart } from 'lucide-react';

export default function Leaderboard({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '30px' }}>
        <p style={{ color: 'var(--text-secondary)' }}>No leaderboard rankings available yet.</p>
      </div>
    );
  }

  const getRankBadge = (rank) => {
    switch (rank) {
      case 1:
        return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#FFD700', color: '#000', borderRadius: '50%', width: '24px', height: '24px', fontWeight: 'bold', fontSize: '0.85rem' }} title="Gold Winner">1</span>;
      case 2:
        return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#C0C0C0', color: '#000', borderRadius: '50%', width: '24px', height: '24px', fontWeight: 'bold', fontSize: '0.85rem' }} title="Silver Winner">2</span>;
      case 3:
        return <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#CD7F32', color: '#FFF', borderRadius: '50%', width: '24px', height: '24px', fontWeight: 'bold', fontSize: '0.85rem' }} title="Bronze Winner">3</span>;
      default:
        return <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{rank}</span>;
    }
  };

  return (
    <div className="glass-card animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Award size={24} color="var(--primary)" />
          <h3 style={{ fontSize: '1.2rem', margin: 0 }}>Top Donors Leaderboard</h3>
        </div>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(239,35,60,0.1)', padding: '4px 10px', borderRadius: '20px', fontWeight: 600, border: '1px solid rgba(239,35,60,0.2)' }}>
          Top 10 Donors
        </span>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '60px', textAlign: 'center' }}>Rank</th>
              <th>Donor Name</th>
              <th style={{ textAlign: 'center' }}>Blood Type</th>
              <th style={{ textAlign: 'center' }}>Donations</th>
              <th style={{ textAlign: 'right' }}>Points</th>
            </tr>
          </thead>
          <tbody>
            {data.map((donor, idx) => (
              <tr key={idx} style={{ 
                background: idx < 3 ? 'rgba(239, 35, 60, 0.03)' : 'transparent',
                transition: 'all 0.2s ease'
              }}>
                <td style={{ textAlign: 'center', fontWeight: 'bold' }}>
                  {getRankBadge(idx + 1)}
                </td>
                <td style={{ fontWeight: idx < 3 ? 600 : 500 }}>
                  {donor.name}
                  {idx === 0 && <span style={{ marginLeft: '8px', fontSize: '0.75rem', background: 'gold', color: '#000', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>Hero</span>}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <span className="badge-blood-type">{donor.blood_type}</span>
                </td>
                <td style={{ textAlign: 'center', fontWeight: 600 }}>{donor.total_donations}</td>
                <td style={{ textAlign: 'right', fontWeight: 'bold', color: 'var(--primary)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Heart size={12} fill="var(--primary)" style={{ strokeWidth: 0 }} />
                    {donor.points} pts
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
