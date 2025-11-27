import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import useAuth from '../hooks/useAuth';
import StatCard from '../components/StatCard.jsx';
import '../styles/pages/PlayerDashboard.css';

const PlayerDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [player, setPlayer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [playerRes, paymentRes, attendanceRes] = await Promise.all([
        apiClient.get('/player/me'),
        apiClient.get('/player/me/payments'),
        apiClient.get('/player/me/attendance'),
      ]);
      setPlayer(playerRes.data);
      setPayments(paymentRes.data || []);
      setAttendance(attendanceRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  // Calculate payment summary - ensure we're using numbers
  const paymentSummary = payments.reduce(
    (acc, payment) => {
      const amountDue = parseFloat(payment.amountDue || 0);
      const amountPaid = parseFloat(payment.amountPaid || 0);
      acc.totalDue += isNaN(amountDue) ? 0 : amountDue;
      acc.totalPaid += isNaN(amountPaid) ? 0 : amountPaid;
      return acc;
    },
    { totalDue: 0, totalPaid: 0 }
  );

  // Calculate outstanding balance
  // If there are payments, use payment-based calculation
  // Otherwise, if player has monthlyFee, outstanding balance could be that
  const outstandingBalance = paymentSummary.totalDue > 0 
    ? paymentSummary.totalDue - paymentSummary.totalPaid
    : 0;

  // Calculate attendance summary
  const attendanceSummary = attendance.reduce(
    (acc, record) => {
      if (record.isPresent) acc.present++;
      else acc.absent++;
      acc.total++;
      return acc;
    },
    { present: 0, absent: 0, total: 0 }
  );

  const attendanceRate =
    attendanceSummary.total > 0
      ? Math.round((attendanceSummary.present / attendanceSummary.total) * 100)
      : 0;

  return (
    <div className="page">
      <section className="page-header">
        <div>
          
          <p className="eyebrow">Player portal</p>
          <h2>Welcome, {player?.fullName || user?.fullName || 'Player'}</h2>
          <p className="text-muted">View your payment history and attendance records.</p>
          {player?.group && (
            <div className="badge-container">
              <div className="group-badge">
                <span>👥</span>
                <span>{player.group.name}</span>
              </div>
              {player.group.sportType && (
                <div className={`sport-badge sport-badge--${player.group.sportType}`}>
                  <span>{player.group.sportType === 'basketball' ? '🏀' : '⚽'}</span>
                  <span>{player.group.sportType}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {loading && !player && <p className="text-muted">Loading...</p>}
      {error && !player && <p className="error-text">{error}</p>}

      {player && (
        <>
          <section className="grid stats-grid">
            <StatCard 
              label="Monthly Fee" 
              value={parseFloat(player.monthlyFee || 0)} 
              format="currency"
            />
            <StatCard
              label="Total Paid"
              value={paymentSummary.totalPaid}
              accent="#10b981"
              format="currency"
            />
            <StatCard
              label="Outstanding Balance"
              value={outstandingBalance}
              accent={outstandingBalance > 0 ? '#ef4444' : '#10b981'}
              format="currency"
            />
            {attendanceSummary.total > 0 && (
              <StatCard
                label="Attendance Rate"
                value={attendanceRate}
                accent="#6366f1"
                format="percentage"
              />
            )}
          </section>

          <section className="card">
            <h3>Contact Information</h3>
            <div className="contact-grid">
              <p className="text-muted contact-item">
                <strong className="contact-label">Phone:</strong>
                {player.phone}
              </p>
              {player?.group && (
                <p className="text-muted contact-item">
                  <strong className="contact-label">Group:</strong>
                  {player.group.name}
                  {player.group.sportType && (
                    <span className={`contact-inline-badge contact-inline-badge--${player.group.sportType}`}>
                      {player.group.sportType === 'basketball' ? '🏀' : '⚽'} {player.group.sportType.charAt(0).toUpperCase() + player.group.sportType.slice(1)}
                    </span>
                  )}
                </p>
              )}
              {player.notes && (
                <div className="notes-section">
                  <p className="text-muted">
                    <strong className="contact-label">Notes:</strong>
                  </p>
                  <p className="notes-text">{player.notes}</p>
                </div>
              )}
            </div>
          </section>

          <section className="card">
            <div className="card__header">
              <h3>Payment History</h3>
              {loading && <span className="text-muted">Loading...</span>}
            </div>
            {error && <p className="error-text">{error}</p>}
            {!payments.length && !loading ? (
              <p className="text-muted">No payment records yet.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Month</th>
                    <th>Amount Due</th>
                    <th>Amount Paid</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((payment) => (
                    <tr key={payment._id}>
                      <td>{payment.month}</td>
                      <td>${parseFloat(payment.amountDue || 0).toFixed(2)}</td>
                      <td>${parseFloat(payment.amountPaid || 0).toFixed(2)}</td>
                      <td>
                        <span className={`payment-status-badge payment-status-badge--${payment.status}`}>
                          {payment.status === 'paid'
                            ? '✓ Paid'
                            : payment.status === 'partial'
                            ? '○ Partial'
                            : '✗ Unpaid'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="card">
            <div className="card__header">
              <h3>Attendance History</h3>
              {loading && <span className="text-muted">Loading...</span>}
            </div>
            {error && <p className="error-text">{error}</p>}
            {!attendance.length && !loading ? (
              <p className="text-muted">No attendance records yet.</p>
            ) : (
              <>
                <div className="attendance-stats-grid">
                  <div className="card stat-card" style={{ borderTopColor: '#10b981', padding: '1rem' }}>
                    <p className="stat-card__label">Present days</p>
                    <p className="stat-card__value" style={{ color: '#10b981', fontSize: '1.5rem' }}>
                      {attendanceSummary.present}
                    </p>
                  </div>
                  <div className="card stat-card" style={{ borderTopColor: '#ef4444', padding: '1rem' }}>
                    <p className="stat-card__label">Absent days</p>
                    <p className="stat-card__value" style={{ color: '#ef4444', fontSize: '1.5rem' }}>
                      {attendanceSummary.absent}
                    </p>
                  </div>
                  <div className="card stat-card" style={{ borderTopColor: '#6366f1', padding: '1rem' }}>
                    <p className="stat-card__label">Total records</p>
                    <p className="stat-card__value" style={{ fontSize: '1.5rem' }}>
                      {attendanceSummary.total}
                    </p>
                  </div>
                </div>
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {attendance.map((record) => {
                        const date = new Date(record.date);
                        const formattedDate = date.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        });
                        const isPresent = record.isPresent;
                        return (
                          <tr
                            key={record._id}
                            className={`attendance-row attendance-row--${isPresent ? 'present' : 'absent'}`}
                          >
                            <td style={{ fontWeight: '600' }}>{formattedDate}</td>
                            <td>
                              <span className={`attendance-status-badge attendance-status-badge--${isPresent ? 'present' : 'absent'}`}>
                                {isPresent ? '✓ Present' : '✗ Absent'}
                              </span>
                            </td>
                            <td>{record.signature || <span className="text-muted">—</span>}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default PlayerDashboard;

