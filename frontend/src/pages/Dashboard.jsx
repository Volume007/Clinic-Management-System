import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Users, AlertTriangle, CreditCard, Clock, Calendar, Activity, ArrowRight, UserPlus, FileText, Pill } from 'lucide-react';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({
    patientsToday: 0,
    lowStockCount: 0,
    pendingDuesCount: 0,
    pendingDuesAmount: 0
  });
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5001/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStats(res.data);
      } catch (error) {
        console.error('Failed to fetch stats', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (date) => {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDoctorName = (name) => {
    if (!name) return 'Dr. Bimal Sharma';
    // Remove existing "Dr." if present and remove "Kumar"
    let cleanName = name.replace(/^Dr\.?\s*/i, '').replace(/Kumar\s*/i, '');
    return `Dr. ${cleanName}`;
  };

  return (
    <div className="dashboard-container fade-in">
      {/* Header Section */}
      <div className="dashboard-header mb-4">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-gradient mb-1" style={{ fontSize: '2.5rem', fontWeight: 700 }}>
              {getGreeting()}, {formatDoctorName(user?.name)}
            </h1>
            <p className="text-secondary flex items-center gap-2" style={{ fontSize: '1.1rem' }}>
              <Calendar size={18} /> {formatDate(currentTime)}
            </p>
          </div>
          <div className="time-badge flex items-center gap-2">
            <Clock size={20} className="text-accent" />
            <span style={{ fontSize: '1.25rem', fontWeight: 600 }}>{formatTime(currentTime)}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-10 mt-4">
          <div className="spinner"></div>
          <span className="ml-3 text-secondary font-medium" style={{fontSize: '1.1rem'}}>Loading your dashboard...</span>
        </div>
      ) : (
        <>
          {/* Main Stats Grid */}
          <div className="grid grid-cols-3 gap-6 mb-6 mt-4">
            <div className="premium-card interactive stat-card" onClick={() => navigate('/today-patients')}>
              <div className="stat-icon-wrapper bg-blue-light">
                <Users size={32} color="#4f46e5" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Today's Patients</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="stat-value">{stats.patientsToday}</h3>
                  <span className="stat-indicator positive">
                    <Activity size={14} /> Live
                  </span>
                </div>
              </div>
              <div className="stat-footer">
                <span>View patient list</span>
                <ArrowRight size={16} />
              </div>
            </div>

            <div className="premium-card interactive stat-card" onClick={() => navigate('/medicine-stock')}>
              <div className="stat-icon-wrapper bg-red-light">
                <AlertTriangle size={32} color="#e11d48" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Low Stock Medicines</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="stat-value">{stats.lowStockCount}</h3>
                  {stats.lowStockCount > 0 ? (
                     <span className="stat-indicator negative">Needs Attention</span>
                  ) : (
                     <span className="stat-indicator positive">Stock OK</span>
                  )}
                </div>
              </div>
              <div className="stat-footer">
                <span>Manage inventory</span>
                <ArrowRight size={16} />
              </div>
            </div>

            <div className="premium-card interactive stat-card" onClick={() => navigate('/pending-dues')}>
              <div className="stat-icon-wrapper bg-yellow-light">
                <CreditCard size={32} color="#d97706" />
              </div>
              <div className="stat-content">
                <p className="stat-label">Pending Dues</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="stat-value">{stats.pendingDuesCount} <span style={{fontSize: '1rem', fontWeight: 500, color: '#86868b'}}>cases</span></h3>
                  {stats.pendingDuesAmount > 0 && (
                     <span className="stat-indicator warning">₹{stats.pendingDuesAmount} Total</span>
                  )}
                </div>
              </div>
              <div className="stat-footer">
                <span>View billing</span>
                <ArrowRight size={16} />
              </div>
            </div>
          </div>

          {/* Quick Actions Panel */}
          <div className="premium-card">
            <h3 className="section-title mb-4">Quick Actions</h3>
            <div className="grid grid-cols-3 gap-6">
              <button className="quick-action-btn" onClick={() => navigate('/add-patient')}>
                <div className="quick-action-icon bg-indigo-light">
                  <UserPlus size={20} color="#4338ca" />
                </div>
                <div className="quick-action-text">
                  <span className="title">New Patient Registration</span>
                  <span className="desc">Add a new patient record</span>
                </div>
              </button>
              
              <button className="quick-action-btn" onClick={() => navigate('/search-patient')}>
                <div className="quick-action-icon bg-emerald-light">
                  <FileText size={20} color="#047857" />
                </div>
                <div className="quick-action-text">
                  <span className="title">Search Patient Records</span>
                  <span className="desc">Find history & prescriptions</span>
                </div>
              </button>

              <button className="quick-action-btn" onClick={() => navigate('/medicine-stock')}>
                <div className="quick-action-icon bg-sky-light">
                  <Pill size={20} color="#0369a1" />
                </div>
                <div className="quick-action-text">
                  <span className="title">Update Medicine Stock</span>
                  <span className="desc">Manage clinic pharmacy</span>
                </div>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
