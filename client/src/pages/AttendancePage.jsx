import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import apiClient from '../services/apiClient';

const AttendancePage = () => {
  const { groupId } = useParams();
  const today = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [date, setDate] = useState(today);
  const [players, setPlayers] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [successMessage, setSuccessMessage] = useState(null);

  const fetchPlayers = useCallback(async () => {
    try {
      const { data } = await apiClient.get(`/groups/${groupId}`);
      setPlayers(data.players || []);
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

  // Quick date navigation
  const navigateDate = (days) => {
    const currentDate = new Date(date);
    currentDate.setDate(currentDate.getDate() + days);
    setDate(currentDate.toISOString().split('T')[0]);
  };

  const setDateToday = () => setDate(today);

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Attendance</p>
          <h2>Group roll call</h2>
          <p className="text-muted">Pick a date, mark presence, and add quick signatures.</p>
        </div>
      </section>

      <section className="card">
        <div className="card__header">
          <h3>Select date</h3>
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <label style={{ flex: '1', minWidth: '200px' }}>
            Date
            <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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

