import React, { useContext } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  UserPlus, 
  Search, 
  Pill, 
  CreditCard, 
  LogOut,
  Settings
} from 'lucide-react';

const Sidebar = () => {
  const { logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" style={{ display: 'flex', justifyContent: 'center', padding: '1rem 0 2rem 0' }}>
        <Link to="/">
          <img src="/logo.png?v=3" alt="Clinic Logo" style={{ maxHeight: '60px', maxWidth: '100%', objectFit: 'contain' }} />
        </Link>
      </div>
      
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
        <NavLink to="/" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'} end>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        <NavLink to="/add-patient" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
          <UserPlus size={20} />
          <span>Add Patient</span>
        </NavLink>
        <NavLink to="/search-patient" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
          <Search size={20} />
          <span>Search Patient</span>
        </NavLink>
        <NavLink to="/medicine-stock" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
          <Pill size={20} />
          <span>Medicine Stock</span>
        </NavLink>
        <NavLink to="/pending-dues" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
          <CreditCard size={20} />
          <span>Pending Dues</span>
        </NavLink>
        <NavLink to="/settings" className={({isActive}) => isActive ? 'nav-link active' : 'nav-link'}>
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>

      <button onClick={handleLogout} className="nav-link" style={{ background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}>
        <LogOut size={20} />
        <span>Logout</span>
      </button>
    </aside>
  );
};

export default Sidebar;
