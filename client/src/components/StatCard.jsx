const StatCard = ({ label, value, accent, format }) => {
  // Handle undefined, null, or NaN values - always show a number
  const numValue = typeof value === 'string' && value.startsWith('$') 
    ? parseFloat(value.replace('$', '')) 
    : parseFloat(value);
  
  const displayValue = !isNaN(numValue) && numValue !== null && numValue !== undefined 
    ? numValue 
    : 0;
  
  // Format the display value
  let formattedValue = displayValue;
  if (format === 'currency') {
    formattedValue = `$${displayValue.toFixed(2)}`;
  } else if (format === 'percentage') {
    formattedValue = `${displayValue}%`;
  } else {
    formattedValue = displayValue;
  }
  
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
        {formattedValue}
      </p>
    </div>
  );
};

export default StatCard;

