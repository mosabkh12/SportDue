import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '../services/apiClient';
import StatCard from '../components/StatCard.jsx';

const CoachDashboard = () => {
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
    try {
      await apiClient.post('/groups', {
        ...form,
        defaultMonthlyFee: Number(form.defaultMonthlyFee) || 0,
      });
      setForm({ name: '', description: '', defaultMonthlyFee: '' });
      fetchGroups();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Coach overview</p>
          <h2>Dashboard</h2>
          <p className="text-muted">Monitor your groups, players, and payments at a glance.</p>
        </div>
      </section>

      <section className="grid stats-grid">
        <StatCard label="Total Groups" value={groups.length} />
        <StatCard
          label="Total Players"
          value={groups.reduce((acc, group) => acc + (group.playerCount || 0), 0)}
          accent="#f97316"
        />
      </section>

      <section className="card">
        <h3>Create a new group</h3>
        <form className="grid form-grid" onSubmit={handleSubmit}>
          <label>
            Group name
            <input name="name" value={form.name} onChange={handleChange} required />
          </label>

          <label>
            Default monthly fee
            <input
              name="defaultMonthlyFee"
              type="number"
              value={form.defaultMonthlyFee}
              onChange={handleChange}
              min="0"
            />
          </label>

          <label className="full-width">
            Description
            <textarea
              name="description"
              rows={2}
              value={form.description}
              onChange={handleChange}
            />
          </label>

          <button className="btn btn--primary" type="submit">
            Save group
          </button>
        </form>
      </section>

      <section className="card">
        <div className="card__header">
          <h3>Your groups</h3>
          {loading && <span className="text-muted">Loading...</span>}
        </div>
        {error && <p className="error-text">{error}</p>}
        {!groups.length && !loading ? (
          <p className="text-muted">No groups yet. Create one above.</p>
        ) : (
          <div className="grid group-grid">
            {groups.map((group) => (
              <div key={group._id} className="card group-card">
                <h4>{group.name}</h4>
                <p className="text-muted">{group.description || 'No description'}</p>
                <p>
                  Default fee: <strong>${group.defaultMonthlyFee || 0}</strong>
                </p>
                <Link className="btn btn--secondary" to={`/coach/groups/${group._id}`}>
                  View group
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

