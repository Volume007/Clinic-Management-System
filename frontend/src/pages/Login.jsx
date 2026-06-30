import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Card from '../components/Card';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please fill all fields');
      return;
    }

    const res = await login(username, password);
    if (res.success) {
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="login-wrapper" style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
      <div className="login-content-wrapper" style={{ width: '100%', maxWidth: '400px', padding: '1rem' }}>
        <Card className="glass-login-card" style={{ padding: '2.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
              <div style={{ 
                backgroundColor: 'rgba(39, 103, 73, 0.08)', 
                borderRadius: '50%', 
                width: '140px', 
                height: '140px', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: 'inset 0 2px 10px rgba(39, 103, 73, 0.1), 0 4px 15px rgba(0,0,0,0.05)',
                border: '1px solid rgba(39, 103, 73, 0.15)'
              }}>
                <img src="/logo.png?v=3" alt="Clinic Logo" style={{ maxHeight: '115px', maxWidth: '115px', objectFit: 'contain' }} />
              </div>
            </div>
            <p style={{ fontSize: '1.1rem', color: '#276749', fontWeight: 600, marginTop: '0.5rem', textShadow: '0 1px 2px rgba(255,255,255,0.5)' }}>Sign in to continue</p>
          </div>

          {error && (
            <div style={{ backgroundColor: 'rgba(255, 238, 238, 0.9)', color: 'var(--danger-color)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1.5rem', fontSize: '0.85rem', textAlign: 'center', border: '1px solid #ffcccc' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label style={{ fontWeight: 600, color: '#333' }}>Username</label>
              <input 
                type="text" 
                className="input-field login-input-interactive" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                placeholder="Enter username"
              />
            </div>
            <div className="form-group">
              <label style={{ fontWeight: 600, color: '#333' }}>Password</label>
              <input 
                type="password" 
                className="input-field login-input-interactive" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="Enter password"
              />
            </div>
            <button type="submit" className="btn btn-primary login-btn-interactive" style={{ width: '100%', marginTop: '1rem', padding: '0.75rem', fontSize: '1.05rem', fontWeight: 600, backgroundImage: 'linear-gradient(135deg, var(--accent-color), #005bb5)', border: 'none' }}>
              Login
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
