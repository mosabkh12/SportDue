const StatCard = ({ label, value, accent }) => (
  <div
    className="card stat-card"
    style={{
      '--stat-accent': accent || 'var(--primary)',
    }}
  >
    <span className="stat-card__chip" style={{ background: accent || 'var(--primary)' }} />
    <p className="stat-card__label">{label}</p>
    <p className="stat-card__value">{value}</p>
  </div>
);

export default StatCard;

