import { useEffect, useState } from 'react';
import apiClient from '../services/apiClient';
import useAuth from '../hooks/useAuth';

const AdminProfilePage = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState({ username: '', email: '' });
  const [passwordForm, setPasswordForm] = useState({ newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const fetchProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/admin/me');
      setProfile({
        username: data.username || '',
        email: data.email || '',
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
    setMessage(null);
    setError(null);
    try {
      const { data } = await apiClient.put('/admin/me', {
        username: profile.username,
      });
      setMessage('Profile updated successfully.');
      updateUser(data);
    } catch (err) {
      setError(err.message);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setMessage(null);
    setError(null);

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New password confirmation does not match.');
      return;
    }

    try {
      await apiClient.put('/admin/me', {
        newPassword: passwordForm.newPassword,
      });
      setMessage('Password updated successfully.');
      setPasswordForm({ newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page">
      <section className="page-header">
        <div>
          <p className="eyebrow">Admin</p>
          <h2>Profile & security</h2>
          <p className="text-muted">Adjust your username and keep your password safe.</p>
        </div>
      </section>

      <section className="card">
        <h2>Profile</h2>
        {loading && <p className="text-muted">Loading...</p>}
        {message && <p className="text-muted">{message}</p>}
        {error && <p className="error-text">{error}</p>}
        <form className="grid form-grid" onSubmit={saveProfile}>
          <label>
            Username
            <input name="username" value={profile.username} onChange={handleProfileChange} required />
          </label>
          <label>
            Email
            <input value={profile.email} disabled />
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

export default AdminProfilePage;

