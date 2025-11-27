import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import { useNotifications } from '../context/NotificationContext';
import { handleApiError } from '../utils/errorHandler';

const AttendancePage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [date, setDate] = useState(today);
  const [players, setPlayers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);
  const [group, setGroup] = useState(null);
  const [trainingDays, setTrainingDays] = useState([]);
  const [trainingTime, setTrainingTime] = useState(null);
  const [trainingSchedule, setTrainingSchedule] = useState({ 
    trainingDays: [],
    trainingTime: { startTime: '18:00', endTime: '19:30' }
  });
  const [updatingSchedule, setUpdatingSchedule] = useState(false);
  const [showScheduleConfig, setShowScheduleConfig] = useState(false);
  const notifications = useNotifications();

  const fetchPlayers = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/groups/${groupId}`);
      setPlayers(data.players || []);
      setGroup(data.group);
      setTrainingDays(data.group?.trainingDays || []);
      setTrainingTime(data.group?.trainingTime || null);
      setTrainingSchedule({
        trainingDays: data.group?.trainingDays || [],
        trainingTime: data.group?.trainingTime || { startTime: '18:00', endTime: '19:30' }
      });
    } catch (err) {
      setNotice(err.message);
    }
  }, [groupId]);

  const fetchAttendance = useCallback(async (targetDate) => {
    try {
      const { data } = await apiClient.get(`/attendance/group/${groupId}`, {
        params: { date: targetDate },
      });
      const mapped = {};
      data.forEach((item) => {
        mapped[item.playerId] = {
          status: item.isPresent ? 'present' : 'absent',
          isPresent: item.isPresent,
          signature: item.signature || '',
        };
      });
      setAttendance(mapped);
    } catch (err) {
      setNotice(err.message);
    }
  }, [groupId]);

  useEffect(() => {
    fetchPlayers();
  }, [fetchPlayers]);

  useEffect(() => {
    fetchAttendance(date);
  }, [date, fetchAttendance]);

  const handleStatusChange = (playerId, value) => {
    setAttendance((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        status: value === '' ? null : value,
        isPresent: value === 'present',
      },
    }));
  };

  const handleSignatureChange = (playerId, value) => {
    setAttendance((prev) => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        signature: value,
      },
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setNotice(null);
    setSuccessMessage(null);
    try {
      // Only save players with an explicit status (present or absent)
      const entries = players
        .filter((player) => {
          const playerAttendance = attendance[player._id];
          return playerAttendance?.status === 'present' || playerAttendance?.status === 'absent';
        })
        .map((player) => ({
          playerId: player._id,
          isPresent: attendance[player._id]?.status === 'present',
          signature: attendance[player._id]?.signature || '',
        }));

      if (entries.length === 0) {
        setNotice('Please select status (Present or Absent) for at least one player.');
        setLoading(false);
        return;
      }

      await apiClient.post('/attendance/mark', {
        groupId,
        date,
        records: entries,
      });
      setSuccessMessage('Attendance saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setNotice(err.message || 'Failed to save attendance');
    } finally {
      setLoading(false);
    }
  };

  // Calculate attendance statistics (only count players with explicit status)
  const stats = useMemo(() => {
    const withStatus = players.filter((p) => {
      const status = attendance[p._id]?.status;
      return status === 'present' || status === 'absent';
    });
    const present = players.filter((p) => attendance[p._id]?.status === 'present').length;
    const absent = players.filter((p) => attendance[p._id]?.status === 'absent').length;
    const unmarked = players.length - withStatus.length;
    const percentage = withStatus.length > 0 ? Math.round((present / withStatus.length) * 100) : 0;
    return { present, absent, unmarked, total: players.length, withStatus: withStatus.length, percentage };
  }, [players, attendance]);

  // Filter players by search query
  const filteredPlayers = useMemo(() => {
    if (!searchQuery.trim()) return players;
    const query = searchQuery.toLowerCase();
    return players.filter((p) => p.fullName.toLowerCase().includes(query));
  }, [players, searchQuery]);

  // Quick actions
  const markAllPresent = () => {
    const updated = {};
    players.forEach((player) => {
      updated[player._id] = {
        status: 'present',
        isPresent: true,
        signature: attendance[player._id]?.signature || '',
      };
    });
    setAttendance(updated);
  };

  const markAllAbsent = () => {
    const updated = {};
    players.forEach((player) => {
      updated[player._id] = {
        status: 'absent',
        isPresent: false,
        signature: attendance[player._id]?.signature || '',
      };
    });
    setAttendance(updated);
  };

  // Check if a date falls on a scheduled training day
  const isTrainingDay = (dateString) => {
    if (trainingDays.length === 0) return true; // If no schedule set, all days are valid
    const checkDate = new Date(dateString);
    const dayOfWeek = checkDate.getDay(); // 0 = Sunday, 6 = Saturday
    return trainingDays.includes(dayOfWeek);
  };

  // Navigate to next/previous training day
  const navigateToTrainingDay = (direction) => {
    const currentDate = new Date(date);
    let daysToAdd = direction === 'next' ? 1 : -1;
    let attempts = 0;
    const maxAttempts = 14; // Prevent infinite loop
    
    while (attempts < maxAttempts) {
      currentDate.setDate(currentDate.getDate() + daysToAdd);
      const dateString = currentDate.toISOString().split('T')[0];
      
      if (trainingDays.length === 0 || isTrainingDay(dateString)) {
        setDate(dateString);
        return;
      }
      
      attempts++;
    }
    
    // Fallback: just navigate by days if can't find training day
    navigateDate(direction === 'next' ? 1 : -1);
  };

  // Quick date navigation
  const navigateDate = (days) => {
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() + days);
    setDate(currentDate.toISOString().split('T')[0]);
  };

  const setDateToday = () => setDate(today);


  // Get next scheduled training day from today
  const getNextTrainingDay = () => {
    if (trainingDays.length === 0) return null;
    const today = new Date();
    let checkDate = new Date(today);
    
    for (let i = 0; i < 7; i++) {
      const dayOfWeek = checkDate.getDay();
      if (trainingDays.includes(dayOfWeek)) {
        return checkDate.toISOString().split('T')[0];
      }
      checkDate.setDate(checkDate.getDate() + 1);
    }
    return null;
  };


  const handleUpdateTrainingSchedule = async () => {
    if (trainingSchedule.trainingDays.length === 0) {
      notifications.error('Please select at least one training day');
      return;
    }
    
    setUpdatingSchedule(true);
    try {
      await apiClient.put(`/groups/${groupId}`, {
        trainingDays: trainingSchedule.trainingDays,
        trainingTime: trainingSchedule.trainingTime,
      });
      const dayNames = trainingSchedule.trainingDays.map(d => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]);
      notifications.success(`Training schedule updated: ${dayNames.join(', ')} from ${trainingSchedule.trainingTime.startTime} to ${trainingSchedule.trainingTime.endTime}`);
      
      // Refresh data
      fetchPlayers();
      setTrainingDays(trainingSchedule.trainingDays);
      setTrainingTime(trainingSchedule.trainingTime);
      setShowScheduleConfig(false);
    } catch (err) {
      handleApiError(err, setNotice);
      notifications.error(err.response?.data?.message || err.message || 'Failed to update training schedule');
    } finally {
      setUpdatingSchedule(false);
    }
  };

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="btn btn--outline"
            type="button"
            style={{
              marginBottom: '1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1rem',
              fontSize: '0.9rem',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '8px',
              color: 'rgba(255, 255, 255, 0.9)',
              transition: 'all 0.2s ease',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'translateX(-2px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.transform = 'translateX(0)';
            }}
          >
            <span>←</span>
            <span>Back</span>
          </button>
          <p className="eyebrow">Attendance</p>
          <h2>Group roll call</h2>
          <p className="text-muted">Pick a date, mark presence, and add quick signatures.</p>
        </div>
      </section>

      <section className="card">
        <div className="card__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <h3>Training Schedule & Date Selection</h3>
            {trainingDays.length > 0 && (
              <div style={{ marginTop: '0.5rem' }}>
                <p className="text-muted" style={{ fontSize: '0.9rem', marginBottom: '0.25rem', fontWeight: '600' }}>
                  📅 Training Days: {trainingDays.map(d => ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d]).join(', ')}
                </p>
                {trainingTime && (
                  <p className="text-muted" style={{ fontSize: '0.85rem', color: 'rgba(59, 130, 246, 0.9)' }}>
                    ⏰ Session Time: {trainingTime.startTime || '18:00'} - {trainingTime.endTime || '19:30'}
                  </p>
                )}
              </div>
            )}
            {trainingDays.length === 0 && (
              <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>
                ⚠️ No training schedule configured. Click "Configure Schedule" to set training days and session times.
              </p>
            )}
          </div>
          <button
            type="button"
            className="btn btn--outline"
            onClick={() => setShowScheduleConfig(!showScheduleConfig)}
            style={{ whiteSpace: 'nowrap' }}
          >
            {showScheduleConfig ? '✕ Close Configuration' : '⚙️ Configure Schedule'}
          </button>
        </div>

        {showScheduleConfig && (
          <div
            style={{
              marginTop: '1.5rem',
              padding: '1.5rem',
              backgroundColor: 'rgba(59, 130, 246, 0.08)',
              borderRadius: '12px',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)',
            }}
          >
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ 
                fontSize: '1.125rem', 
                fontWeight: '700', 
                color: 'var(--text-primary)', 
                marginBottom: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>📅</span>
                Configure Training Schedule
              </h4>
              <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.25rem' }}>
                Select the days of the week and times when training sessions occur. This enables smart navigation between training days.
              </p>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                Training Days
              </label>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                gap: '0.75rem',
                padding: '1rem',
                backgroundColor: 'rgba(17, 24, 39, 0.4)',
                borderRadius: '10px',
                border: '1px solid rgba(55, 65, 81, 0.5)'
              }}>
                {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day, index) => {
                  const isSelected = trainingSchedule.trainingDays.includes(index);
                  return (
                    <label
                      key={index}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1rem',
                        borderRadius: '8px',
                        border: `2px solid ${isSelected ? '#3b82f6' : 'rgba(107, 114, 128, 0.4)'}`,
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                        fontWeight: isSelected ? '700' : '500',
                        color: isSelected ? '#60a5fa' : 'var(--text-secondary)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)';
                          e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.currentTarget.style.borderColor = 'rgba(107, 114, 128, 0.4)';
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTrainingSchedule(prev => ({
                              ...prev,
                              trainingDays: [...prev.trainingDays, index].sort((a, b) => a - b)
                            }));
                          } else {
                            setTrainingSchedule(prev => ({
                              ...prev,
                              trainingDays: prev.trainingDays.filter(d => d !== index)
                            }));
                          }
                        }}
                        style={{ 
                          cursor: 'pointer',
                          width: '18px',
                          height: '18px',
                          accentColor: '#3b82f6'
                        }}
                      />
                      <span style={{ fontSize: '0.9rem' }}>{day.substring(0, 3)}</span>
                      {isSelected && (
                        <span style={{ 
                          position: 'absolute', 
                          top: '4px', 
                          right: '4px',
                          fontSize: '0.75rem',
                          color: '#3b82f6'
                        }}>✓</span>
                      )}
                    </label>
                  );
                })}
              </div>
              {trainingSchedule.trainingDays.length > 0 && (
                <div style={{ 
                  marginTop: '0.75rem', 
                  padding: '0.75rem', 
                  backgroundColor: 'rgba(34, 197, 94, 0.1)', 
                  borderRadius: '8px',
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}>
                  <small style={{ color: '#22c55e', fontWeight: '600', fontSize: '0.85rem' }}>
                    ✓ {trainingSchedule.trainingDays.length} {trainingSchedule.trainingDays.length === 1 ? 'day' : 'days'} selected: {trainingSchedule.trainingDays.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
                  </small>
                </div>
              )}
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              <label style={{ display: 'block' }}>
                <div style={{ marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  Start Time
                </div>
                <input
                  type="time"
                  value={trainingSchedule.trainingTime.startTime}
                  onChange={(e) => {
                    setTrainingSchedule(prev => ({
                      ...prev,
                      trainingTime: { ...prev.trainingTime, startTime: e.target.value }
                    }));
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(55, 65, 81, 0.5)',
                    backgroundColor: 'rgba(17, 24, 39, 0.6)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                />
              </label>
              <label style={{ display: 'block' }}>
                <div style={{ marginBottom: '0.5rem', fontWeight: '600', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  End Time
                </div>
                <input
                  type="time"
                  value={trainingSchedule.trainingTime.endTime}
                  onChange={(e) => {
                    setTrainingSchedule(prev => ({
                      ...prev,
                      trainingTime: { ...prev.trainingTime, endTime: e.target.value }
                    }));
                  }}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(55, 65, 81, 0.5)',
                    backgroundColor: 'rgba(17, 24, 39, 0.6)',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontWeight: '600'
                  }}
                />
              </label>
            </div>

            <button
              className="btn btn--primary"
              type="button"
              onClick={handleUpdateTrainingSchedule}
              disabled={
                updatingSchedule || 
                (JSON.stringify(trainingSchedule.trainingDays.sort()) === JSON.stringify((group?.trainingDays || []).sort()) &&
                 JSON.stringify(trainingSchedule.trainingTime) === JSON.stringify(group?.trainingTime || { startTime: '18:00', endTime: '19:30' })) ||
                trainingSchedule.trainingDays.length === 0
              }
              style={{ 
                width: '100%',
                padding: '0.875rem 1.5rem',
                fontSize: '1rem',
                fontWeight: '600',
                borderRadius: '8px',
                boxShadow: trainingSchedule.trainingDays.length > 0 ? '0 4px 12px rgba(59, 130, 246, 0.3)' : 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {updatingSchedule ? 'Saving Schedule...' : '💾 Save Training Schedule'}
            </button>
          </div>
        )}
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap', marginTop: '1.5rem' }}>
          <label style={{ flex: '1', minWidth: '200px' }}>
            Date
            <input 
              type="date" 
              value={date} 
              onChange={(event) => setDate(event.target.value)}
              style={{
                borderColor: isTrainingDay(date) ? '#3b82f6' : trainingDays.length > 0 ? '#ef4444' : 'rgba(55, 65, 81, 0.5)',
                borderWidth: '2px'
              }}
            />
            {!isTrainingDay(date) && trainingDays.length > 0 && (
              <small style={{ color: '#ef4444', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                ⚠️ This date is not a scheduled training day
              </small>
            )}
            {isTrainingDay(date) && trainingDays.length > 0 && (
              <small style={{ color: '#3b82f6', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                ✓ Scheduled training day
              </small>
            )}
          </label>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {trainingDays.length > 0 ? (
              <>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => navigateToTrainingDay('prev')}
                  title="Previous training day"
                >
                  ← Previous Session
                </button>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={setDateToday}
                  title="Today"
                >
                  Today
                </button>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => navigateToTrainingDay('next')}
                  title="Next training day"
                >
                  Next Session →
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => navigateDate(-1)}
                  title="Previous day"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={setDateToday}
                  title="Today"
                >
                  Today
                </button>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={() => navigateDate(1)}
                  title="Next day"
                >
                  →
                </button>
              </>
            )}
          </div>
        </div>
        {notice && <p className="error-text" style={{ marginTop: '1rem' }}>{notice}</p>}
        {successMessage && (
          <p
            style={{
              marginTop: '1rem',
              color: '#10b981',
              fontWeight: '600',
              backgroundColor: '#d1fae5',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid #10b981',
            }}
          >
            ✓ {successMessage}
          </p>
        )}
      </section>

      <section className="grid stats-grid" style={{ marginBottom: '1rem' }}>
        <div className="card stat-card" style={{ borderTopColor: '#10b981' }}>
          <p className="stat-card__label">Present</p>
          <p className="stat-card__value" style={{ color: '#10b981' }}>
            {stats.present}
          </p>
        </div>
        <div className="card stat-card" style={{ borderTopColor: '#ef4444' }}>
          <p className="stat-card__label">Absent</p>
          <p className="stat-card__value" style={{ color: '#ef4444' }}>
            {stats.absent}
          </p>
        </div>
        <div className="card stat-card" style={{ borderTopColor: '#64748b' }}>
          <p className="stat-card__label">Unmarked</p>
          <p className="stat-card__value" style={{ color: '#64748b' }}>
            {stats.unmarked}
          </p>
        </div>
        <div className="card stat-card" style={{ borderTopColor: '#6366f1' }}>
          <p className="stat-card__label">Total players</p>
          <p className="stat-card__value">{stats.total}</p>
        </div>
        {stats.withStatus > 0 && (
          <div className="card stat-card" style={{ borderTopColor: '#f59e0b' }}>
            <p className="stat-card__label">Attendance rate</p>
            <p className="stat-card__value">{stats.percentage}%</p>
          </div>
        )}
      </section>

      <section className="card">
        <div className="card__header">
          <h3>Players</h3>
          {loading && <span className="text-muted">Saving...</span>}
        </div>
        {!players.length ? (
          <p className="text-muted">This group has no players yet.</p>
        ) : (
          <>
            <div
              style={{
                display: 'flex',
                gap: '1rem',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                alignItems: 'center',
              }}
            >
              <label style={{ flex: '1', minWidth: '250px' }}>
                Search players
                <input
                  type="text"
                  placeholder="Type to search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ width: '100%' }}
                />
              </label>
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={markAllPresent}
                  style={{ fontSize: '0.85rem' }}
                >
                  ✓ Mark all present
                </button>
                <button
                  type="button"
                  className="btn btn--outline"
                  onClick={markAllAbsent}
                  style={{ fontSize: '0.85rem' }}
                >
                  ✗ Mark all absent
                </button>
              </div>
            </div>

            {searchQuery && (
              <p className="text-muted" style={{ marginBottom: '1rem' }}>
                Showing {filteredPlayers.length} of {players.length} players
              </p>
            )}

            {!filteredPlayers.length ? (
              <p className="text-muted">No players found matching "{searchQuery}"</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th style={{ width: '180px' }}>Status</th>
                      <th>Signature / Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayers.map((player) => {
                      const status = attendance[player._id]?.status || '';
                      const isPresent = status === 'present';
                      const isAbsent = status === 'absent';
                      return (
                        <tr
                          key={player._id}
                          style={{
                            backgroundColor: isPresent
                              ? 'rgba(16, 185, 129, 0.05)'
                              : isAbsent
                              ? 'rgba(239, 68, 68, 0.05)'
                              : 'transparent',
                          }}
                        >
                          <td style={{ fontWeight: '600' }}>{player.fullName}</td>
                          <td>
                            <select
                              value={status}
                              onChange={(e) => handleStatusChange(player._id, e.target.value)}
                              style={{
                                width: '100%',
                                padding: '0.5rem',
                                borderRadius: '8px',
                                border: '1px solid #e2e8f0',
                                fontSize: '0.9rem',
                                backgroundColor: 'white',
                                color: status === 'present' ? '#10b981' : status === 'absent' ? '#ef4444' : '#64748b',
                                fontWeight: status ? '600' : '400',
                                cursor: 'pointer',
                              }}
                            >
                              <option value="">-- Select status --</option>
                              <option value="present">✓ Present</option>
                              <option value="absent">✗ Absent</option>
                            </select>
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="Signature or initials"
                              value={attendance[player._id]?.signature || ''}
                              onChange={(event) => handleSignatureChange(player._id, event.target.value)}
                              style={{ width: '100%' }}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
        <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            className="btn btn--primary"
            type="button"
            onClick={handleSave}
            disabled={loading || !players.length}
            style={{ minWidth: '180px' }}
          >
            {loading ? 'Saving...' : '💾 Save attendance'}
          </button>
        </div>
      </section>
    </div>
  );
};

export default AttendancePage;

