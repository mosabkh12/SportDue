import { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import StatCard from '../components/StatCard.jsx';

const AdminDashboard = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      await apiClient.patch(`/admin/coaches/${coachId}/status`, { isActive: !isActive });
      fetchCoaches();
    } catch (err) {
      setError(err.message);
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
                <th>Username</th>
                <th>Email</th>
                <th>Groups</th>
                <th>Players</th>
                <th>Revenue</th>
                <th>Debt</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {coaches.map((coach) => (
                <tr key={coach.id}>
                  <td>{coach.username}</td>
                  <td>{coach.email}</td>
                  <td>{coach.groupCount}</td>
                  <td>{coach.playerCount}</td>
                  <td>${coach.totalReceived.toFixed(2)}</td>
                  <td>${coach.totalDebt.toFixed(2)}</td>
                  <td>
                    <button
                      className="btn btn--outline"
                      type="button"
                      onClick={() => handleToggle(coach.id, coach.isActive)}
                    >
                      {coach.isActive ? 'Deactivate' : 'Activate'}
                    </button>
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

export default AdminDashboard;

