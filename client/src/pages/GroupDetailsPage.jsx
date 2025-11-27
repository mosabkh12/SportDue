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
  const [groupSettings, setGroupSettings] = useState({ 
    paymentDueDate: '', 
    defaultMonthlyFee: ''
  });
  const [updatingFee, setUpdatingFee] = useState(false);
  const [reminderMonth, setReminderMonth] = useState('');
  const [reminderMessage, setReminderMessage] = useState('');
  const [sendingReminders, setSendingReminders] = useState(false);
  const [reminderResult, setReminderResult] = useState(null);
  const [newPlayerCredentials, setNewPlayerCredentials] = useState(null);
  const [resetPasswordCredentials, setResetPasswordCredentials] = useState(null);
  const [resettingPassword, setResettingPassword] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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
      notifications.success('Team member successfully enrolled. Account credentials have been generated.');
      // Refresh to show the new player with credentials
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
      notifications.success('Password successfully reset. New account credentials have been generated.');
      // Refresh to show updated credentials
      setTimeout(() => {
        fetchDetails();
      }, 500);
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to reset password';
      handleApiError(err, (msg) => setError(msg || errorMessage));
      notifications.error(errorMessage);
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
        <div style={{ flex: 1 }}>
          <p className="eyebrow">Training Group</p>
          <h2>{data.group?.name || 'Training Group'}</h2>
          <p className="text-muted">
            {data.group?.description || 'Comprehensive management dashboard for team roster, financial tracking, and attendance monitoring.'}
          </p>
        </div>
        <Link className="btn btn--primary" to={`/coach/groups/${groupId}/attendance`} style={{ whiteSpace: 'nowrap' }}>
          📅 Manage Attendance
        </Link>
      </section>

      {/* Tab Navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '0.25rem', 
        marginBottom: '2rem', 
        backgroundColor: 'rgba(17, 24, 39, 0.4)',
        borderRadius: '12px',
        padding: '0.5rem',
        border: '1px solid rgba(55, 65, 81, 0.5)',
        overflowX: 'auto',
        scrollbarWidth: 'thin'
      }}>
        <button
          onClick={() => setActiveTab('overview')}
          className="btn"
          style={{
            padding: '0.875rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'overview' 
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(99, 102, 241, 0.25))' 
              : 'transparent',
            background: activeTab === 'overview' 
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(99, 102, 241, 0.25))' 
              : 'transparent',
            color: activeTab === 'overview' ? '#93c5fd' : 'rgba(255, 255, 255, 0.7)',
            fontWeight: activeTab === 'overview' ? '700' : '500',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
            fontSize: '0.95rem',
            position: 'relative',
            boxShadow: activeTab === 'overview' 
              ? '0 4px 12px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
              : 'none',
            transform: activeTab === 'overview' ? 'translateY(-1px)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'overview') {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'overview') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            }
          }}
        >
          <span style={{ marginRight: '0.5rem', fontSize: '1.1rem' }}>📊</span>
          Overview
        </button>
        <button
          onClick={() => setActiveTab('configuration')}
          className="btn"
          style={{
            padding: '0.875rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'configuration' 
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(99, 102, 241, 0.25))' 
              : 'transparent',
            background: activeTab === 'configuration' 
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(99, 102, 241, 0.25))' 
              : 'transparent',
            color: activeTab === 'configuration' ? '#93c5fd' : 'rgba(255, 255, 255, 0.7)',
            fontWeight: activeTab === 'configuration' ? '700' : '500',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
            fontSize: '0.95rem',
            boxShadow: activeTab === 'configuration' 
              ? '0 4px 12px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
              : 'none',
            transform: activeTab === 'configuration' ? 'translateY(-1px)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'configuration') {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'configuration') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            }
          }}
        >
          <span style={{ marginRight: '0.5rem', fontSize: '1.1rem' }}>⚙️</span>
          Configuration
        </button>
        <button
          onClick={() => setActiveTab('reminders')}
          className="btn"
          style={{
            padding: '0.875rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'reminders' 
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(99, 102, 241, 0.25))' 
              : 'transparent',
            background: activeTab === 'reminders' 
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(99, 102, 241, 0.25))' 
              : 'transparent',
            color: activeTab === 'reminders' ? '#93c5fd' : 'rgba(255, 255, 255, 0.7)',
            fontWeight: activeTab === 'reminders' ? '700' : '500',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
            fontSize: '0.95rem',
            boxShadow: activeTab === 'reminders' 
              ? '0 4px 12px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
              : 'none',
            transform: activeTab === 'reminders' ? 'translateY(-1px)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'reminders') {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'reminders') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            }
          }}
        >
          <span style={{ marginRight: '0.5rem', fontSize: '1.1rem' }}>📨</span>
          Payment Reminders
        </button>
        <button
          onClick={() => setActiveTab('players')}
          className="btn"
          style={{
            padding: '0.875rem 1.5rem',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: activeTab === 'players' 
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(99, 102, 241, 0.25))' 
              : 'transparent',
            background: activeTab === 'players' 
              ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(99, 102, 241, 0.25))' 
              : 'transparent',
            color: activeTab === 'players' ? '#93c5fd' : 'rgba(255, 255, 255, 0.7)',
            fontWeight: activeTab === 'players' ? '700' : '500',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            whiteSpace: 'nowrap',
            fontSize: '0.95rem',
            boxShadow: activeTab === 'players' 
              ? '0 4px 12px rgba(59, 130, 246, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)' 
              : 'none',
            transform: activeTab === 'players' ? 'translateY(-1px)' : 'none'
          }}
          onMouseEnter={(e) => {
            if (activeTab !== 'players') {
              e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.1)';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)';
            }
          }}
          onMouseLeave={(e) => {
            if (activeTab !== 'players') {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = 'rgba(255, 255, 255, 0.7)';
            }
          }}
        >
          <span style={{ marginRight: '0.5rem', fontSize: '1.1rem' }}>👥</span>
          Team Members ({data.players.length})
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          {/* Quick Stats */}
          <section className="card">
            <div className="card__header">
              <h3>📊 Group Overview</h3>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                Quick overview of your training group statistics and key information
              </p>
            </div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem',
              marginTop: '1rem'
            }}>
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                transition: 'transform 0.2s ease'
              }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#3b82f6', marginBottom: '0.5rem' }}>
                  {data.players.length}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  Active Members
                </div>
              </div>
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'rgba(34, 197, 94, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(34, 197, 94, 0.3)'
              }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#22c55e', marginBottom: '0.5rem' }}>
                  ${data.group?.defaultMonthlyFee ? data.group.defaultMonthlyFee.toFixed(2) : '0.00'}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                  Default Monthly Fee
                </div>
              </div>
              <div style={{
                padding: '1.5rem',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(245, 158, 11, 0.3)'
              }}>
                <div style={{ fontSize: '2.5rem', fontWeight: '700', color: '#f59e0b', marginBottom: '0.5rem' }}>
                  {data.group?.paymentDueDay || 'N/A'}
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
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
            <div style={{ display: 'grid', gap: '1rem' }}>
              {data.group?.description && (
                <div style={{ 
                  padding: '1.5rem', 
                  backgroundColor: 'rgba(99, 102, 241, 0.05)', 
                  borderRadius: '12px', 
                  border: '1px solid rgba(99, 102, 241, 0.2)'
                }}>
                  <div style={{ fontWeight: '600', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
                    Description
                  </div>
                  <p className="text-muted" style={{ margin: 0, fontSize: '0.95rem', lineHeight: '1.6' }}>
                    {data.group.description}
                  </p>
                </div>
              )}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '1rem'
              }}>
                <div style={{ 
                  padding: '1.25rem', 
                  backgroundColor: 'rgba(17, 24, 39, 0.4)', 
                  borderRadius: '10px',
                  border: '1px solid rgba(55, 65, 81, 0.5)'
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Default Monthly Fee
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    ${data.group?.defaultMonthlyFee ? data.group.defaultMonthlyFee.toFixed(2) : '0.00'}
                  </div>
                </div>
                <div style={{ 
                  padding: '1.25rem', 
                  backgroundColor: 'rgba(17, 24, 39, 0.4)', 
                  borderRadius: '10px',
                  border: '1px solid rgba(55, 65, 81, 0.5)'
                }}>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', fontWeight: '600' }}>
                    Payment Due Day
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-primary)' }}>
                    {data.group?.paymentDueDay ? `${data.group.paymentDueDay}${data.group.paymentDueDay === 1 ? 'st' : data.group.paymentDueDay === 2 ? 'nd' : data.group.paymentDueDay === 3 ? 'rd' : 'th'}` : 'Not Set'} of Each Month
                  </div>
                  {data.group?.paymentDueDay && (
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255, 255, 255, 0.6)', marginTop: '0.5rem' }}>
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
            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
              Configure billing parameters and automated notification schedules for your training group
            </p>
          </div>
          
          <div style={{ display: 'grid', gap: '2rem' }}>
            <div
              style={{
                padding: '1.5rem',
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                💰 Default Monthly Fee
              </h4>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <label style={{ flex: '1', minWidth: '250px' }}>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={groupSettings.defaultMonthlyFee}
                    onChange={(e) => {
                      setGroupSettings((prev) => ({ ...prev, defaultMonthlyFee: e.target.value }));
                    }}
                    placeholder="0.00"
                    style={{ width: '100%' }}
                  />
                  <small className="text-muted" style={{ fontSize: '0.85rem', display: 'block', marginTop: '0.5rem' }}>
                    This amount will serve as the default monthly fee when registering new team members
                  </small>
                </label>
                <button
                  className="btn btn--primary"
                  type="button"
                  onClick={handleUpdateDefaultFee}
                  disabled={updatingFee || parseFloat(groupSettings.defaultMonthlyFee || 0) === parseFloat(data.group?.defaultMonthlyFee || 0)}
                  style={{ whiteSpace: 'nowrap', minWidth: '140px' }}
                >
                  {updatingFee ? 'Updating...' : '💾 Update Fee'}
                </button>
              </div>
            </div>

            <div
              style={{
                padding: '1.5rem',
                backgroundColor: 'rgba(99, 102, 241, 0.05)',
                borderRadius: '12px',
                border: '1px solid rgba(99, 102, 241, 0.2)',
              }}
            >
              <h4 style={{ fontSize: '1.125rem', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📅 Payment Due Date
              </h4>
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <label style={{ flex: '1', minWidth: '250px' }}>
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
                    style={{ width: '100%' }}
                  />
                  <small className="text-muted" style={{ fontSize: '0.85rem', display: 'block', marginTop: '0.5rem' }}>
                    Select any date within the current month to set the payment due day. This day will be used monthly for automated billing reminders sent at 9:00 AM.
                  </small>
                  {data.group?.paymentDueDay && (
                    <div style={{ 
                      marginTop: '1rem', 
                      padding: '1rem', 
                      background: 'rgba(34, 197, 94, 0.1)', 
                      borderRadius: '10px',
                      border: '1px solid rgba(34, 197, 94, 0.3)'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                        <span style={{ fontSize: '1.2rem' }}>✓</span>
                        <small style={{ color: '#22c55e', fontWeight: '600', fontSize: '0.9rem' }}>
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
                          <small style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem', marginLeft: '1.75rem' }}>
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
                  disabled={!groupSettings.paymentDueDate}
                  style={{ whiteSpace: 'nowrap', minWidth: '140px' }}
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
            <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
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
              <small className="text-muted" style={{ fontSize: '0.85rem', display: 'block', marginTop: '0.5rem' }}>
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
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
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
            <div
              style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                borderRadius: '12px',
                backgroundColor: reminderResult.success
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(239, 68, 68, 0.1)',
                border: `2px solid ${reminderResult.success ? '#10b981' : '#ef4444'}`,
              }}
            >
              <p style={{ fontWeight: '700', color: reminderResult.success ? '#10b981' : '#ef4444', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
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
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <section className="card">
            <div className="card__header">
              <h3>➕ Add Team Member</h3>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
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
                <small className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
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
                  <small className="text-muted" style={{ fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
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
              <button className="btn btn--primary" type="submit" style={{ gridColumn: '1 / -1' }}>
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
              <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>No team members enrolled in this group</p>
                <p className="text-muted" style={{ fontSize: '0.9rem' }}>Begin by registering your first team member using the enrollment form above.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
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
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{player.fullName}</td>
                        <td>
                          {player.username ? (
                            <code style={{ 
                              padding: '0.5rem 0.75rem', 
                              background: 'rgba(34, 197, 94, 0.15)',
                              borderRadius: '8px',
                              fontSize: '0.9rem',
                              fontFamily: "'Monaco', 'Courier New', monospace",
                              display: 'inline-block',
                              fontWeight: '600',
                              color: '#22c55e',
                              border: '1px solid rgba(34, 197, 94, 0.3)',
                              letterSpacing: '0.05em'
                            }}>{player.username}</code>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>No username assigned</span>
                          )}
                        </td>
                        <td>
                          {player.displayPassword ? (
                            <code style={{ 
                              padding: '0.5rem 0.75rem', 
                              background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.3), rgba(251, 191, 36, 0.3))',
                              borderRadius: '8px',
                              fontSize: '0.9rem',
                              fontFamily: "'Monaco', 'Courier New', monospace",
                              display: 'inline-block',
                              fontWeight: '700',
                              color: '#fbbf24',
                              border: '2px solid rgba(245, 158, 11, 0.5)',
                              letterSpacing: '0.05em',
                              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.2)'
                            }}>{player.displayPassword}</code>
                          ) : (
                            <span className="text-muted" style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>No password set</span>
                          )}
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}>{player.phone}</td>
                        <td style={{ fontWeight: '600', color: 'var(--text-primary)' }}>${parseFloat(player.monthlyFee).toFixed(2)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                            <Link className="btn btn--secondary" to={`/coach/players/${player._id}`} style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
                              View Details
                            </Link>
                            <button
                              className="btn btn--outline"
                              type="button"
                              onClick={() => handleResetPassword(player._id)}
                              disabled={resettingPassword === player._id}
                              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                            >
                              {resettingPassword === player._id ? 'Resetting...' : 'Reset Password'}
                            </button>
                          </div>
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

      {/* Credentials Modals */}
      {newPlayerCredentials && (
        <section className="card success-banner">
          <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>✓ Team Member Successfully Registered</h3>
          <p style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '1rem' }}>Account credentials have been automatically generated. Please securely store these credentials immediately, as the password will not be displayed again after closing this dialog:</p>
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
            ⚠️ Important: Please copy and securely share these credentials with the team member. The password will not be accessible after closing this notification.
          </p>
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => setNewPlayerCredentials(null)}
          >
            Acknowledge & Close
          </button>
        </section>
      )}

      {resetPasswordCredentials && (
        <section className="card success-banner">
          <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>✓ Password Successfully Reset</h3>
          <p style={{ fontWeight: '600', color: 'rgba(255, 255, 255, 0.9)', marginBottom: '1rem' }}>New account credentials have been automatically generated. Please securely store these credentials immediately, as the password will not be displayed again after closing this dialog:</p>
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
            ⚠️ Security Notice: Please copy these credentials immediately and share them securely with the team member through a private channel. Once this notification is closed, the password cannot be retrieved.
          </p>
          <button
            className="btn btn--primary"
            type="button"
            onClick={() => setResetPasswordCredentials(null)}
          >
            Acknowledge & Close
          </button>
        </section>
      )}
    </div>
  );
};

export default GroupDetailsPage;