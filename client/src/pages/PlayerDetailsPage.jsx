import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../services/apiClient';

const PlayerDetailsPage = () => {
  const { playerId } = useParams();
  const [player, setPlayer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ month: '', amountPaid: '', amountDue: '' });
  const [message, setMessage] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [playerRes, paymentRes, attendanceRes] = await Promise.all([
        apiClient.get(`/players/${playerId}`),
        apiClient.get(`/players/${playerId}/payments`),
        apiClient.get(`/players/${playerId}/attendance`),
      ]);
      setPlayer(playerRes.data);
      setPayments(paymentRes.data);
      setAttendance(attendanceRes.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [playerId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePaymentChange = (event) => {
    setPaymentForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handlePaymentSubmit = async (event) => {
    event.preventDefault();
    try {
      await apiClient.post(`/players/${playerId}/payments`, {
        month: paymentForm.month,
        amountPaid: Number(paymentForm.amountPaid),
        amountDue: paymentForm.amountDue ? Number(paymentForm.amountDue) : undefined,
      });
      setPaymentForm({ month: '', amountPaid: '', amountDue: '' });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendReminder = async () => {
    try {
      await apiClient.post('/notifications/payment-reminder', {
        playerId,
        customMessage: message,
      });
      setMessage('');
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading && !player) {
    return <p className="text-muted">Loading player...</p>;
  }

  if (error && !player) {
    return <p className="error-text">{error}</p>;
  }

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Player</p>
          <h2>{player?.fullName || 'Player'}</h2>
          <p className="text-muted">
            Payment history, attendance records, reminders, and quick notes live here.
          </p>
        </div>
      </section>

      <section className="card">
        <h3>Contact</h3>
        <p className="text-muted">{player?.phone}</p>
        <p>
          Monthly fee: <strong>${player?.monthlyFee}</strong>
        </p>
        {player?.notes && <p>{player.notes}</p>}
      </section>

      <section className="card">
        <h3>Record payment</h3>
        <form className="grid form-grid" onSubmit={handlePaymentSubmit}>
          <label>
            Month
            <input
              type="month"
              name="month"
              value={paymentForm.month}
              onChange={handlePaymentChange}
              required
            />
          </label>
          <label>
            Amount paid
            <input
              type="number"
              name="amountPaid"
              value={paymentForm.amountPaid}
              onChange={handlePaymentChange}
              min="0"
              required
            />
          </label>
          <label>
            Amount due (optional)
            <input
              type="number"
              name="amountDue"
              value={paymentForm.amountDue}
              onChange={handlePaymentChange}
              min="0"
            />
          </label>
          <button className="btn btn--primary" type="submit">
            Save payment
          </button>
        </form>
      </section>

      <section className="card">
        <h3>Payment history</h3>
        {error && <p className="error-text">{error}</p>}
        {!payments.length && !loading ? (
          <p className="text-muted">No payments yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Month</th>
                <th>Amount due</th>
                <th>Amount paid</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment._id}>
                  <td>{payment.month}</td>
                  <td>${payment.amountDue}</td>
                  <td>${payment.amountPaid}</td>
                  <td>{payment.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card">
        <h3>Attendance history</h3>
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
                  {attendance.filter((a) => a.isPresent).length}
                </p>
              </div>
              <div className="card stat-card" style={{ borderTopColor: '#ef4444', padding: '1rem' }}>
                <p className="stat-card__label">Absent days</p>
                <p className="stat-card__value" style={{ color: '#ef4444', fontSize: '1.5rem' }}>
                  {attendance.filter((a) => !a.isPresent).length}
                </p>
              </div>
              <div className="card stat-card" style={{ borderTopColor: '#6366f1', padding: '1rem' }}>
                <p className="stat-card__label">Total records</p>
                <p className="stat-card__value" style={{ fontSize: '1.5rem' }}>
                  {attendance.length}
                </p>
              </div>
              {attendance.length > 0 && (
                <div className="card stat-card" style={{ borderTopColor: '#f59e0b', padding: '1rem' }}>
                  <p className="stat-card__label">Attendance rate</p>
                  <p className="stat-card__value" style={{ fontSize: '1.5rem' }}>
                    {Math.round(
                      (attendance.filter((a) => a.isPresent).length / attendance.length) * 100
                    )}
                    %
                  </p>
                </div>
              )}
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Signature / Notes</th>
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

      <section className="card">
        <h3>Send reminder</h3>
        <div className="grid form-grid">
          <textarea
            rows={3}
            placeholder="Reminder message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
          />
          <button className="btn btn--secondary" type="button" onClick={handleSendReminder}>
            Send SMS reminder
          </button>
        </div>
      </section>
    </div>
  );
};

export default PlayerDetailsPage;

