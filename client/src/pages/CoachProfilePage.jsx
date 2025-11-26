import { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import useAuth from '../hooks/useAuth';
import { useNotifications } from '../context/NotificationContext';

const CoachProfilePage = () => {
  const { updateUser } = useAuth();
  const notifications = useNotifications();
  const [profile, setProfile] = useState({ username: '', email: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/coach/me');
      setProfile({
        username: data.username || '',
        email: data.email || '',
        phone: data.phone || '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleProfileChange = (event) => {
    setProfile((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const handlePasswordChange = (event) => {
    setPasswordForm((prev) => ({ ...prev, [event.target.name]: event.target.value }));
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      const { data } = await apiClient.put('/coach/me', {
        username: profile.username,
        phone: profile.phone,
      });
      updateUser(data);
      notifications.success('Profile updated successfully!');
    } catch (err) {
      setError(err.message);
      notifications.error(err.message || 'Failed to update profile.');
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password confirmation does not match.');
      notifications.error('Password confirmation does not match.');
      return;
    }

    try {
      await apiClient.put('/coach/me', {
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ newPassword: '', confirmPassword: '' });
      notifications.success('Password updated successfully!');
    } catch (err) {
      setError(err.message);
      notifications.error(err.message || 'Failed to update password.');
    }
  };

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Coach</p>
          <h2>Profile & security</h2>
          <p className="text-muted">Keep your username, phone, and password up to date.</p>
        </div>
      </section>

      <section className="card">
        <h2>Profile</h2>
        {loading && <p className="text-muted">Loading...</p>}
        {error && <p className="error-text">{error}</p>}
        <form className="grid form-grid" onSubmit={saveProfile}>
          <label>
            Username
            <input name="username" value={profile.username} onChange={handleProfileChange} required />
          </label>
          <label>
            Email
            <input name="email" value={profile.email} disabled />
          </label>
          <label>
            Phone
            <input name="phone" value={profile.phone} onChange={handleProfileChange} required />
          </label>
          <button className="btn btn--primary" type="submit">
            Save profile
          </button>
        </form>
      </section>

      <section className="card">
        <h3>Change password</h3>
        <form className="grid form-grid" onSubmit={changePassword}>
          <label>
            New password
            <input
              type="password"
              name="newPassword"
              value={passwordForm.newPassword}
              onChange={handlePasswordChange}
              required
            />
          </label>
          <label>
            Confirm new password
            <input
              type="password"
              name="confirmPassword"
              value={passwordForm.confirmPassword}
              onChange={handlePasswordChange}
              required
            />
          </label>
          <button className="btn btn--secondary" type="submit">
            Update password
          </button>
        </form>
      </section>
    </div>
  );
};

export default CoachProfilePage;

