import { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import StatCard from '../components/StatCard.jsx';

const AdminDashboard = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ username: '', email: '', password: '', phone: '', sportType: 'basketball' });
  const [creatingCoach, setCreatingCoach] = useState(false);
  const [editingCoach, setEditingCoach] = useState(null);
  const [editForm, setEditForm] = useState({ username: '', email: '', phone: '', sportType: 'basketball', password: '' });
  const [updatingCoach, setUpdatingCoach] = useState(false);
  const [deletingCoach, setDeletingCoach] = useState(null);
  const [expandedCoach, setExpandedCoach] = useState(null);
  const [coachDetails, setCoachDetails] = useState({});
  const [loadingDetails, setLoadingDetails] = useState({});

  const fetchCoaches = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/admin/coaches');
      setCoaches(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoaches();
  }, []);

  const totals = coaches.reduce(
    (acc, coach) => ({
      players: acc.players + coach.playerCount,
      groups: acc.groups + coach.groupCount,
      revenue: acc.revenue + coach.totalReceived,
      debt: acc.debt + coach.totalDebt,
    }),
    { players: 0, groups: 0, revenue: 0, debt: 0 }
  );

  const handleToggle = async (coachId, isActive) => {
    try {
      await apiClient.patch(`/admin/coaches/${coachId}/toggle-active`);
      fetchCoaches();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleFormChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleCreateCoach = async (event) => {
    event.preventDefault();
    setCreatingCoach(true);
    setError(null);
    try {
      await apiClient.post('/admin/coaches', form);
      setForm({ username: '', email: '', password: '', phone: '', sportType: 'basketball' });
      fetchCoaches();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreatingCoach(false);
    }
  };

  const handleEditClick = (coach) => {
    setEditingCoach(coach.id);
    setEditForm({
      username: coach.username,
      email: coach.email,
      phone: coach.phone,
      sportType: coach.sportType || 'basketball',
      password: '',
    });
    setError(null);
  };

  const handleEditFormChange = (event) => {
    setEditForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleUpdateCoach = async (event) => {
    event.preventDefault();
    setUpdatingCoach(true);
    setError(null);
    try {
      await apiClient.put(`/admin/coaches/${editingCoach}`, editForm);
      setEditingCoach(null);
      setEditForm({ username: '', email: '', phone: '', sportType: 'basketball', password: '' });
      fetchCoaches();
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdatingCoach(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingCoach(null);
    setEditForm({ username: '', email: '', phone: '', sportType: 'basketball', password: '' });
    setError(null);
  };

  const handleDeleteClick = (coachId) => {
    setDeletingCoach(coachId);
  };

  const handleConfirmDelete = async () => {
    if (!deletingCoach) return;
    
    try {
      await apiClient.delete(`/admin/coaches/${deletingCoach}`);
      setDeletingCoach(null);
      fetchCoaches();
    } catch (err) {
      setError(err.message);
      setDeletingCoach(null);
    }
  };

  const handleCancelDelete = () => {
    setDeletingCoach(null);
  };

  const handleToggleDetails = async (coachId) => {
    if (expandedCoach === coachId) {
      // Collapse
      setExpandedCoach(null);
    } else {
      // Expand - fetch details if not already cached
      setExpandedCoach(coachId);
      if (!coachDetails[coachId]) {
        setLoadingDetails((prev) => ({ ...prev, [coachId]: true }));
        try {
          const { data } = await apiClient.get(`/admin/coaches/${coachId}/groups-players`);
          setCoachDetails((prev) => ({ ...prev, [coachId]: data }));
        } catch (err) {
          setError(err.message);
        } finally {
          setLoadingDetails((prev) => ({ ...prev, [coachId]: false }));
        }
      }
    }
  };

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Organization overview</h2>
          <p className="text-muted">Review coach performance and keep accounts in sync.</p>
        </div>
      </section>

      <section className="grid stats-grid">
        <StatCard label="Coaches" value={coaches.length} />
        <StatCard label="Groups" value={totals.groups} accent="#10b981" />
        <StatCard label="Players" value={totals.players} accent="#f59e0b" />
        <StatCard label="Revenue" value={`$${totals.revenue.toFixed(2)}`} accent="#6366f1" />
        <StatCard label="Outstanding debt" value={`$${totals.debt.toFixed(2)}`} accent="#ef4444" />
      </section>

      <section className="card">
        <h3>Create a new coach</h3>
        <form className="grid form-grid" onSubmit={handleCreateCoach}>
          <label>
            Username
            <input
              name="username"
              value={form.username}
              onChange={handleFormChange}
              required
              placeholder="coach_username"
            />
          </label>

          <label>
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleFormChange}
              required
              placeholder="coach@example.com"
            />
          </label>

          <label>
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleFormChange}
              required
              placeholder="Password"
            />
          </label>

          <label>
            Phone
            <input
              name="phone"
              value={form.phone}
              onChange={handleFormChange}
              required
              placeholder="+1234567890"
            />
          </label>

          <label>
            Sport Type
            <select
              name="sportType"
              value={form.sportType}
              onChange={handleFormChange}
              required
            >
              <option value="basketball">🏀 Basketball</option>
              <option value="football">⚽ Football</option>
            </select>
          </label>

          <button className="btn btn--primary" type="submit" disabled={creatingCoach}>
            {creatingCoach ? 'Creating...' : 'Create Coach'}
          </button>
        </form>
      </section>

      <section className="card">
        <div className="card__header">
          <h3>Coaches</h3>
          {loading && <span className="text-muted">Loading...</span>}
        </div>
        {error && <p className="error-text">{error}</p>}
        {!coaches.length && !loading ? (
          <p className="text-muted">No coaches yet.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th></th>
                <th>Username</th>
                <th>Password</th>
                <th>Email</th>
                <th>Sport Type</th>
                <th>Groups</th>
                <th>Players</th>
                <th>Revenue</th>
                <th>Debt</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coaches.map((coach) => (
                editingCoach === coach.id ? (
                  <tr key={coach.id} style={{ backgroundColor: 'rgba(34, 197, 94, 0.05)' }}>
                    <td colSpan="11">
                      <form onSubmit={handleUpdateCoach} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', padding: '1rem', background: 'rgba(17, 24, 39, 0.5)', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.3)' }}>
                        <label>
                          Username
                          <input
                            name="username"
                            value={editForm.username}
                            onChange={handleEditFormChange}
                            required
                          />
                        </label>
                        <label>
                          Email
                          <input
                            name="email"
                            type="email"
                            value={editForm.email}
                            onChange={handleEditFormChange}
                            required
                          />
                        </label>
                        <label>
                          Phone
                          <input
                            name="phone"
                            value={editForm.phone}
                            onChange={handleEditFormChange}
                            required
                          />
                        </label>
                        <label>
                          Sport Type
                          <select
                            name="sportType"
                            value={editForm.sportType}
                            onChange={handleEditFormChange}
                            required
                          >
                            <option value="basketball">🏀 Basketball</option>
                            <option value="football">⚽ Football</option>
                          </select>
                        </label>
                        <label>
                          New Password (leave empty to keep current)
                          <input
                            name="password"
                            type="password"
                            value={editForm.password}
                            onChange={handleEditFormChange}
                            placeholder="Leave empty to keep current"
                          />
                        </label>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                          <button className="btn btn--primary" type="submit" disabled={updatingCoach}>
                            {updatingCoach ? 'Saving...' : 'Save'}
                          </button>
                          <button className="btn btn--outline" type="button" onClick={handleCancelEdit}>
                            Cancel
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                ) : (
                  <>
                    <tr key={coach.id}>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleToggleDetails(coach.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            fontSize: '1.2rem',
                            padding: '0.25rem 0.5rem',
                            transition: 'transform 0.2s',
                            transform: expandedCoach === coach.id ? 'rotate(90deg)' : 'rotate(0deg)',
                          }}
                        >
                          ▶
                        </button>
                      </td>
                      <td>{coach.username}</td>
                      <td>
                        {coach.displayPassword ? (
                          <code style={{
                            background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(251, 191, 36, 0.2))',
                            color: '#fbbf24',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '6px',
                            fontSize: '0.85rem',
                            fontFamily: 'monospace',
                            border: '1px solid rgba(234, 179, 8, 0.4)'
                          }}>
                            {coach.displayPassword}
                          </code>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                            Not set
                          </span>
                        )}
                      </td>
                      <td>{coach.email}</td>
                      <td>
                        {coach.sportType ? (
                          <span style={{
                            padding: '0.25rem 0.75rem',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            fontWeight: '600',
                            background: coach.sportType === 'basketball' 
                              ? 'rgba(239, 68, 68, 0.2)' 
                              : 'rgba(34, 197, 94, 0.2)',
                            color: coach.sportType === 'basketball' 
                              ? '#ef4444' 
                              : '#22c55e',
                            border: `1px solid ${coach.sportType === 'basketball' ? 'rgba(239, 68, 68, 0.4)' : 'rgba(34, 197, 94, 0.4)'}`
                          }}>
                            {coach.sportType === 'basketball' ? '🏀 Basketball' : '⚽ Football'}
                          </span>
                        ) : (
                          <span className="text-muted">Not set</span>
                        )}
                      </td>
                      <td>{coach.groupCount}</td>
                      <td>{coach.playerCount}</td>
                      <td>${coach.totalReceived.toFixed(2)}</td>
                      <td>${coach.totalDebt.toFixed(2)}</td>
                      <td>
                        <button
                          className="btn btn--outline"
                          type="button"
                          onClick={() => handleToggle(coach.id, coach.isActive)}
                          style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                        >
                          {coach.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <button
                            className="btn btn--outline"
                            type="button"
                            onClick={() => handleEditClick(coach)}
                            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn--outline"
                            type="button"
                            onClick={() => handleDeleteClick(coach.id)}
                            style={{ 
                              fontSize: '0.85rem', 
                              padding: '0.5rem 1rem',
                              color: '#ef4444',
                              borderColor: 'rgba(239, 68, 68, 0.5)'
                            }}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedCoach === coach.id && (
                      <tr key={`${coach.id}-details`}>
                        <td colSpan="11" style={{ padding: '1.5rem', background: 'rgba(17, 24, 39, 0.5)' }}>
                          {loadingDetails[coach.id] ? (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                              Loading groups and players...
                            </div>
                          ) : coachDetails[coach.id] ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                              <h4 style={{ 
                                color: 'var(--text-primary)', 
                                marginBottom: '1rem',
                                fontSize: '1.1rem',
                                fontWeight: '600'
                              }}>
                                Groups & Players for {coachDetails[coach.id].coach.username}
                              </h4>
                              {coachDetails[coach.id].groups.length === 0 ? (
                                <p className="text-muted" style={{ padding: '1rem' }}>
                                  No groups found for this coach.
                                </p>
                              ) : (
                                coachDetails[coach.id].groups.map((group) => (
                                  <div 
                                    key={group.id} 
                                    style={{
                                      background: 'rgba(34, 197, 94, 0.05)',
                                      borderRadius: '12px',
                                      padding: '1.5rem',
                                      border: '1px solid rgba(34, 197, 94, 0.2)'
                                    }}
                                  >
                                    <div style={{ 
                                      display: 'flex', 
                                      justifyContent: 'space-between', 
                                      alignItems: 'center',
                                      marginBottom: '1rem',
                                      flexWrap: 'wrap',
                                      gap: '1rem'
                                    }}>
                                      <div>
                                        <h5 style={{ 
                                          color: 'var(--text-primary)', 
                                          fontSize: '1rem',
                                          fontWeight: '600',
                                          marginBottom: '0.25rem'
                                        }}>
                                          📁 {group.name}
                                        </h5>
                                        {group.description && (
                                          <p style={{ 
                                            color: 'var(--text-secondary)', 
                                            fontSize: '0.9rem',
                                            marginTop: '0.25rem'
                                          }}>
                                            {group.description}
                                          </p>
                                        )}
                                        <div style={{ 
                                          display: 'flex', 
                                          gap: '1rem', 
                                          marginTop: '0.5rem',
                                          flexWrap: 'wrap'
                                        }}>
                                          <span style={{ 
                                            color: 'var(--text-secondary)', 
                                            fontSize: '0.85rem' 
                                          }}>
                                            💰 Fee: ${group.defaultMonthlyFee.toFixed(2)}/month
                                          </span>
                                          <span style={{ 
                                            color: 'var(--text-secondary)', 
                                            fontSize: '0.85rem' 
                                          }}>
                                            👥 Players: {group.playerCount}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    {group.players.length === 0 ? (
                                      <p className="text-muted" style={{ 
                                        padding: '1rem', 
                                        background: 'rgba(0, 0, 0, 0.2)',
                                        borderRadius: '8px'
                                      }}>
                                        No players in this group.
                                      </p>
                                    ) : (
                                      <div style={{ 
                                        overflowX: 'auto',
                                        marginTop: '1rem'
                                      }}>
                                        <table style={{ 
                                          width: '100%',
                                          borderCollapse: 'collapse'
                                        }}>
                                          <thead>
                                            <tr style={{ 
                                              borderBottom: '1px solid rgba(34, 197, 94, 0.2)',
                                              background: 'rgba(0, 0, 0, 0.2)'
                                            }}>
                                              <th style={{ 
                                                padding: '0.75rem', 
                                                textAlign: 'left',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.85rem',
                                                fontWeight: '600'
                                              }}>
                                                Name
                                              </th>
                                              <th style={{ 
                                                padding: '0.75rem', 
                                                textAlign: 'left',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.85rem',
                                                fontWeight: '600'
                                              }}>
                                                Phone
                                              </th>
                                              <th style={{ 
                                                padding: '0.75rem', 
                                                textAlign: 'left',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.85rem',
                                                fontWeight: '600'
                                              }}>
                                                Monthly Fee
                                              </th>
                                              <th style={{ 
                                                padding: '0.75rem', 
                                                textAlign: 'left',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.85rem',
                                                fontWeight: '600'
                                              }}>
                                                Username
                                              </th>
                                              <th style={{ 
                                                padding: '0.75rem', 
                                                textAlign: 'left',
                                                color: 'var(--text-primary)',
                                                fontSize: '0.85rem',
                                                fontWeight: '600'
                                              }}>
                                                Password
                                              </th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {group.players.map((player) => (
                                              <tr 
                                                key={player.id}
                                                style={{ 
                                                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
                                                }}
                                              >
                                                <td style={{ 
                                                  padding: '0.75rem',
                                                  color: 'var(--text-primary)',
                                                  fontSize: '0.9rem'
                                                }}>
                                                  {player.fullName}
                                                </td>
                                                <td style={{ 
                                                  padding: '0.75rem',
                                                  color: 'var(--text-secondary)',
                                                  fontSize: '0.9rem'
                                                }}>
                                                  {player.phone}
                                                </td>
                                                <td style={{ 
                                                  padding: '0.75rem',
                                                  color: 'var(--text-secondary)',
                                                  fontSize: '0.9rem'
                                                }}>
                                                  ${player.monthlyFee.toFixed(2)}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                  {player.username ? (
                                                    <code style={{
                                                      background: 'rgba(34, 197, 94, 0.2)',
                                                      color: '#22c55e',
                                                      padding: '0.25rem 0.5rem',
                                                      borderRadius: '6px',
                                                      fontSize: '0.85rem',
                                                      fontFamily: 'monospace',
                                                      border: '1px solid rgba(34, 197, 94, 0.4)'
                                                    }}>
                                                      {player.username}
                                                    </code>
                                                  ) : (
                                                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                                                      Not set
                                                    </span>
                                                  )}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                  {player.displayPassword ? (
                                                    <code style={{
                                                      background: 'linear-gradient(135deg, rgba(234, 179, 8, 0.2), rgba(251, 191, 36, 0.2))',
                                                      color: '#fbbf24',
                                                      padding: '0.25rem 0.5rem',
                                                      borderRadius: '6px',
                                                      fontSize: '0.85rem',
                                                      fontFamily: 'monospace',
                                                      border: '1px solid rgba(234, 179, 8, 0.4)'
                                                    }}>
                                                      {player.displayPassword}
                                                    </code>
                                                  ) : (
                                                    <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                                                      Not set
                                                    </span>
                                                  )}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    )}
                                  </div>
                                ))
                              )}
                            </div>
                          ) : (
                            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                              Failed to load details. Please try again.
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
                )
              ))}
            </tbody>
          </table>
        )}
      </section>

      {deletingCoach && (
        <section className="card" style={{ 
          position: 'fixed', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          zIndex: 1000,
          maxWidth: '500px',
          background: 'var(--bg-secondary)',
          border: '2px solid rgba(239, 68, 68, 0.5)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8)'
        }}>
          <h3 style={{ color: '#ef4444', marginBottom: '1rem' }}>⚠️ Delete Coach</h3>
          <p style={{ color: 'var(--text-primary)', marginBottom: '1.5rem' }}>
            Are you sure you want to delete this coach? This will permanently delete:
          </p>
          <ul style={{ 
            listStyle: 'disc', 
            paddingLeft: '1.5rem', 
            marginBottom: '1.5rem',
            color: 'var(--text-secondary)'
          }}>
            <li>The coach account</li>
            <li>All groups created by this coach</li>
            <li>All players in those groups</li>
            <li>All payments and attendance records</li>
          </ul>
          <p style={{ color: '#ef4444', fontWeight: '700', marginBottom: '1.5rem' }}>
            This action cannot be undone!
          </p>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              className="btn btn--outline"
              type="button"
              onClick={handleCancelDelete}
            >
              Cancel
            </button>
            <button
              className="btn btn--secondary"
              type="button"
              onClick={handleConfirmDelete}
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)' }}
            >
              🗑️ Delete Coach
            </button>
          </div>
        </section>
      )}

      {deletingCoach && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            zIndex: 999,
            backdropFilter: 'blur(4px)'
          }}
          onClick={handleCancelDelete}
        />
      )}
    </div>
  );
};

export default AdminDashboard;

