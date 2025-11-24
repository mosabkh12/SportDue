const StatCard = ({ label, value, accent }) => {
  // Handle undefined, null, or NaN values - always show a number
  const displayValue = value !== undefined && value !== null && !isNaN(value) ? value : 0;
  
  return (
    <div
      className="card stat-card"
      style={{
        '--stat-accent': accent || 'var(--primary)',
      }}
    >
      <span className="stat-card__chip" style={{ background: accent || 'var(--primary)' }} />
      <p className="stat-card__label">{label}</p>
      <p className="stat-card__value" style={{ color: accent || 'var(--primary)' }}>
        {displayValue}
      </p>
    </div>
  );
};

export default StatCard;

