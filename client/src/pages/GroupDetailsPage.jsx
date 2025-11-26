import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { handleApiError } from '../utils/errorHandler';
import { useNotifications } from '../context/NotificationContext';

const GroupDetailsPage = () => {
  const { groupId } = useParams();
  const notifications = useNotifications();
  const [data, setData] = useState({ group: null, players: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ fullName: '', phone: '', monthlyFee: '', notes: '' });
  const [groupSettings, setGroupSettings] = useState({ paymentDueDate: '' });
  const [reminderMonth, setReminderMonth] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState(null);
  const [newPlayerCredentials, setNewPlayerCredentials] = useState(null);
  const [resetPasswordCredentials, setResetPasswordCredentials] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(null);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await apiClient.get(`/groups/${groupId}`);
      setData(response);
    } catch (err) {
      handleApiError(err, setError);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Pre-fill monthly fee with group's default fee when group data is loaded
  useEffect(() => {
    if (data.group && data.group.defaultMonthlyFee !== undefined) {
      setForm((prev) => ({
        ...prev,
        monthlyFee: prev.monthlyFee || data.group.defaultMonthlyFee || '',
      }));
    }
  }, [data.group?.defaultMonthlyFee]);

  // Set group settings when group data is loaded
  useEffect(() => {
    if (data.group) {
      // Convert payment due day to a date format for the date picker
      // Always use current month with the saved due day
      const dueDay = data.group.paymentDueDay || 1;
      const today = new Date();
      // Create a date with the due day of current month (ensures it's always current month)
      const dueDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
      const dateString = dueDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      setGroupSettings({
        paymentDueDate: dateString,
      });
      // Set default reminder month to current month
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      setReminderMonth(currentMonth);
    }
  }, [data.group]);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setNewPlayerCredentials(null);
    try {
      const response = await apiClient.post(`/groups/${groupId}/players`, {
        ...form,
        monthlyFee: Number(form.monthlyFee),
      });
      
      // Display credentials if they were generated
      if (response.data.credentials) {
        setNewPlayerCredentials({
          username: response.data.credentials.username,
          password: response.data.credentials.password,
        });
      }
      
      // Reset form but keep the default monthly fee pre-filled
      setForm({
        fullName: '',
        phone: '',
        monthlyFee: data.group?.defaultMonthlyFee || '',
        notes: '',
      });
      // Refresh to show the new player with credentials
      setTimeout(() => {
        fetchDetails();
      }, 500);
    } catch (err) {
      handleApiError(err, setError);
    }
  };

  const handleUpdatePaymentDueDay = async () => {
    if (!groupSettings.paymentDueDate) {
      notifications.error('Please select a payment due date');
      return;
    }
    
    try {
      // Extract the day from the selected date
      const selectedDate = new Date(groupSettings.paymentDueDate);
      const day = selectedDate.getDate();
      
      // Validate day is between 1-31
      if (day < 1 || day > 31) {
        notifications.error('Please select a valid day (1-31)');
        return;
      }
      
      await apiClient.put(`/groups/${groupId}`, {
        paymentDueDay: day,
      });
      notifications.success(`Payment due day set to the ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month. Automatic reminders will be sent at 9:00 AM on this day.`);
      
      // Update the date picker to reflect current month with the new day
      const today = new Date();
      const updatedDate = new Date(today.getFullYear(), today.getMonth(), day);
      setGroupSettings({
        paymentDueDate: updatedDate.toISOString().split('T')[0],
      });
      
      fetchDetails();
      setError(null);
    } catch (err) {
      handleApiError(err, setError);
      notifications.error(err.message || 'Failed to update payment due day');
    }
  };

  const handleSendGroupReminders = async () => {
    if (!reminderMonth) {
      notifications.error('Please select a month');
      setError('Please select a month');
      return;
    }
    setSendingReminders(true);
    setError(null);
    setReminderResult(null);
    try {
      const response = await apiClient.post('/notifications/group-payment-reminders', {
        groupId,
        month: reminderMonth,
        customMessage: reminderMessage || undefined,
      });
      const result = response.data;
      setReminderResult(result);
      setReminderMessage('');
      
      if (result.success) {
        if (result.sent > 0) {
          notifications.success(`Successfully sent ${result.sent} reminder${result.sent !== 1 ? 's' : ''} for ${result.month}`);
        } else {
          notifications.info(result.message || 'No reminders to send');
        }
        if (result.failed > 0) {
          notifications.warning(`${result.failed} reminder${result.failed !== 1 ? 's' : ''} failed to send`);
        }
      } else {
        notifications.error('Failed to send reminders');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to send reminders';
      handleApiError(err, (msg) => setError(msg || 'Failed to send reminders'));
      notifications.error(errorMsg);
    } finally {
      setSendingReminders(false);
    }
  };

  const handleResetPassword = async (playerId) => {
    setResettingPassword(playerId);
    setError(null);
    setResetPasswordCredentials(null);
    try {
      const response = await apiClient.post(`/players/${playerId}/reset-password`);
      setResetPasswordCredentials({
        playerId,
        ...response.data.credentials,
      });
      // Refresh to show updated credentials
      setTimeout(() => {
        fetchDetails();
      }, 500);
    } catch (err) {
      handleApiError(err, (msg) => setError(msg || 'Failed to reset password'));
    } finally {
      setResettingPassword(null);
    }
  };

  if (loading && !data.group) {
    return <p className="text-muted">Loading group...</p>;
  }

  if (error && !data.group) {
    return <p className="error-text">{error}</p>;
  }

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Group</p>
          <h2>{data.group?.name || 'Training group'}</h2>
          <p className="text-muted">
            {data.group?.description || 'Manage players, payments, and attendance records.'}
          </p>
        </div>
        <Link className="btn btn--outline" to={`/coach/groups/${groupId}/attendance`}>
          Manage attendance
        </Link>
      </section>

      <section className="card">
        <div className="card__header">
          <h3>Group settings & Payment reminders</h3>
        </div>
        
        <div style={{ display: 'grid', gap: '2rem' }}>
          {/* Group Settings Section */}
          <div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Group settings
            </h4>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <p className="text-muted">{data.group?.description || 'No description'}</p>
              <p>
                Default fee: <strong>${data.group?.defaultMonthlyFee || 0}</strong>
              </p>
              <div
                style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'flex-end',
                  flexWrap: 'wrap',
                  padding: '1rem',
                  backgroundColor: 'rgba(99, 102, 241, 0.05)',
                  borderRadius: '8px',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}
              >
                <label style={{ flex: '1', minWidth: '200px' }}>
                  Payment due day
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="date"
                      value={groupSettings.paymentDueDate}
                      onChange={(e) => {
                        const selectedDate = e.target.value;
                        // Ensure the selected date is in the current month
                        const today = new Date();
                        const selected = new Date(selectedDate);
                        if (selected.getMonth() !== today.getMonth() || selected.getFullYear() !== today.getFullYear()) {
                          // If user selected a different month, adjust to current month with same day
                          const day = selected.getDate();
                          const adjustedDate = new Date(today.getFullYear(), today.getMonth(), day);
                          setGroupSettings((prev) => ({ ...prev, paymentDueDate: adjustedDate.toISOString().split('T')[0] }));
                        } else {
                          setGroupSettings((prev) => ({ ...prev, paymentDueDate: selectedDate }));
                        }
                      }}
                      style={{ flex: 1 }}
                    />
                  </div>
                  <small className="text-muted" style={{ fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                    Select a date in the current month. The day number (1-31) will be saved. Automatic reminders will be sent on this day each month at 9:00 AM.
                  </small>
                  {data.group?.paymentDueDay && (
                    <div style={{ 
                      marginTop: '0.5rem', 
                      padding: '0.75rem', 
                      background: 'rgba(34, 197, 94, 0.1)', 
                      borderRadius: '8px',
                      border: '1px solid rgba(34, 197, 94, 0.3)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>✓</span>
                        <small style={{ color: '#22c55e', fontWeight: '600' }}>
                          Automatic reminders set for the {data.group.paymentDueDay}{data.group.paymentDueDay === 1 ? 'st' : data.group.paymentDueDay === 2 ? 'nd' : data.group.paymentDueDay === 3 ? 'rd' : 'th'} of each month at 9:00 AM
                        </small>
                      </div>
                      {(() => {
                        const today = new Date();
                        const currentDay = today.getDate();
                        const dueDay = data.group.paymentDueDay;
                        let nextReminderDate;
                        
                        if (currentDay < dueDay) {
                          // This month
                          nextReminderDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
                        } else {
                          // Next month
                          nextReminderDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
                        }
                        
                        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                        const nextDateStr = `${monthNames[nextReminderDate.getMonth()]} ${nextReminderDate.getDate()}, ${nextReminderDate.getFullYear()}`;
                        
                        return (
                          <small style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>
                            Next reminder: {nextDateStr} at 9:00 AM
                          </small>
                        );
                      })()}
                    </div>
                  )}
                </label>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={handleUpdatePaymentDueDay}
                  style={{ marginBottom: '0' }}
                  disabled={!groupSettings.paymentDueDate}
                >
                  Save due date
                </button>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div style={{ 
            height: '1px', 
            background: 'var(--border)', 
            margin: '0.5rem 0' 
          }} />

          {/* Send Payment Reminders Section */}
          <div>
            <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem' }}>
              Send payment reminders
            </h4>
            <p className="text-muted" style={{ marginBottom: '1rem' }}>
              Send SMS reminders to all unpaid players for a specific month. Only players who haven't fully paid will receive reminders.
            </p>
            <div className="grid form-grid">
              <label>
                Month
                <input
                  type="month"
                  value={reminderMonth}
                  onChange={(e) => setReminderMonth(e.target.value)}
                  required
                />
              </label>
              <label className="full-width">
                Custom message (optional)
                <textarea
                  rows={3}
                  placeholder="Leave empty to use default message. The message will include player name, amount due, amount paid, and remaining balance."
                  value={reminderMessage}
                  onChange={(e) => setReminderMessage(e.target.value)}
                />
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <button
                  className="btn btn--secondary"
                  type="button"
                  onClick={handleSendGroupReminders}
                  disabled={sendingReminders || !reminderMonth}
                >
                  {sendingReminders ? 'Sending...' : '📧 Send reminders to unpaid players'}
                </button>
              </div>
            </div>
            {reminderResult && (
              <div
                style={{
                  marginTop: '1rem',
                  padding: '1rem',
                  borderRadius: '8px',
                  backgroundColor: reminderResult.success
                    ? 'rgba(16, 185, 129, 0.1)'
                    : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${reminderResult.success ? '#10b981' : '#ef4444'}`,
                }}
              >
                <p style={{ fontWeight: '600', color: reminderResult.success ? '#10b981' : '#ef4444' }}>
                  {reminderResult.success
                    ? `✓ Successfully sent ${reminderResult.sent} reminder${reminderResult.sent !== 1 ? 's' : ''} for ${reminderResult.month}`
                    : 'Failed to send reminders'}
                </p>
                {reminderResult.failed > 0 && (
                  <p className="text-muted" style={{ marginTop: '0.5rem' }}>
                    {reminderResult.failed} reminder{reminderResult.failed !== 1 ? 's' : ''} failed to send
                  </p>
                )}
                {reminderResult.message && (
                  <p className="text-muted" style={{ marginTop: '0.5rem' }}>
                    {reminderResult.message}
                  </p>
                )}
              </div>
            )}
            {error && <p className="error-text" style={{ marginTop: '1rem' }}>{error}</p>}
          </div>
        </div>
      </section>

      {newPlayerCredentials && (
        <section className="card success-banner">
          <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>✓ Player created successfully!</h3>
          <p style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '1rem' }}>Login credentials (save these now - password won't be shown again!):</p>
          <div style={{ padding: '1.5rem', background: 'rgba(17, 24, 39, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(34, 197, 94, 0.4)' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)' }}>Username:</label>
              <code style={{ 
                padding: '0.75rem 1rem', 
                background: 'rgba(34, 197, 94, 0.2)',
                borderRadius: '8px',
                fontSize: '1rem',
                display: 'block',
                fontFamily: "'Monaco', 'Courier New', monospace",
                letterSpacing: '0.05em',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                fontWeight: '600'
              }}>{newPlayerCredentials.username}</code>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)' }}>Password:</label>
              <code style={{ 
                padding: '0.75rem 1rem', 
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(251, 191, 36, 0.3))',
                borderRadius: '8px',
                fontSize: '1rem',
                display: 'block',
                fontFamily: "'Monaco', 'Courier New', monospace",
                letterSpacing: '0.05em',
                color: '#fbbf24',
                border: '2px solid rgba(245, 158, 11, 0.5)',
                fontWeight: '700'
              }}>{newPlayerCredentials.password}</code>
            </div>
          </div>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem', fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.7)' }}>
            ⚠️ Please copy and share these credentials with the player. The password will not be shown again!
          </p>
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => setNewPlayerCredentials(null)}
          >
            Got it, close
          </button>
        </section>
      )}

      {resetPasswordCredentials && (
        <section className="card success-banner">
          <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>✓ Password reset successfully!</h3>
          <p style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '1rem' }}>New login credentials (save these now - password won't be shown again!):</p>
          <div style={{ padding: '1.5rem', background: 'rgba(17, 24, 39, 0.8)', backdropFilter: 'blur(10px)', borderRadius: '12px', marginBottom: '1rem', border: '1px solid rgba(34, 197, 94, 0.4)' }}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)' }}>Username:</label>
              <code style={{ 
                padding: '0.75rem 1rem', 
                background: 'rgba(34, 197, 94, 0.2)',
                borderRadius: '8px',
                fontSize: '1rem',
                display: 'block',
                fontFamily: "'Monaco', 'Courier New', monospace",
                letterSpacing: '0.05em',
                color: '#22c55e',
                border: '1px solid rgba(34, 197, 94, 0.4)',
                fontWeight: '600'
              }}>{resetPasswordCredentials.username}</code>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)' }}>New Password:</label>
              <code style={{ 
                padding: '0.75rem 1rem', 
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(251, 191, 36, 0.3))',
                borderRadius: '8px',
                fontSize: '1rem',
                display: 'block',
                fontFamily: "'Monaco', 'Courier New', monospace",
                letterSpacing: '0.05em',
                color: '#fbbf24',
                border: '2px solid rgba(245, 158, 11, 0.5)',
                fontWeight: '700'
              }}>{resetPasswordCredentials.password}</code>
            </div>
          </div>
          <p className="text-muted" style={{ fontSize: '0.85rem', marginBottom: '1rem', fontStyle: 'italic', color: 'rgba(255, 255, 255, 0.7)' }}>
            ⚠️ Please copy and share these credentials with the player. The password will not be shown again!
          </p>
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => setResetPasswordCredentials(null)}
          >
            Got it, close
          </button>
        </section>
      )}

      <section className="card">
        <h3>Add a player</h3>
        <form className="grid form-grid" onSubmit={handleSubmit}>
          <label>
            Full name
            <input name="fullName" value={form.fullName} onChange={handleChange} required />
          </label>
          <label>
            Phone
            <input name="phone" value={form.phone} onChange={handleChange} required />
          </label>
          <label>
            Monthly fee
            <input
              type="number"
              name="monthlyFee"
              value={form.monthlyFee}
              onChange={handleChange}
              placeholder={data.group?.defaultMonthlyFee ? `Default: $${data.group.defaultMonthlyFee}` : '0'}
              required
              min="0"
            />
            {data.group?.defaultMonthlyFee && (
              <small className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                Default fee: ${data.group.defaultMonthlyFee}
              </small>
            )}
          </label>
          <label className="full-width">
            Notes
            <textarea name="notes" rows={2} value={form.notes} onChange={handleChange} />
          </label>
          <button className="btn btn--primary" type="submit">
            Save player
          </button>
        </form>
      </section>

      <section className="card">
        <div className="card__header">
          <h3>Players</h3>
          {loading && <span className="text-muted">Refreshing...</span>}
        </div>
        {error && <p className="error-text">{error}</p>}
        {!data.players.length && !loading ? (
          <p className="text-muted">No players yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Username</th>
                <th>Password</th>
                <th>Phone</th>
                <th>Fee</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.players.map((player) => (
                <tr key={player._id}>
                  <td style={{ fontWeight: '600' }}>{player.fullName}</td>
                  <td>
                    {player.username ? (
                      <code style={{ 
                        padding: '0.5rem 0.75rem', 
                        background: 'rgba(34, 197, 94, 0.15)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        fontFamily: "'Monaco', 'Courier New', monospace",
                        display: 'inline-block',
                        fontWeight: '600',
                        color: '#22c55e',
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        letterSpacing: '0.05em'
                      }}>{player.username}</code>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>No username</span>
                    )}
                  </td>
                  <td>
                    {player.displayPassword ? (
                      <code style={{ 
                        padding: '0.5rem 0.75rem', 
                        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(251, 191, 36, 0.3))',
                        backdropFilter: 'blur(10px)',
                        borderRadius: '8px',
                        fontSize: '0.95rem',
                        fontFamily: "'Monaco', 'Courier New', monospace",
                        display: 'inline-block',
                        fontWeight: '700',
                        color: '#fbbf24',
                        border: '2px solid rgba(245, 158, 11, 0.5)',
                        letterSpacing: '0.05em',
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)'
                      }}>{player.displayPassword}</code>
                    ) : (
                      <span className="text-muted" style={{ fontSize: '0.85rem' }}>No password</span>
                    )}
                  </td>
                  <td>{player.phone}</td>
                  <td>${player.monthlyFee}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Link className="btn btn--secondary" to={`/coach/players/${player._id}`} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                        View details
                      </Link>
                      <button
                        className="btn btn--outline"
                        type="button"
                        onClick={() => handleResetPassword(player._id)}
                        disabled={resettingPassword === player._id}
                        style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                      >
                        {resettingPassword === player._id ? 'Resetting...' : '🔑 Reset Password'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
};

export default GroupDetailsPage;

