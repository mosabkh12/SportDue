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
      notifications.success(`Welcome back! You have been successfully authenticated as ${role}.`);
      
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
      notifications.error(err.message || 'Authentication failed. Please verify your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-card__hero">
          <p className="eyebrow">Welcome Back</p>
          <h2>SportDue</h2>
          <p>Streamline your coaching operations with comprehensive payment tracking, attendance management, and performance analytics.</p>
          <ul>
            <li>Real-time Payment Tracking</li>
            <li>Automated Payment Reminders</li>
            <li>Digital Attendance Management</li>
          </ul>
        </div>
        <form onSubmit={handleSubmit}>
          <h3>Sign In</h3>
          <p className="text-muted">Enter your credentials to access your account.</p>

          <label>
            Email Address or Username
            <input
              type="text"
              name="identifier"
              placeholder="Enter your email address or username"
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
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;

