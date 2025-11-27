import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import StatCard from '../components/StatCard.jsx';
import { useNotifications } from '../context/NotificationContext';
import '../styles/pages/AdminDashboard.css';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();
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
      notifications.success(`Coach ${isActive ? 'deactivated' : 'activated'} successfully.`);
    } catch (err) {
      setError(err.message);
      notifications.error(err.message || 'Failed to update coach status.');
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
      notifications.success(`Coach "${form.username}" created successfully!`);
    } catch (err) {
      setError(err.message);
      notifications.error(err.message || 'Failed to create coach.');
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
      notifications.success(`Coach "${editForm.username}" updated successfully!`);
    } catch (err) {
      setError(err.message);
      notifications.error(err.message || 'Failed to update coach.');
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
      const coachToDelete = coaches.find(c => c.id === deletingCoach);
      await apiClient.delete(`/admin/coaches/${deletingCoach}`);
      setDeletingCoach(null);
      fetchCoaches();
      notifications.success(`Coach "${coachToDelete?.username || 'deleted'}" deleted successfully.`);
    } catch (err) {
      setError(err.message);
      notifications.error(err.message || 'Failed to delete coach.');
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
              maxLength={20}
              placeholder="0526867838 or +972526867838"
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
          <div className="table-scroll-wrapper">
            <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '40px', minWidth: '40px' }}></th>
                <th style={{ width: '120px', minWidth: '120px' }}>Username</th>
                <th style={{ width: '130px', minWidth: '130px' }}>Password</th>
                <th style={{ width: '180px', minWidth: '180px' }}>Email</th>
                <th style={{ width: '140px', minWidth: '140px' }}>Sport Type</th>
                <th style={{ width: '80px', minWidth: '80px' }}>Groups</th>
                <th style={{ width: '80px', minWidth: '80px' }}>Players</th>
                <th style={{ width: '110px', minWidth: '110px' }}>Revenue</th>
                <th style={{ width: '110px', minWidth: '110px' }}>Debt</th>
                <th style={{ width: '120px', minWidth: '120px' }}>Status</th>
                <th style={{ width: '180px', minWidth: '180px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {coaches.map((coach) => (
                editingCoach === coach.id ? (
                  <tr key={coach.id} className="edit-form-row">
                    <td colSpan="11">
                      <form onSubmit={handleUpdateCoach} className="edit-form-container">
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
                            maxLength={20}
                            placeholder="0526867838 or +972526867838"
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
                        <div className="edit-form-actions">
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
                          className={`expand-button ${expandedCoach === coach.id ? 'expand-button--expanded' : ''}`}
                        >
                          ▶
                        </button>
                      </td>
                      <td>{coach.username}</td>
                      <td>
                        {coach.displayPassword ? (
                          <code className="password-badge">
                            {coach.displayPassword}
                          </code>
                        ) : (
                          <span className="text-muted text-small">Not set</span>
                        )}
                      </td>
                      <td>{coach.email}</td>
                      <td>
                        {coach.sportType ? (
                          <div className={`sport-type-badge sport-type-badge--${coach.sportType}`}>
                            <span className="sport-type-icon">{coach.sportType === 'basketball' ? '🏀' : '⚽'}</span>
                            <span>{coach.sportType === 'basketball' ? 'Basketball' : 'Football'}</span>
                          </div>
                        ) : (
                          <span className="text-muted">Not set</span>
                        )}
                      </td>
                      <td className="table-cell--center">{coach.groupCount}</td>
                      <td className="table-cell--center">{coach.playerCount}</td>
                      <td className="table-cell--right">${coach.totalReceived.toFixed(2)}</td>
                      <td className="table-cell--right">${coach.totalDebt.toFixed(2)}</td>
                      <td className="table-cell--center">
                        <button
                          className="btn btn--outline btn-small"
                          type="button"
                          onClick={() => handleToggle(coach.id, coach.isActive)}
                        >
                          {coach.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                      <td className="action-buttons-cell">
                        <div className="action-buttons">
                          <button
                            className="btn btn--outline action-btn"
                            type="button"
                            onClick={() => handleEditClick(coach)}
                          >
                            ✏️ Edit
                          </button>
                          <button
                            className="btn btn--outline action-btn action-btn--delete"
                            type="button"
                            onClick={() => handleDeleteClick(coach.id)}
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedCoach === coach.id && (
                      <tr key={`${coach.id}-details`}>
                        <td colSpan="11" className="details-row">
                          {loadingDetails[coach.id] ? (
                            <div className="details-loading">
                              Loading groups and players...
                            </div>
                          ) : coachDetails[coach.id] ? (
                            <div className="details-container">
                              <h4 className="details-title">
                                Groups & Players for {coachDetails[coach.id].coach.username}
                              </h4>
                              {coachDetails[coach.id].groups.length === 0 ? (
                                <p className="text-muted details-empty">
                                  No groups found for this coach.
                                </p>
                              ) : (
                                coachDetails[coach.id].groups.map((group) => (
                                  <div 
                                    key={group.id} 
                                    className="group-card"
                                  >
                                    <div className="group-card-header">
                                      <div>
                                        <h5 className="group-card-title">
                                          📁 {group.name}
                                        </h5>
                                        {group.description && (
                                          <p className="group-card-description">
                                            {group.description}
                                          </p>
                                        )}
                                        <div className="group-card-info">
                                          <span className="group-card-info-item">
                                            💰 Fee: ${group.defaultMonthlyFee.toFixed(2)}/month
                                          </span>
                                          <span className="group-card-info-item">
                                            👥 Players: {group.playerCount}
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                    {group.players.length === 0 ? (
                                      <p className="text-muted details-empty">
                                        No players in this group.
                                      </p>
                                    ) : (
                                      <div className="players-table-wrapper">
                                        <table className="players-table">
                                          <thead>
                                            <tr>
                                              <th>Name</th>
                                              <th>Phone</th>
                                              <th>Monthly Fee</th>
                                              <th>Username</th>
                                              <th>Password</th>
                                            </tr>
                                          </thead>
                                          <tbody>
                                            {group.players.map((player) => (
                                              <tr key={player.id}>
                                                <td>{player.fullName}</td>
                                                <td>{player.phone}</td>
                                                <td>${player.monthlyFee.toFixed(2)}</td>
                                                <td>
                                                  {player.username ? (
                                                    <code className="username-badge">
                                                      {player.username}
                                                    </code>
                                                  ) : (
                                                    <span className="text-muted text-small">Not set</span>
                                                  )}
                                                </td>
                                                <td>
                                                  {player.displayPassword ? (
                                                    <code className="password-badge">
                                                      {player.displayPassword}
                                                    </code>
                                                  ) : (
                                                    <span className="text-muted text-small">Not set</span>
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
                            <div className="details-loading">
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
          </div>
        )}
      </section>

      {deletingCoach && (
        <>
          <div className="delete-modal-overlay" onClick={handleCancelDelete} />
          <section className="delete-modal">
            <h3 className="delete-modal-title">⚠️ Delete Coach</h3>
            <p className="delete-modal-body">
              Are you sure you want to delete this coach? This will permanently delete:
            </p>
            <ul className="delete-modal-list">
              <li>The coach account</li>
              <li>All groups created by this coach</li>
              <li>All players in those groups</li>
              <li>All payments and attendance records</li>
            </ul>
            <p className="delete-modal-warning">
              This action cannot be undone!
            </p>
            <div className="delete-modal-actions">
              <button
                className="btn btn--outline"
                type="button"
                onClick={handleCancelDelete}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                type="button"
                onClick={handleConfirmDelete}
              >
                🗑️ Delete Coach
              </button>
            </div>
          </section>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;

