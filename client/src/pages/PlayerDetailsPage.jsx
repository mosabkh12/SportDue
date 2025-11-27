import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { handleApiError } from '../utils/errorHandler';

const PlayerDetailsPage = () => {
  const { playerId } = useParams();
  const [player, setPlayer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ month: '', amountPaid: '', amountDue: '' });
  const [resetPasswordCredentials, setResetPasswordCredentials] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editForm, setEditForm] = useState({ amountPaid: '', amountDue: '' });
  const [deletingPayment, setDeletingPayment] = useState(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [playerRes, paymentRes, attendanceRes] = await Promise.all([
        apiClient.get(`/players/${playerId}`),
        apiClient.get(`/players/${playerId}/payments`),
        apiClient.get(`/players/${playerId}/attendance`),
      ]);
      // Always include displayPassword when setting player
      const playerData = playerRes.data;
      if (!playerData.displayPassword && playerData.credentials?.password) {
        playerData.displayPassword = playerData.credentials.password;
      }
      setPlayer(playerData);
      setPayments(paymentRes.data);
      setAttendance(attendanceRes.data || []);
    } catch (err) {
      handleApiError(err, setError);
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
      // Convert date (YYYY-MM-DD) to month format (YYYY-MM) for backend
      const monthFormat = paymentForm.month ? paymentForm.month.substring(0, 7) : paymentForm.month;
      
      await apiClient.post(`/players/${playerId}/payments`, {
        month: monthFormat,
        amountPaid: Number(paymentForm.amountPaid),
        amountDue: paymentForm.amountDue ? Number(paymentForm.amountDue) : undefined,
      });
      setPaymentForm({ month: '', amountPaid: '', amountDue: '' });
      fetchData();
    } catch (err) {
      handleApiError(err, setError);
    }
  };

  const formatDateDisplay = (monthString) => {
    // monthString is in format "YYYY-MM" or "YYYY-MM-DD"
    if (!monthString) return '';
    const parts = monthString.split('-');
    if (parts.length >= 3) {
      // Full date format: YYYY-MM-DD
      const [year, month, day] = parts;
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `${parseInt(day)} ${monthNames[parseInt(month) - 1]} ${year}`;
    } else if (parts.length === 2) {
      // Month format: YYYY-MM - show first day of month
      const [year, month] = parts;
      const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
      return `1 ${monthNames[parseInt(month) - 1]} ${year}`;
    }
    return monthString;
  };

  const handleEditPayment = (payment) => {
    setEditingPayment(payment._id);
    setEditForm({
      amountPaid: payment.amountPaid || '',
      amountDue: payment.amountDue || '',
    });
  };

  const handleCancelEdit = () => {
    setEditingPayment(null);
    setEditForm({ amountPaid: '', amountDue: '' });
  };

  const handleSaveEdit = async (paymentId) => {
    try {
      await apiClient.put(`/players/${playerId}/payments/${paymentId}`, {
        amountPaid: Number(editForm.amountPaid),
        amountDue: Number(editForm.amountDue),
      });
      setEditingPayment(null);
      setEditForm({ amountPaid: '', amountDue: '' });
      fetchData();
    } catch (err) {
      handleApiError(err, setError);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      return;
    }
    
    setDeletingPayment(paymentId);
    try {
      await apiClient.delete(`/players/${playerId}/payments/${paymentId}`);
      fetchData();
    } catch (err) {
      handleApiError(err, setError);
    } finally {
      setDeletingPayment(null);
    }
  };

  const handleResetPassword = async () => {
    setResettingPassword(true);
    setError(null);
    setResetPasswordCredentials(null);
    try {
      const response = await apiClient.post(`/players/${playerId}/reset-password`);
      
      // Get the password from response - check multiple places
      const newPassword = response.data.displayPassword || response.data.credentials?.password;
      
      // Update player state immediately so password appears right away
      if (newPassword) {
        setPlayer(prev => ({
          ...prev,
          ...response.data,
          displayPassword: newPassword, // Force update with new password
          username: response.data.username || prev?.username
        }));
      }
      
      // Show success message with password
      if (newPassword) {
        setResetPasswordCredentials({
          username: response.data.username || player?.username,
          password: newPassword,
        });
      }
      
      // Refresh data after short delay to sync everything
      setTimeout(() => {
        fetchData();
      }, 600);
    } catch (err) {
      handleApiError(err, (msg) => setError(msg || 'Failed to reset password'));
    } finally {
      setResettingPassword(false);
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
            Payment history, attendance records, and quick notes live here.
          </p>
        </div>
      </section>

      <section className="card">
        <h3 style={{ color: 'white', marginBottom: '1.5rem' }}>Contact Information</h3>
        <div style={{ display: 'grid', gap: '1rem', marginBottom: '1rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem' }}>Phone:</label>
            <p style={{ color: 'white', fontSize: '1rem' }}>{player?.phone}</p>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem' }}>Username:</label>
            {player?.username ? (
              <code style={{ 
                padding: '0.625rem 1rem', 
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(10px)',
                borderRadius: '10px',
                fontSize: '1rem',
                fontFamily: "'Monaco', 'Courier New', monospace",
                display: 'inline-block',
                fontWeight: '600',
                color: 'white',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                letterSpacing: '0.05em'
              }}>{player.username}</code>
            ) : (
              <div>
                <span className="text-muted" style={{ fontSize: '0.9rem', display: 'block', marginBottom: '0.75rem' }}>No username set</span>
                <button
                  className="btn btn--outline"
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resettingPassword}
                >
                  {resettingPassword ? 'Generating...' : '🔑 Generate Login Credentials'}
                </button>
              </div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem' }}>Password:</label>
            {player?.displayPassword ? (
              <code style={{ 
                padding: '0.625rem 1rem', 
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(251, 191, 36, 0.3))',
                backdropFilter: 'blur(10px)',
                borderRadius: '10px',
                fontSize: '1rem',
                fontFamily: "'Monaco', 'Courier New', monospace",
                display: 'inline-block',
                fontWeight: '700',
                color: '#fff',
                border: '2px solid rgba(245, 158, 11, 0.5)',
                minWidth: '150px',
                letterSpacing: '0.05em',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)'
              }}>{player.displayPassword}</code>
            ) : (
              <div>
                <span className="text-muted" style={{ fontSize: '0.9rem', display: 'block', marginBottom: '0.75rem' }}>No password set</span>
                <button
                  className="btn btn--outline"
                  type="button"
                  onClick={handleResetPassword}
                  disabled={resettingPassword}
                >
                  {resettingPassword ? 'Generating...' : '🔑 Generate Password'}
                </button>
              </div>
            )}
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem' }}>Monthly fee:</label>
            <p style={{ color: 'white', fontSize: '1.25rem', fontWeight: '700' }}>${player?.monthlyFee}</p>
          </div>
          {player?.notes && (
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.875rem' }}>Notes:</label>
              <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '1rem', lineHeight: '1.6' }}>{player.notes}</p>
            </div>
          )}
        </div>
        {player?.username && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
            <button
              className="btn btn--outline"
              type="button"
              onClick={handleResetPassword}
              disabled={resettingPassword}
            >
              {resettingPassword ? 'Resetting...' : '🔑 Reset Player Password'}
            </button>
          </div>
        )}
      </section>

      {resetPasswordCredentials && (
        <section className="success-banner animate-fade-in">
          <h4>✓ Password updated successfully!</h4>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)', marginBottom: '1rem', fontWeight: '500' }}>New password has been set and is now visible above.</p>
          <div style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(10px)', borderRadius: '12px', marginBottom: '1.5rem', border: '1px solid rgba(255, 255, 255, 0.2)' }}>
            <p style={{ marginBottom: '0.75rem', fontSize: '0.95rem', color: 'white' }}>
              <strong style={{ color: 'rgba(255, 255, 255, 0.9)', marginRight: '0.5rem' }}>Username:</strong>
              <code style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '0.25rem 0.5rem', borderRadius: '6px', fontFamily: 'monospace' }}>{resetPasswordCredentials.username}</code>
            </p>
            <p style={{ fontSize: '0.95rem', color: 'white' }}>
              <strong style={{ color: 'rgba(255, 255, 255, 0.9)', marginRight: '0.5rem' }}>New Password:</strong>
              <code style={{ background: 'rgba(245, 158, 11, 0.3)', padding: '0.25rem 0.5rem', borderRadius: '6px', fontFamily: 'monospace', fontWeight: '700', border: '1px solid rgba(245, 158, 11, 0.5)' }}>{resetPasswordCredentials.password}</code>
            </p>
          </div>
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => {
              setResetPasswordCredentials(null);
            }}
          >
            Close
          </button>
        </section>
      )}

      <section className="card">
        <div className="card__header">
          <h3>Record Payment</h3>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Record a new payment transaction for this team member
          </p>
        </div>
        <form onSubmit={handlePaymentSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <label>
              Billing Period
              <input
                type="date"
                name="month"
                value={paymentForm.month}
                onChange={handlePaymentChange}
                required
                style={{ width: '100%' }}
              />
              <small className="text-muted" style={{ fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                Select the billing date
              </small>
            </label>
            <label>
              Amount Paid ($)
              <input
                type="number"
                name="amountPaid"
                value={paymentForm.amountPaid}
                onChange={handlePaymentChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                required
                style={{ width: '100%' }}
              />
              <small className="text-muted" style={{ fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                Enter amount received
              </small>
            </label>
            <label>
              Amount Due ($)
              <input
                type="number"
                name="amountDue"
                value={paymentForm.amountDue}
                onChange={handlePaymentChange}
                min="0"
                step="0.01"
                placeholder="Optional"
                style={{ width: '100%' }}
              />
              <small className="text-muted" style={{ fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                Total amount due (optional)
              </small>
            </label>
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
            <button 
              className="btn btn--primary" 
              type="submit"
              style={{ 
                padding: '0.625rem 1.5rem',
                fontSize: '0.95rem',
                fontWeight: '600',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
                minWidth: '140px'
              }}
            >
              Save Payment
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="card__header">
          <h3>Payment History</h3>
          {!loading && payments.length > 0 && (
            <span className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
              {payments.length} {payments.length === 1 ? 'payment' : 'payments'} recorded
            </span>
          )}
        </div>
        {error && <p className="error-text">{error}</p>}
        {!payments.length && !loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
            <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No payment records found</p>
            <p className="text-muted" style={{ fontSize: '0.9rem' }}>Payment records will appear here once transactions are recorded.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Amount Due</th>
                  <th>Amount Paid</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                      {formatDateDisplay(payment.month)}
                    </td>
                    {editingPayment === payment._id ? (
                      <>
                        <td>
                          <input
                            type="number"
                            value={editForm.amountDue}
                            onChange={(e) => setEditForm(prev => ({ ...prev, amountDue: e.target.value }))}
                            min="0"
                            step="0.01"
                            style={{ width: '100px', padding: '0.5rem' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editForm.amountPaid}
                            onChange={(e) => setEditForm(prev => ({ ...prev, amountPaid: e.target.value }))}
                            min="0"
                            step="0.01"
                            style={{ width: '100px', padding: '0.5rem' }}
                          />
                        </td>
                        <td>
                          <span style={{
                            padding: '0.375rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            background: payment.status === 'paid' 
                              ? 'rgba(34, 197, 94, 0.15)' 
                              : payment.status === 'partial'
                              ? 'rgba(251, 191, 36, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                            color: payment.status === 'paid' 
                              ? '#22c55e' 
                              : payment.status === 'partial'
                              ? '#fbbf24'
                              : '#ef4444',
                            border: `1px solid ${payment.status === 'paid' 
                              ? 'rgba(34, 197, 94, 0.3)' 
                              : payment.status === 'partial'
                              ? 'rgba(251, 191, 36, 0.3)'
                              : 'rgba(239, 68, 68, 0.3)'}`
                          }}>
                            {payment.status === 'paid' ? 'Paid' : payment.status === 'partial' ? 'Partial' : 'Unpaid'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn--primary"
                              type="button"
                              onClick={() => handleSaveEdit(payment._id)}
                              style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn--outline"
                              type="button"
                              onClick={handleCancelEdit}
                              style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td style={{ fontWeight: '600' }}>${parseFloat(payment.amountDue || 0).toFixed(2)}</td>
                        <td style={{ fontWeight: '600', color: '#22c55e' }}>${parseFloat(payment.amountPaid || 0).toFixed(2)}</td>
                        <td>
                          <span style={{
                            padding: '0.375rem 0.75rem',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            background: payment.status === 'paid' 
                              ? 'rgba(34, 197, 94, 0.15)' 
                              : payment.status === 'partial'
                              ? 'rgba(251, 191, 36, 0.15)'
                              : 'rgba(239, 68, 68, 0.15)',
                            color: payment.status === 'paid' 
                              ? '#22c55e' 
                              : payment.status === 'partial'
                              ? '#fbbf24'
                              : '#ef4444',
                            border: `1px solid ${payment.status === 'paid' 
                              ? 'rgba(34, 197, 94, 0.3)' 
                              : payment.status === 'partial'
                              ? 'rgba(251, 191, 36, 0.3)'
                              : 'rgba(239, 68, 68, 0.3)'}`
                          }}>
                            {payment.status === 'paid' ? 'Paid' : payment.status === 'partial' ? 'Partial' : 'Unpaid'}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn btn--secondary"
                              type="button"
                              onClick={() => handleEditPayment(payment)}
                              style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn--outline"
                              type="button"
                              onClick={() => handleDeletePayment(payment._id)}
                              disabled={deletingPayment === payment._id}
                              style={{ 
                                fontSize: '0.85rem', 
                                padding: '0.4rem 0.8rem',
                                color: '#ef4444',
                                borderColor: '#ef4444'
                              }}
                            >
                              {deletingPayment === payment._id ? 'Deleting...' : 'Delete'}
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
    </div>
  );
};

export default PlayerDetailsPage;

