import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import StatCard from '../components/StatCard.jsx';
import { useNotifications } from '../context/NotificationContext';
import '../styles/pages/CoachDashboard.css';

const CoachDashboard = () => {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', defaultMonthlyFee: '' });

  const fetchGroups = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/groups');
      setGroups(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      await apiClient.post('/groups', {
        ...form,
        defaultMonthlyFee: Number(form.defaultMonthlyFee) || 0,
      });
      notifications.success(`Training group "${form.name}" has been created successfully.`);
      setForm({ name: '', description: '', defaultMonthlyFee: '' });
      fetchGroups();
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create group';
      setError(errorMessage);
      notifications.error(errorMessage);
    }
  };

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Coach Dashboard</p>
          <h2>Overview</h2>
          <p className="text-muted">Manage your training groups, track player payments, and monitor attendance in one centralized platform.</p>
        </div>
      </section>

      <section className="grid stats-grid">
        <StatCard label="Active Groups" value={loading ? undefined : groups.length} />
        <StatCard
          label="Total Players"
          value={loading ? undefined : groups.reduce((acc, group) => acc + (group.playerCount || 0), 0)}
          accent="#f97316"
        />
      </section>

      <section className="card">
        <div className="card__header">
          <h3>Create New Training Group</h3>
          <p className="text-muted" style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Set up a new training group with default payment settings.</p>
        </div>
        <form className="grid form-grid" onSubmit={handleSubmit}>
          <label>
            Group Name
            <input 
              name="name" 
              value={form.name} 
              onChange={handleChange} 
              required 
              placeholder="e.g., Senior Team, Junior Squad"
            />
          </label>

          <label>
            Default Monthly Fee ($)
            <input
              name="defaultMonthlyFee"
              type="number"
              step="0.01"
              value={form.defaultMonthlyFee}
              onChange={handleChange}
              min="0"
              placeholder="0.00"
            />
            <small className="text-muted" style={{ fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
              This will be the default fee for new players in this group
            </small>
          </label>

          <label className="full-width">
            Description
            <textarea
              name="description"
              rows={3}
              value={form.description}
              onChange={handleChange}
              placeholder="Optional: Add details about this training group..."
            />
          </label>

          <button className="btn btn--primary" type="submit">
            Create Group
          </button>
        </form>
      </section>

      <section className="card">
        <div className="card__header">
          <h3>Training Groups</h3>
          {loading && <span className="text-muted">Loading groups...</span>}
        </div>
        {error && <p className="error-text">{error}</p>}
        {!groups.length && !loading ? (
          <div className="empty-state">
            <p className="text-muted empty-state-title">No training groups yet</p>
            <p className="text-muted empty-state-subtitle">Create your first group above to get started.</p>
          </div>
        ) : (
          <div className="grid group-grid">
            {groups.map((group) => (
              <div key={group._id} className="card group-card">
                <h4>{group.name}</h4>
                <p className="text-muted" style={{ minHeight: '3rem', marginBottom: '1rem' }}>
                  {group.description || 'No description provided'}
                </p>
                <div className="group-info-box">
                  <p className="group-info-text">
                    Default Monthly Fee: <strong className="group-info-strong">${(group.defaultMonthlyFee || 0).toFixed(2)}</strong>
                  </p>
                  <p className="group-info-text" style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>
                    Players: <strong>{group.playerCount || 0}</strong>
                  </p>
                </div>
                <Link className="btn btn--secondary" to={`/coach/groups/${group._id}`}>
                  Manage Group
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default CoachDashboard;

