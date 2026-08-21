import React from 'react';
import { BarChart3, PieChart, AlertCircle } from 'lucide-react';

export default function Analytics({ hospitalRequests = [], stationCollections = [] }) {
  const hasRequests = hospitalRequests && hospitalRequests.length > 0;
  const hasCollections = stationCollections && stationCollections.length > 0;

  // Render Custom SVG Bar Chart for Hospital Requests
  const renderBarChart = () => {
    if (!hasRequests) {
      return (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
          No hospital requests data recorded yet.
        </div>
      );
    }

    const paddingLeft = 140;
    const paddingRight = 40;
    const paddingTop = 20;
    const paddingBottom = 20;
    const chartWidth = 480;
    const drawWidth = chartWidth - paddingLeft - paddingRight;

    // Find max value for scaling
    const maxVal = Math.max(...hospitalRequests.map(h => h.total_units), 5);

    // Dynamic Row layout calculations to prevent overlapping with high item counts
    const rowHeight = 36; 
    const chartHeight = paddingTop + paddingBottom + (hospitalRequests.length * rowHeight);

    return (
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} width="100%" height={chartHeight} style={{ overflow: 'visible' }}>
        {/* Y Axis Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const xPos = paddingLeft + drawWidth * ratio;
          const gridVal = Math.round(maxVal * ratio);
          return (
            <g key={idx}>
              <line 
                x1={xPos} y1={paddingTop - 5} 
                x2={xPos} y2={chartHeight - paddingBottom} 
                stroke="rgba(255,255,255,0.05)" 
                strokeDasharray="4,4" 
              />
              <text 
                x={xPos} y={chartHeight - paddingBottom + 14} 
                fill="var(--text-muted)" fontSize="9" textAnchor="middle" fontWeight="bold"
              >
                {gridVal}
              </text>
            </g>
          );
        })}

        {/* Render Bars */}
        {hospitalRequests.map((item, idx) => {
          const yPos = paddingTop + idx * rowHeight + (rowHeight - 16) / 2;
          const barWidth = (item.total_units / maxVal) * drawWidth;

          return (
            <g key={idx} className="chart-bar-group">
              {/* Hospital Name Label */}
              <text 
                x={paddingLeft - 10} y={yPos + 12} 
                fill="var(--text-secondary)" fontSize="10" fontWeight="600" textAnchor="end"
              >
                {item.hospital_name.length > 20 ? item.hospital_name.substring(0, 18) + '..' : item.hospital_name}
              </text>
              {/* Background trace bar */}
              <rect 
                x={paddingLeft} y={yPos} 
                width={drawWidth} height="16" 
                rx="4" fill="rgba(255,255,255,0.02)"
              />
              {/* Colored foreground bar */}
              <rect 
                x={paddingLeft} y={yPos} 
                width={barWidth || 2} height="16" 
                rx="4" fill="url(#crimsonGradient)" 
                style={{ transition: 'width 0.8s ease' }}
              />
              {/* Values label */}
              <text 
                x={paddingLeft + barWidth + 8} y={yPos + 12} 
                fill="var(--primary)" fontSize="10" fontWeight="bold"
              >
                {item.total_units} U
              </text>
            </g>
          );
        })}

        {/* Gradients */}
        <defs>
          <linearGradient id="crimsonGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#ef233c" />
            <stop offset="100%" stopColor="#d90429" />
          </linearGradient>
        </defs>
      </svg>
    );
  };

  // Render Custom SVG Donut/Pie Chart for Station Collections
  const renderDonutChart = () => {
    if (!hasCollections) {
      return (
        <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-secondary)' }}>
          No donation station collection logs recorded.
        </div>
      );
    }

    const totalSamples = stationCollections.reduce((sum, s) => sum + s.total_samples, 0);

    const size = 200;
    const r = 70;
    const cx = size / 2;
    const cy = size / 2;
    const circumference = 2 * Math.PI * r;

    // Categorized colors
    const colors = ['#ef233c', '#3a86ff', '#ffb703', '#8338ec', '#06d6a0', '#ff006e'];

    let accumulatedPercentage = 0;

    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: '30px' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="20" />
          
          {stationCollections.map((item, idx) => {
            const percent = item.total_samples / totalSamples;
            const strokeLength = percent * circumference;
            const strokeOffset = -accumulatedPercentage * circumference;
            accumulatedPercentage += percent;
            
            const color = colors[idx % colors.length];

            return (
              <circle
                key={idx}
                cx={cx}
                cy={cy}
                r={r}
                fill="none"
                stroke={color}
                strokeWidth="20"
                strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                strokeDashoffset={strokeOffset}
                transform={`rotate(-90 ${cx} ${cy})`}
                style={{
                  transition: 'stroke-dasharray 0.5s ease, stroke-dashoffset 0.5s ease',
                  cursor: 'pointer'
                }}
                title={`${item.station_name}: ${item.total_samples} bags`}
              />
            );
          })}

          {/* Center text */}
          <g>
            <text x={cx} y={cy - 4} fill="var(--text-primary)" fontSize="18" fontWeight="800" textAnchor="middle">
              {totalSamples}
            </text>
            <text x={cx} y={cy + 12} fill="var(--text-muted)" fontSize="8" fontWeight="bold" letterSpacing="1" textAnchor="middle">
              TOTAL BAGS
            </text>
          </g>
        </svg>

        {/* Legend */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '160px' }}>
          {stationCollections.map((item, idx) => {
            const percent = Math.round((item.total_samples / totalSamples) * 100);
            const color = colors[idx % colors.length];

            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem' }}>
                <span style={{ display: 'inline-block', width: '12px', height: '12px', borderRadius: '3px', background: color }} />
                <span style={{ fontWeight: 600, color: 'var(--text-secondary)', flex: 1 }}>
                  {item.station_name.split(' ').pop()}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  ({percent}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px' }}>
      
      {/* Hospital requests analytics */}
      <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <BarChart3 size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Hospital Request Load</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '20px' }}>
            Shows the total blood bags requested by each hospital. Highlights areas in critical need.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '220px' }}>
          {renderBarChart()}
        </div>
      </div>

      {/* Station collections analytics */}
      <div className="glass-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <PieChart size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Station Collection Share</h3>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginBottom: '20px' }}>
            Illustrates the distribution of collections across donation stations to help assess drive performance.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '220px' }}>
          {renderDonutChart()}
        </div>
      </div>

    </div>
  );
}
