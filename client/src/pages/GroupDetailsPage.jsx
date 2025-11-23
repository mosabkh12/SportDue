import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import apiClient from '../services/apiClient';

const GroupDetailsPage = () => {
  const { groupId } = useParams();
  const [data, setData] = useState({ group: null, players: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ fullName: '', phone: '', monthlyFee: '', notes: '' });
  const [groupSettings, setGroupSettings] = useState({ paymentDueDay: 1 });
  const [reminderMonth, setReminderMonth] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState(null);

  const fetchDetails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: response } = await apiClient.get(`/groups/${groupId}`);
      setData(response);
    } catch (err) {
      setError(err.message);
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
      setGroupSettings({
        paymentDueDay: data.group.paymentDueDay || 1,
      });
      // Set default reminder month to current month
      const today = new Date();
      const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
      setReminderMonth(currentMonth);
    }
  }, [data.group]);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await apiClient.post(`/groups/${groupId}/players`, {
        ...form,
        monthlyFee: Number(form.monthlyFee),
      });
      // Reset form but keep the default monthly fee pre-filled
      setForm({
        fullName: '',
        phone: '',
        monthlyFee: data.group?.defaultMonthlyFee || '',
        notes: '',
      });
      fetchDetails();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleUpdatePaymentDueDay = async () => {
    try {
      await apiClient.put(`/groups/${groupId}`, {
        paymentDueDay: Number(groupSettings.paymentDueDay),
      });
      fetchDetails();
      setError(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSendGroupReminders = async () => {
    if (!reminderMonth) {
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
      setReminderResult(response.data);
      setReminderMessage('');
    } catch (err) {
      setError(err.message || 'Failed to send reminders');
    } finally {
      setSendingReminders(false);
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
          <h3>Group settings</h3>
        </div>
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
              <input
                type="number"
                min="1"
                max="31"
                value={groupSettings.paymentDueDay}
                onChange={(e) =>
                  setGroupSettings((prev) => ({ ...prev, paymentDueDay: e.target.value }))
                }
                style={{ width: '100%' }}
              />
              <small className="text-muted" style={{ fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                Day of the month when payment is due (1-31)
              </small>
            </label>
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleUpdatePaymentDueDay}
              style={{ marginBottom: '0' }}
            >
              Save due day
            </button>
          </div>
        </div>
      </section>

      <section className="card">
        <h3>Send payment reminders</h3>
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
      </section>

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
                <th>Phone</th>
                <th>Fee</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {data.players.map((player) => (
                <tr key={player._id}>
                  <td>{player.fullName}</td>
                  <td>{player.phone}</td>
                  <td>${player.monthlyFee}</td>
                  <td>
                    <Link className="btn btn--secondary" to={`/coach/players/${player._id}`}>
                      View details
                    </Link>
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

