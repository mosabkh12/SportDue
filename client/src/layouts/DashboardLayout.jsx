import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

const navItemsByRole = {
  coach: [
    { to: '/coach/dashboard', label: 'Dashboard' },
    { to: '/coach/profile', label: 'Profile' },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/profile', label: 'Profile' },
  ],
};

const DashboardLayout = () => {
  const { role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = navItemsByRole[role] || [];

  return (
    <div className="layout">
      <header className="layout__header">
        <h1>CoachPay Web</h1>
        <nav>
          {links.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? 'nav-link nav-link--active' : 'nav-link')}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <button className="btn btn--ghost" type="button" onClick={handleLogout}>
          Logout
        </button>
      </header>
      <main className="layout__content">
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;

