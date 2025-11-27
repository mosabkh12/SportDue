import { useCallback, useEffect, useState } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { handleApiError } from '../utils/errorHandler';
import { useNotifications } from '../context/NotificationContext';
import '../styles/pages/GroupDetailsPage.css';

const GroupDetailsPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [data, setData] = useState({ group: null, players: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ fullName: '', phone: '', monthlyFee: '', notes: '' });
  const [groupSettings, setGroupSettings] = useState({ 
    paymentDueDate: '', 
    defaultMonthlyFee: ''
  });
  const [updatingFee, setUpdatingFee] = useState(false);
  const [reminderMonth, setReminderMonth] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [deletingGroup, setDeletingGroup] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

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
        defaultMonthlyFee: data.group.defaultMonthlyFee || 0,
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
      notifications.success('Team member successfully enrolled.');
      // Refresh to show the new player
      setTimeout(() => {
        fetchDetails();
        setActiveTab('players');
      }, 500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add team member';
      handleApiError(err, setError);
      notifications.error(errorMessage);
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
      notifications.success(`Payment due date updated to the ${day}${day === 1 ? 'st' : day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'} of each month. Automated reminders will be sent at 9:00 AM on this day.`);
      
      // Update the date picker to reflect current month with the new day
      const today = new Date();
      const updatedDate = new Date(today.getFullYear(), today.getMonth(), day);
      setGroupSettings((prev) => ({
        ...prev,
        paymentDueDate: updatedDate.toISOString().split('T')[0],
      }));
      
      fetchDetails();
      setError(null);
    } catch (err) {
      handleApiError(err, setError);
      notifications.error(err.message || 'Failed to update payment due day');
    }
  };

  const handleUpdateDefaultFee = async () => {
    const fee = parseFloat(groupSettings.defaultMonthlyFee);
    
    if (isNaN(fee) || fee < 0) {
      notifications.error('Please enter a valid fee amount (must be 0 or greater)');
      return;
    }
    
    setUpdatingFee(true);
    try {
      await apiClient.put(`/groups/${groupId}`, {
        defaultMonthlyFee: fee,
      });
      notifications.success(`Default monthly fee updated to $${fee.toFixed(2)}`);
      fetchDetails();
      setError(null);
    } catch (err) {
      handleApiError(err, setError);
      notifications.error(err.message || 'Failed to update default fee');
    } finally {
      setUpdatingFee(false);
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

  const handleDeleteGroup = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    setDeletingGroup(true);
    setError(null);
    try {
      await apiClient.delete(`/groups/${groupId}`);
      notifications.success(`Group "${data.group?.name || 'Group'}" has been successfully deleted.`);
      // Navigate back to dashboard after a short delay
      setTimeout(() => {
        navigate('/coach/dashboard');
      }, 500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete group';
      handleApiError(err, setError);
      notifications.error(errorMessage);
      setShowDeleteConfirm(false);
    } finally {
      setDeletingGroup(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
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
        <div className="page-header-content">
          <button
            onClick={() => navigate(-1)}
            className="btn btn--outline btn-back"
            type="button"
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <p className="eyebrow">Training Group</p>
          <h2>{data.group?.name || 'Training Group'}</h2>
          <p className="text-muted">
            {data.group?.description || 'Comprehensive management dashboard for team roster, financial tracking, and attendance monitoring.'}
          </p>
        </div>
        <div className="page-header-actions">
          <Link className="btn btn--primary" to={`/coach/groups/${groupId}/attendance`}>
            📅 Manage Attendance
          </Link>
          <button
            className="btn btn--outline btn-delete-group"
            type="button"
            onClick={handleDeleteGroup}
            disabled={deletingGroup}
          >
            {deletingGroup ? 'Deleting...' : '🗑️ Delete Group'}
          </button>
        </div>
      </section>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          onClick={() => setActiveTab('overview')}
          className={`tab-button ${activeTab === 'overview' ? 'tab-button--active' : ''}`}
        >
          <span className="tab-icon">📊</span>
          Overview
        </button>
        <button
          onClick={() => setActiveTab('configuration')}
          className={`tab-button ${activeTab === 'configuration' ? 'tab-button--active' : ''}`}
        >
          <span className="tab-icon">⚙️</span>
          Configuration
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className={`tab-button ${activeTab === 'reminders' ? 'tab-button--active' : ''}`}
        >
          <span className="tab-icon">📨</span>
          Payment Reminders
        </button>
        <button
          onClick={() => setActiveTab('players')}
          className={`tab-button ${activeTab === 'players' ? 'tab-button--active' : ''}`}
        >
          <span className="tab-icon">👥</span>
          Team Members ({data.players.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid" style={{ gap: '1.5rem' }}>
          {/* Quick Stats */}
          <section className="card">
            <div className="card__header">
              <h3>📊 Group Overview</h3>
              <p className="text-muted" style={{ fontSize: '1.1rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
                Quick overview of your training group statistics and key information
              </p>
            </div>
            <div className="overview-stats-grid">
              <div className="stat-box stat-box--blue">
                <div className="stat-value stat-value--blue">
                  {data.players.length}
                </div>
                <div className="stat-label">
                  Active Members
                </div>
              </div>
              <div className="stat-box stat-box--green">
                <div className="stat-value stat-value--green">
                  ${data.group?.defaultMonthlyFee ? data.group.defaultMonthlyFee.toFixed(2) : '0.00'}
                </div>
                <div className="stat-label">
                  Default Monthly Fee
                </div>
              </div>
              <div className="stat-box stat-box--yellow">
                <div className="stat-value stat-value--yellow">
                  {data.group?.paymentDueDay || 'N/A'}
                </div>
                <div className="stat-label">
                  Payment Due Day
                </div>
              </div>
            </div>
          </section>

          {/* Group Information */}
          <section className="card">
            <div className="card__header">
              <h3>ℹ️ Group Information</h3>
            </div>
            <div className="grid" style={{ gap: '1rem' }}>
              {data.group?.description && (
                <div className="info-box">
                  <div className="info-label">
                    Description
                  </div>
                  <p className="text-muted" style={{ margin: 0, fontSize: '1.1rem', lineHeight: '1.7' }}>
                    {data.group.description}
                  </p>
                </div>
              )}
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-item-label">
                    Default Monthly Fee
                  </div>
                  <div className="info-item-value">
                    ${data.group?.defaultMonthlyFee ? data.group.defaultMonthlyFee.toFixed(2) : '0.00'}
                  </div>
                </div>
                <div className="info-item">
                  <div className="info-item-label">
                    Payment Due Day
                  </div>
                  <div className="info-item-value">
                    {data.group?.paymentDueDay ? `${data.group.paymentDueDay}${data.group.paymentDueDay === 1 ? 'st' : data.group.paymentDueDay === 2 ? 'nd' : data.group.paymentDueDay === 3 ? 'rd' : 'th'}` : 'Not Set'} of Each Month
                  </div>
                  {data.group?.paymentDueDay && (
                    <div className="info-item-note">
                      Automated reminders at 9:00 AM
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Configuration Tab */}
      {activeTab === 'configuration' && (
        <section className="card">
          <div className="card__header">
            <h3>⚙️ Group Configuration</h3>
            <p className="text-muted" style={{ fontSize: '1.1rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
              Configure billing parameters and automated notification schedules for your training group
            </p>
          </div>
          
          <div className="grid" style={{ gap: '2rem' }}>
            <div className="config-section">
              <h4 className="config-section-title">
                💰 Default Monthly Fee
              </h4>
              <div className="config-form-row">
                <label className="config-form-input">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={groupSettings.defaultMonthlyFee}
                    onChange={(e) => {
                      setGroupSettings((prev) => ({ ...prev, defaultMonthlyFee: e.target.value }));
                    }}
                    placeholder="0.00"
                  />
                  <small className="text-muted" style={{ fontSize: '1rem', display: 'block', marginTop: '0.5rem', lineHeight: '1.5' }}>
                    This amount will serve as the default monthly fee when registering new team members
                  </small>
                </label>
                <button
                  className="btn btn--primary btn-config"
                  type="button"
                  onClick={handleUpdateDefaultFee}
                  disabled={updatingFee || parseFloat(groupSettings.defaultMonthlyFee || 0) === parseFloat(data.group?.defaultMonthlyFee || 0)}
                >
                  {updatingFee ? 'Updating...' : '💾 Update Fee'}
                </button>
              </div>
            </div>

            <div className="config-section">
              <h4 className="config-section-title">
                📅 Payment Due Date
              </h4>
              <div className="config-form-row">
                <label className="config-form-input">
                  <input
                    type="date"
                    value={groupSettings.paymentDueDate}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      const today = new Date();
                      const selected = new Date(selectedDate);
                      if (selected.getMonth() !== today.getMonth() || selected.getFullYear() !== today.getFullYear()) {
                        const day = selected.getDate();
                        const adjustedDate = new Date(today.getFullYear(), today.getMonth(), day);
                        setGroupSettings((prev) => ({ ...prev, paymentDueDate: adjustedDate.toISOString().split('T')[0] }));
                      } else {
                        setGroupSettings((prev) => ({ ...prev, paymentDueDate: selectedDate }));
                      }
                    }}
                  />
                  <small className="text-muted" style={{ fontSize: '1rem', display: 'block', marginTop: '0.5rem', lineHeight: '1.5' }}>
                    Select any date within the current month to set the payment due day. This day will be used monthly for automated billing reminders sent at 9:00 AM.
                  </small>
                  {data.group?.paymentDueDay && (
                    <div className="config-success-box">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>✓</span>
                        <small className="config-success-text" style={{ fontSize: '1.05rem' }}>
                          Automated payment reminders are scheduled for the {data.group.paymentDueDay}{data.group.paymentDueDay === 1 ? 'st' : data.group.paymentDueDay === 2 ? 'nd' : data.group.paymentDueDay === 3 ? 'rd' : 'th'} of each month at 9:00 AM
                        </small>
                      </div>
                      {(() => {
                        const today = new Date();
                        const currentDay = today.getDate();
                        const dueDay = data.group.paymentDueDay;
                        let nextReminderDate;
                        
                        if (currentDay < dueDay) {
                          nextReminderDate = new Date(today.getFullYear(), today.getMonth(), dueDay);
                        } else {
                          nextReminderDate = new Date(today.getFullYear(), today.getMonth() + 1, dueDay);
                        }
                        
                        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                        const nextDateStr = `${monthNames[nextReminderDate.getMonth()]} ${nextReminderDate.getDate()}, ${nextReminderDate.getFullYear()}`;
                        
                        return (
                          <small className="config-success-detail">
                            Next reminder: {nextDateStr} at 9:00 AM
                          </small>
                        );
                      })()}
                    </div>
                  )}
                </label>
                <button
                  type="button"
                  className="btn btn--primary btn-config"
                  onClick={handleUpdatePaymentDueDay}
                  disabled={!groupSettings.paymentDueDate}
                >
                  💾 Update Date
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Payment Reminders Tab */}
      {activeTab === 'reminders' && (
        <section className="card">
          <div className="card__header">
            <h3>📨 Payment Reminder Management</h3>
            <p className="text-muted" style={{ fontSize: '1.1rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
              Distribute SMS payment notifications to team members with outstanding balances for the selected billing period
            </p>
          </div>
          <div className="grid form-grid" style={{ maxWidth: '800px' }}>
            <label>
              Billing Period
              <input
                type="month"
                value={reminderMonth}
                onChange={(e) => setReminderMonth(e.target.value)}
                required
              />
              <small className="text-muted" style={{ fontSize: '1rem', display: 'block', marginTop: '0.5rem', lineHeight: '1.5' }}>
                Select the billing period for which payment reminders should be distributed
              </small>
            </label>
            <label className="full-width">
              Custom Message (Optional)
              <textarea
                rows={4}
                placeholder="Optional: Customize the reminder message. If left blank, the system will use the default template containing member name, total due, payments received, and outstanding balance."
                value={reminderMessage}
                onChange={(e) => setReminderMessage(e.target.value)}
              />
            </label>
            <div className="config-form-actions">
              <button
                className="btn btn--primary"
                type="button"
                onClick={handleSendGroupReminders}
                disabled={sendingReminders || !reminderMonth}
                style={{ minWidth: '200px' }}
              >
                {sendingReminders ? '📤 Sending...' : '📤 Send Payment Reminders'}
              </button>
            </div>
          </div>
          {reminderResult && (
            <div className={`reminder-result-box ${reminderResult.success ? 'reminder-result-box--success' : 'reminder-result-box--error'}`}>
              <p className={`reminder-result-title ${reminderResult.success ? 'reminder-result-title--success' : 'reminder-result-title--error'}`}>
                {reminderResult.success
                  ? `✓ Successfully sent ${reminderResult.sent} reminder${reminderResult.sent !== 1 ? 's' : ''} for ${reminderResult.month}`
                  : '✗ Failed to send reminders'}
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
      )}

      {/* Team Members Tab */}
      {activeTab === 'players' && (
        <div className="grid" style={{ gap: '1.5rem' }}>
          <section className="card">
            <div className="card__header">
              <h3>➕ Add Team Member</h3>
              <p className="text-muted" style={{ fontSize: '1.1rem', marginTop: '0.5rem', lineHeight: '1.6' }}>
                Enroll a new team member to this training group. A secure account with login credentials will be automatically created upon registration.
              </p>
            </div>
            <form className="grid form-grid" onSubmit={handleSubmit}>
              <label>
                Full Name
                <input 
                  name="fullName" 
                  value={form.fullName} 
                  onChange={handleChange} 
                  required 
                  placeholder="Enter team member's complete legal name"
                />
              </label>
              <label>
                Phone Number
                <input 
                  name="phone" 
                  value={form.phone} 
                  onChange={handleChange} 
                  required 
                  maxLength={20}
                  placeholder="e.g., 0526867838 or +972526867838"
                />
                <small className="text-muted" style={{ fontSize: '1rem', marginTop: '0.25rem', display: 'block', lineHeight: '1.5' }}>
                  This number will be used for automated SMS payment notifications and communication
                </small>
              </label>
              <label>
                Monthly Fee ($)
                <input
                  type="number"
                  name="monthlyFee"
                  value={form.monthlyFee}
                  onChange={handleChange}
                  placeholder={data.group?.defaultMonthlyFee ? `Default: $${data.group.defaultMonthlyFee.toFixed(2)}` : '0.00'}
                  required
                  min="0"
                  step="0.01"
                />
                {data.group?.defaultMonthlyFee && (
                  <small className="text-muted" style={{ fontSize: '1rem', marginTop: '0.25rem', display: 'block', lineHeight: '1.5' }}>
                    Default monthly fee for this group: ${data.group.defaultMonthlyFee.toFixed(2)}
                  </small>
                )}
              </label>
              <label className="full-width">
                Additional Notes
                <textarea 
                  name="notes" 
                  rows={3} 
                  value={form.notes} 
                  onChange={handleChange}
                  placeholder="Optional: Include additional details such as parent/guardian contact information, medical considerations, special accommodations, or other relevant notes"
                />
              </label>
              <button className="btn btn--primary btn-full-width" type="submit">
                ➕ Add Team Member
              </button>
            </form>
          </section>

          <section className="card">
            <div className="card__header">
              <h3>👥 Team Members ({data.players.length})</h3>
              {loading && <span className="text-muted">Loading team members...</span>}
            </div>
            {error && <p className="error-text">{error}</p>}
            {!data.players.length && !loading ? (
              <div className="empty-state">
                <p className="text-muted empty-state-title">No team members enrolled in this group</p>
                <p className="text-muted empty-state-subtitle">Begin by registering your first team member using the enrollment form above.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Full Name</th>
                      <th>Username</th>
                      <th>Password</th>
                      <th>Phone Number</th>
                      <th>Monthly Fee</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.players.map((player) => (
                      <tr key={player._id}>
                        <td className="table-cell-bold">{player.fullName}</td>
                        <td>
                          {player.username ? (
                            <code className="credential-badge--username">{player.username}</code>
                          ) : (
                            <span className="text-muted text-small-italic">No username assigned</span>
                          )}
                        </td>
                        <td>
                          {player.displayPassword ? (
                            <code className="credential-badge--password">{player.displayPassword}</code>
                          ) : (
                            <span className="text-muted text-small-italic">No password set</span>
                          )}
                        </td>
                        <td className="table-cell-monospace">{player.phone}</td>
                        <td className="table-cell-bold">${parseFloat(player.monthlyFee).toFixed(2)}</td>
                        <td>
                          <Link className="btn btn--secondary btn-small" to={`/coach/players/${player._id}`}>
                            View Details
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="delete-modal-overlay">
          <section className="delete-modal-content">
            <h3 className="delete-modal-title">
              ⚠️ Delete Training Group
            </h3>
            <p className="delete-modal-body">
              Are you sure you want to delete <strong>"{data.group?.name || 'this group'}"</strong>? This will permanently delete:
            </p>
            <ul className="delete-modal-list">
              <li>The training group</li>
              <li>All team members ({data.players.length} {data.players.length === 1 ? 'member' : 'members'})</li>
              <li>All payment records</li>
              <li>All attendance records</li>
            </ul>
            <p className="delete-modal-warning">
              ⚠️ This action cannot be undone!
            </p>
            <div className="delete-modal-actions">
              <button
                className="btn btn--outline"
                type="button"
                onClick={handleCancelDelete}
                disabled={deletingGroup}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                type="button"
                onClick={handleDeleteGroup}
                disabled={deletingGroup}
              >
                {deletingGroup ? 'Deleting...' : 'Delete Group'}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default GroupDetailsPage;