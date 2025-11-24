import { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import useAuth from '../hooks/useAuth';
import StatCard from '../components/StatCard.jsx';

const PlayerDashboard = () => {
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
      setPayments(paymentRes.data);
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

  // Calculate payment summary
  const paymentSummary = payments.reduce(
    (acc, payment) => {
      acc.totalDue += payment.amountDue;
      acc.totalPaid += payment.amountPaid;
      return acc;
    },
    { totalDue: 0, totalPaid: 0 }
  );

  const outstandingBalance = paymentSummary.totalDue - paymentSummary.totalPaid;

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
        </div>
      </section>

      {loading && !player && <p className="text-muted">Loading...</p>}
      {error && !player && <p className="error-text">{error}</p>}

      {player && (
        <>
          <section className="grid stats-grid">
            <StatCard label="Monthly Fee" value={`$${player.monthlyFee}`} />
            <StatCard
              label="Total Paid"
              value={`$${paymentSummary.totalPaid.toFixed(2)}`}
              accent="#10b981"
            />
            <StatCard
              label="Outstanding Balance"
              value={`$${outstandingBalance.toFixed(2)}`}
              accent={outstandingBalance > 0 ? '#ef4444' : '#10b981'}
            />
            {attendanceSummary.total > 0 && (
              <StatCard
                label="Attendance Rate"
                value={`${attendanceRate}%`}
                accent="#6366f1"
              />
            )}
          </section>

          <section className="card">
            <h3>Contact Information</h3>
            <p className="text-muted">Phone: {player.phone}</p>
            {player.notes && (
              <div style={{ marginTop: '1rem' }}>
                <p className="text-muted">Notes:</p>
                <p>{player.notes}</p>
              </div>
            )}
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
                      <td>${payment.amountDue}</td>
                      <td>${payment.amountPaid}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            color:
                              payment.status === 'paid'
                                ? '#10b981'
                                : payment.status === 'partial'
                                ? '#f59e0b'
                                : '#ef4444',
                            backgroundColor:
                              payment.status === 'paid'
                                ? 'rgba(16, 185, 129, 0.1)'
                                : payment.status === 'partial'
                                ? 'rgba(245, 158, 11, 0.1)'
                                : 'rgba(239, 68, 68, 0.1)',
                          }}
                        >
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
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '1rem',
                    marginBottom: '1.5rem',
                  }}
                >
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
                <div style={{ overflowX: 'auto' }}>
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
                            style={{
                              backgroundColor: isPresent
                                ? 'rgba(16, 185, 129, 0.05)'
                                : 'rgba(239, 68, 68, 0.05)',
                            }}
                          >
                            <td style={{ fontWeight: '600' }}>{formattedDate}</td>
                            <td>
                              <span
                                style={{
                                  display: 'inline-block',
                                  padding: '0.25rem 0.75rem',
                                  borderRadius: '12px',
                                  fontSize: '0.85rem',
                                  fontWeight: '600',
                                  color: isPresent ? '#10b981' : '#ef4444',
                                  backgroundColor: isPresent
                                    ? 'rgba(16, 185, 129, 0.1)'
                                    : 'rgba(239, 68, 68, 0.1)',
                                }}
                              >
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

