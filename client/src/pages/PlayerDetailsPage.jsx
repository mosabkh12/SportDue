import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { handleApiError } from '../utils/errorHandler';
import { useNotifications } from '../context/NotificationContext';
import '../styles/pages/PlayerDetailsPage.css';

const PlayerDetailsPage = () => {
  const { playerId } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [player, setPlayer] = useState(null);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [paymentForm, setPaymentForm] = useState({ month: '', amountPaid: '', amountDue: '' });
  const [editingPayment, setEditingPayment] = useState(null);
  const [editForm, setEditForm] = useState({ amountPaid: '', amountDue: '' });
  const [deletingPayment, setDeletingPayment] = useState(null);
  const [editingPlayer, setEditingPlayer] = useState(false);
  const [playerEditForm, setPlayerEditForm] = useState({ fullName: '', phone: '', monthlyFee: '', notes: '', username: '', password: '' });
  const [updatingPlayer, setUpdatingPlayer] = useState(false);

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

  // Initialize edit form when player data is loaded
  useEffect(() => {
    if (player && !editingPlayer) {
      setPlayerEditForm({
        fullName: player.fullName || '',
        phone: player.phone || '',
        monthlyFee: player.monthlyFee || '',
        notes: player.notes || '',
        username: player.username || '',
        password: player.displayPassword || '',
      });
    }
  }, [player, editingPlayer]);

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

  const handleStartEdit = () => {
    setEditingPlayer(true);
    setError(null);
  };

  const handleCancelPlayerEdit = () => {
    setEditingPlayer(false);
    if (player) {
      setPlayerEditForm({
        fullName: player.fullName || '',
        phone: player.phone || '',
        monthlyFee: player.monthlyFee || '',
        notes: player.notes || '',
        username: player.username || '',
        password: player.displayPassword || '',
      });
    }
    setError(null);
  };

  const handlePlayerEditChange = (e) => {
    setPlayerEditForm(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSavePlayerEdit = async () => {
    setUpdatingPlayer(true);
    setError(null);
    try {
      // Validate phone number length if being updated
      if (playerEditForm.phone && playerEditForm.phone.trim().length > 20) {
        notifications.error('Phone number must be 20 characters or less');
        setUpdatingPlayer(false);
        return;
      }

      // Validate monthly fee
      const monthlyFee = parseFloat(playerEditForm.monthlyFee);
      if (isNaN(monthlyFee) || monthlyFee < 0) {
        notifications.error('Monthly fee must be a valid number (0 or greater)');
        setUpdatingPlayer(false);
        return;
      }

      const updateData = {
        fullName: playerEditForm.fullName.trim(),
        phone: playerEditForm.phone.trim(),
        monthlyFee: monthlyFee,
        notes: playerEditForm.notes.trim(),
      };

      // Include username if provided
      if (playerEditForm.username.trim()) {
        updateData.username = playerEditForm.username.trim();
      }

      // Include password if provided
      if (playerEditForm.password.trim()) {
        updateData.password = playerEditForm.password.trim();
      }

      const response = await apiClient.put(`/players/${playerId}`, updateData);

      notifications.success('Player details updated successfully');
      setEditingPlayer(false);
      fetchData();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update player details';
      handleApiError(err, setError);
      notifications.error(errorMessage);
    } finally {
      setUpdatingPlayer(false);
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
        <div className="page-header-content">
          <button
            onClick={() => navigate(-1)}
            className="btn btn--outline btn-back"
            type="button"
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <p className="eyebrow">Player</p>
          <h2>{player?.fullName || 'Player'}</h2>
          <p className="text-muted">
            Payment history, attendance records, and quick notes live here.
          </p>
        </div>
      </section>

      <section className="card">
        <div className="card-header-row">
          <h3 className="card-title">Player Information</h3>
          {!editingPlayer && (
            <button
              className="btn btn--secondary btn-edit-details"
              type="button"
              onClick={handleStartEdit}
            >
              ✏️ Edit Details
            </button>
          )}
        </div>
        
        {editingPlayer ? (
          <div className="edit-form-grid">
            <div className="form-field">
              <label className="form-label">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={playerEditForm.fullName}
                onChange={handlePlayerEditChange}
                required
                className="form-input"
                placeholder="Enter full name"
              />
            </div>
            <div className="form-field">
              <label className="form-label">
                Phone Number *
              </label>
              <input
                type="text"
                name="phone"
                value={playerEditForm.phone}
                onChange={handlePlayerEditChange}
                required
                maxLength={20}
                className="form-input form-input--monospace"
                placeholder="e.g., 0526867838 or +972526867838"
              />
              <small className="form-help-text">
                Maximum 20 characters
              </small>
            </div>
            <div className="form-field">
              <label className="form-label">
                Username
              </label>
              <input
                type="text"
                name="username"
                value={playerEditForm.username}
                onChange={handlePlayerEditChange}
                className="form-input form-input--monospace"
                placeholder="Enter username (optional)"
              />
              <small className="form-help-text">
                Optional: Leave blank to auto-generate
              </small>
            </div>
            <div className="form-field">
              <label className="form-label">
                Password
              </label>
              <input
                type="text"
                name="password"
                value={playerEditForm.password}
                onChange={handlePlayerEditChange}
                className="form-input form-input--monospace"
                placeholder="Enter password (optional)"
              />
              <small className="form-help-text">
                Optional: Leave blank to keep current password
              </small>
            </div>
            <div className="form-field">
              <label className="form-label">
                Monthly Fee ($) *
              </label>
              <input
                type="number"
                name="monthlyFee"
                value={playerEditForm.monthlyFee}
                onChange={handlePlayerEditChange}
                required
                min="0"
                step="0.01"
                className="form-input"
                placeholder="0.00"
              />
            </div>
            <div className="form-field">
              <label className="form-label">
                Notes
              </label>
              <textarea
                name="notes"
                value={playerEditForm.notes}
                onChange={handlePlayerEditChange}
                rows={4}
                className="form-textarea"
                placeholder="Optional: Additional notes about this player"
              />
            </div>
            {error && <p className="error-text form-error">{error}</p>}
            <div className="form-actions">
              <button
                className="btn btn--outline"
                type="button"
                onClick={handleCancelPlayerEdit}
                disabled={updatingPlayer}
              >
                Cancel
              </button>
              <button
                className="btn btn--primary"
                type="button"
                onClick={handleSavePlayerEdit}
                disabled={updatingPlayer || !playerEditForm.fullName.trim() || !playerEditForm.phone.trim()}
              >
                {updatingPlayer ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        ) : (
          <div className="detail-grid">
            <div className="detail-item">
              <label className="detail-label">Full Name:</label>
              <p className="detail-value">{player?.fullName || '—'}</p>
            </div>
            <div className="detail-item">
              <label className="detail-label">Phone:</label>
              <p className="detail-value detail-value--monospace">{player?.phone || '—'}</p>
            </div>
            <div className="detail-item">
              <label className="detail-label">Username:</label>
              {player?.username ? (
                <code className="credential-badge">{player.username}</code>
              ) : (
                <span className="text-muted">No username set</span>
              )}
            </div>
            <div className="detail-item">
              <label className="detail-label">Password:</label>
              {player?.displayPassword ? (
                <code className="credential-badge credential-badge--password">{player.displayPassword}</code>
              ) : (
                <span className="text-muted">No password set</span>
              )}
            </div>
            <div className="detail-item">
              <label className="detail-label">Monthly fee:</label>
              <p className="detail-value detail-value--large">${parseFloat(player?.monthlyFee || 0).toFixed(2)}</p>
            </div>
            {player?.notes && (
              <div className="detail-item">
                <label className="detail-label">Notes:</label>
                <p className="detail-value notes-text">{player.notes}</p>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="card">
        <div className="card__header">
          <h3>Record Payment</h3>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
            Record a new payment transaction for this team member
          </p>
        </div>
        <form onSubmit={handlePaymentSubmit}>
          <div className="payment-form-grid">
            <label>
              Billing Period
              <input
                type="date"
                name="month"
                value={paymentForm.month}
                onChange={handlePaymentChange}
                required
                className="form-input"
              />
              <small className="form-help-text">
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
                className="form-input"
              />
              <small className="form-help-text">
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
                className="form-input"
              />
              <small className="form-help-text">
                Total amount due (optional)
              </small>
            </label>
          </div>
          <div className="payment-form-actions">
            <button 
              className="btn btn--primary payment-form-submit-btn" 
              type="submit"
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
          <div className="empty-state">
            <p className="text-muted empty-state-title">No payment records found</p>
            <p className="text-muted empty-state-subtitle">Payment records will appear here once transactions are recorded.</p>
          </div>
        ) : (
          <div className="table-wrapper">
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
                    <td className="payment-date">{formatDateDisplay(payment.month)}</td>
                    {editingPayment === payment._id ? (
                      <>
                        <td>
                          <input
                            type="number"
                            value={editForm.amountDue}
                            onChange={(e) => setEditForm(prev => ({ ...prev, amountDue: e.target.value }))}
                            min="0"
                            step="0.01"
                            className="payment-edit-input"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={editForm.amountPaid}
                            onChange={(e) => setEditForm(prev => ({ ...prev, amountPaid: e.target.value }))}
                            min="0"
                            step="0.01"
                            className="payment-edit-input"
                          />
                        </td>
                        <td>
                          <span className={`payment-status-badge payment-status-badge--${payment.status}`}>
                            {payment.status === 'paid' ? 'Paid' : payment.status === 'partial' ? 'Partial' : 'Unpaid'}
                          </span>
                        </td>
                        <td>
                          <div className="payment-actions">
                            <button
                              className="btn btn--primary btn-small"
                              type="button"
                              onClick={() => handleSaveEdit(payment._id)}
                            >
                              Save
                            </button>
                            <button
                              className="btn btn--outline btn-small"
                              type="button"
                              onClick={handleCancelEdit}
                            >
                              Cancel
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="payment-amount-due">${parseFloat(payment.amountDue || 0).toFixed(2)}</td>
                        <td className="payment-amount-paid">${parseFloat(payment.amountPaid || 0).toFixed(2)}</td>
                        <td>
                          <span className={`payment-status-badge payment-status-badge--${payment.status}`}>
                            {payment.status === 'paid' ? 'Paid' : payment.status === 'partial' ? 'Partial' : 'Unpaid'}
                          </span>
                        </td>
                        <td>
                          <div className="payment-actions">
                            <button
                              className="btn btn--secondary btn-small"
                              type="button"
                              onClick={() => handleEditPayment(payment)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn btn--outline btn-small btn-delete"
                              type="button"
                              onClick={() => handleDeletePayment(payment._id)}
                              disabled={deletingPayment === payment._id}
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
            <div className="attendance-stats-grid">
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
            <div className="table-wrapper">
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
    </div>
  );
};

export default PlayerDetailsPage;

