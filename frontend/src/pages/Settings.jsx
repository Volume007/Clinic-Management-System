import { useState, useEffect } from 'react';
import axios from 'axios';
import Card from '../components/Card';
import { Database, FolderOpen, Save, RefreshCw } from 'lucide-react';

const Settings = () => {
  const [dbInfo, setDbInfo] = useState({
    type: 'SQLite',
    size: 'Loading...',
    lastModified: 'Loading...',
    location: 'Loading...'
  });
  
  const [loading, setLoading] = useState(false);
  const [fetchingInfo, setFetchingInfo] = useState(true);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchDbInfo = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5001/api/db/info', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setDbInfo(res.data);
    } catch (error) {
      console.error('Error fetching database info:', error);
      setMessage({
        type: 'error',
        text: 'Failed to fetch database information: ' + (error.response?.data?.message || error.message)
      });
    } finally {
      setFetchingInfo(false);
    }
  };

  useEffect(() => {
    fetchDbInfo();
  }, []);

  const handleBackup = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5001/api/db/backup', {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data.success) {
        setMessage({
          type: 'success',
          text: `Database backed up successfully.\n\nBackup Location:\n${res.data.path}`
        });
        fetchDbInfo();
      } else {
        if (res.data.message !== 'Cancelled') {
          setMessage({
            type: 'error',
            text: 'Backup failed: ' + res.data.message
          });
        }
      }
    } catch (error) {
      console.error('Backup error:', error);
      setMessage({
        type: 'error',
        text: 'Backup failed: ' + (error.response?.data?.message || error.message)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('http://localhost:5001/api/db/restore', {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (res.data.success) {
        // Relaunch happens on backend after showMessageBox
        setMessage({
          type: 'success',
          text: 'Database restored successfully! Re-launching application...'
        });
      } else {
        if (res.data.message !== 'Cancelled') {
          setMessage({
            type: 'error',
            text: 'Restore failed: ' + res.data.message
          });
        }
      }
    } catch (error) {
      console.error('Restore error:', error);
      setMessage({
        type: 'error',
        text: 'Restore failed: ' + (error.response?.data?.message || error.message)
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFolder = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5001/api/db/open-folder', {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
    } catch (error) {
      console.error('Open folder error:', error);
      setMessage({
        type: 'error',
        text: 'Failed to open database folder: ' + (error.response?.data?.message || error.message)
      });
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }} className="fade-in">
      <h1 className="mb-4">Settings</h1>

      {message.text && (
        <div 
          style={{ 
            backgroundColor: message.type === 'success' ? '#ecfdf5' : '#fef2f2', 
            color: message.type === 'success' ? '#047857' : '#b91c1c', 
            padding: '1.25rem', 
            borderRadius: '8px', 
            marginBottom: '1.5rem',
            border: message.type === 'success' ? '1px solid #a7f3d0' : '1px solid #fca5a5',
            whiteSpace: 'pre-line',
            fontSize: '0.95rem',
            fontWeight: 500
          }}
        >
          {message.text}
        </div>
      )}

      {loading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', marginBottom: '1.5rem' }}>
          <div className="spinner"></div>
          <span style={{ color: 'var(--accent-color)', fontWeight: 500 }}>Operation in progress, please do not close the window...</span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6">
        {/* Database Actions */}
        <Card className="premium-card">
          <div className="flex items-center gap-3 mb-4">
            <div style={{ padding: '0.5rem', backgroundColor: '#eef2ff', borderRadius: '8px', color: 'var(--accent-color)', display: 'flex' }}>
              <Database size={22} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Database Management</h3>
          </div>
          
          <p className="text-secondary" style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Safely backup or restore the SQLite clinic database. Restoring replaces the current database, but automatically creates a safety backup first.
          </p>

          <div className="flex flex-col gap-3">
            <button 
              className="btn btn-primary" 
              onClick={handleBackup} 
              disabled={loading}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
            >
              <Save size={18} />
              <span>Backup Database</span>
            </button>

            <button 
              className="btn btn-secondary" 
              onClick={handleRestore} 
              disabled={loading}
              style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
            >
              <RefreshCw size={18} />
              <span>Restore Database</span>
            </button>
          </div>
        </Card>

        {/* Database Information */}
        <Card className="premium-card">
          <div className="flex items-center gap-3 mb-4">
            <div style={{ padding: '0.5rem', backgroundColor: '#d1fae5', borderRadius: '8px', color: '#047857', display: 'flex' }}>
              <FolderOpen size={22} />
            </div>
            <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Database Information</h3>
          </div>

          <div style={{ fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <div>
              <span className="text-secondary" style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Database Type</span>
              <span style={{ fontWeight: 600 }}>{dbInfo.type}</span>
            </div>
            
            <div>
              <span className="text-secondary" style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Database Size</span>
              <span style={{ fontWeight: 600 }}>{dbInfo.size}</span>
            </div>

            <div>
              <span className="text-secondary" style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Last Updated</span>
              <span style={{ fontWeight: 600 }}>{dbInfo.lastModified}</span>
            </div>

            <div>
              <span className="text-secondary" style={{ display: 'block', fontSize: '0.8rem', textTransform: 'uppercase', fontWeight: 600 }}>Database Location</span>
              <span 
                style={{ 
                  fontWeight: 500, 
                  fontSize: '0.8rem', 
                  wordBreak: 'break-all', 
                  backgroundColor: '#f5f5f7', 
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  display: 'inline-block',
                  marginTop: '2px'
                }}
              >
                {dbInfo.location}
              </span>
            </div>
          </div>

          <button 
            className="btn btn-secondary" 
            onClick={handleOpenFolder} 
            disabled={fetchingInfo}
            style={{ width: '100%', justifyContent: 'flex-start', padding: '0.75rem 1rem' }}
          >
            <FolderOpen size={18} />
            <span>Open Database Folder</span>
          </button>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
