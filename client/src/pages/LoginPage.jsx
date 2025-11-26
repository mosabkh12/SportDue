import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import { useNotifications } from '../context/NotificationContext';

const LoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const notifications = useNotifications();
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (event) => {
    setForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const role = await login(form);
      notifications.success(`Welcome back! Successfully logged in as ${role}.`);
      
      // Small delay to show notification before navigation
      setTimeout(() => {
        if (role === 'admin') {
          navigate('/admin/dashboard');
        } else if (role === 'player') {
          navigate('/player/dashboard');
        } else {
          navigate('/coach/dashboard');
        }
      }, 300);
    } catch (err) {
      setError(err.message);
      notifications.error(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__hero">
          <p className="eyebrow">Welcome back</p>
          <h2>CoachPay Web</h2>
          <p>Track payments, attendance, and performance with a single, elegant dashboard.</p>
          <ul>
            <li>⚡ Real-time payment summaries</li>
            <li>📱 Smart reminders for parents and players</li>
            <li>✅ Attendance tracking with signatures</li>
          </ul>
        </div>
        <form onSubmit={handleSubmit}>
          <h3>Sign in</h3>
          <p className="text-muted">Email/username & password, that's it.</p>

          <label>
            Email or username
            <input
              type="text"
              name="identifier"
              placeholder="email, username, or player username"
              value={form.identifier}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            Password
            <input
              type="password"
              name="password"
              placeholder="********"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

