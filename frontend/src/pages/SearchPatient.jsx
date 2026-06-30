import { useState } from 'react';
import axios from 'axios';
import { Search, FileText, Trash2, CreditCard, CheckCircle, Lock } from 'lucide-react';
import { Link } from 'react-router-dom';
import Card from '../components/Card';

const SearchPatient = () => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [payAmount, setPayAmount] = useState('');
  const [isPaying, setIsPaying] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Auth Modal State
  const [authModal, setAuthModal] = useState({
    isOpen: false,
    actionType: null, // 'delete', 'clear', 'pay'
    actionPayload: null,
    password: '',
    loading: false,
    error: ''
  });

  const handleSearch = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setResults([]);

    if (!name || !mobile) {
      setErrorMsg('Both Name and Mobile Number are required for search.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5001/api/patients/search?name=${name}&mobile=${mobile}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setResults(res.data);
      if (res.data.length === 0) {
        setErrorMsg('No matching records found.');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  const requestAuth = (type, payload) => {
    setAuthModal({
      isOpen: true,
      actionType: type,
      actionPayload: payload,
      password: '',
      loading: false,
      error: ''
    });
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthModal(prev => ({ ...prev, loading: true, error: '' }));
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5001/api/auth/verify', 
        { password: authModal.password },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      
      // Auth success, execute the pending action
      if (authModal.actionType === 'delete') {
        await executeDelete(authModal.actionPayload);
      } else if (authModal.actionType === 'clear') {
        await executeClearDue(authModal.actionPayload);
      } else if (authModal.actionType === 'pay') {
        await executePayDues();
      }
      
      setAuthModal(prev => ({ ...prev, isOpen: false }));
    } catch (error) {
      setAuthModal(prev => ({ 
        ...prev, 
        loading: false, 
        error: error.response?.data?.message || 'Authentication failed' 
      }));
    }
  };

  const handleDelete = (id) => {
    if (!window.confirm('Are you sure you want to delete this record? This action will restore any deducted medicine stock.')) {
      return;
    }
    requestAuth('delete', id);
  };

  const executeDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5001/api/patients/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setResults(results.filter(visit => visit.id !== id));
      alert('Record deleted successfully.');
    } catch (error) {
      console.error('Delete error', error);
      alert('Failed to delete the record. Please try again.');
    }
  };

  const handleClearDue = (id) => {
    if (!window.confirm('Are you sure you want to clear the due for this visit?')) {
      return;
    }
    requestAuth('clear', id);
  };

  const executeClearDue = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5001/api/patients/clear-due/${id}`, {}, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      // Re-fetch data
      const res = await axios.get(`http://localhost:5001/api/patients/search?name=${name}&mobile=${mobile}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data) setResults(res.data);
    } catch (error) {
      console.error('Clear due error:', error.response?.data || error.message);
      alert(`Failed to clear due: ${error.response?.data?.message || error.message}`);
    }
  };

  const handlePayDues = () => {
    if (!payAmount || isNaN(payAmount) || Number(payAmount) <= 0) {
      alert('Please enter a valid amount.');
      return;
    }
    if (!window.confirm(`Are you sure you want to pay ₹${payAmount} towards the pending dues?`)) {
      return;
    }
    requestAuth('pay', null);
  };

  const executePayDues = async () => {
    setIsPaying(true);
    try {
      const token = localStorage.getItem('token');
      const payload = {
        name,
        mobile,
        amount: Number(payAmount)
      };
      
      await axios.post(`http://localhost:5001/api/patients/pay-dues`, payload, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      alert('Payment processed successfully.');
      setPayAmount('');
      
      // Re-fetch data
      const res = await axios.get(`http://localhost:5001/api/patients/search?name=${name}&mobile=${mobile}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data) setResults(res.data);
    } catch (error) {
      console.error('Pay dues error:', error.response?.data || error.message);
      alert(`Failed to process payment: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsPaying(false);
    }
  };

  const handleDownloadHistory = async () => {
    setIsExporting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`http://localhost:5001/api/patients/export-history-pdf`, {
        name,
        mobile
      }, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (res.data.success) {
        if (res.data.useBrowserPrint) {
          const printWindow = window.open('', '_blank');
          printWindow.document.write(res.data.htmlContent);
          printWindow.document.close();

          const safePatientName = name.replace(/[^a-zA-Z0-9]/g, '_');
          printWindow.document.title = `${safePatientName}_${mobile}_History`;

          printWindow.focus();
          setTimeout(() => {
            printWindow.print();
          }, 500);
        } else {
          alert('Patient history PDF saved successfully.');
        }
      } else {
        if (res.data.message !== 'Cancelled') {
          alert('Failed to export patient history: ' + res.data.message);
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export history: ' + (error.response?.data?.message || error.message));
    } finally {
      setIsExporting(false);
    }
  };

  const totalDues = results.reduce((sum, visit) => sum + (Number(visit.pending_amount) || 0), 0);

  return (
    <div style={{ position: 'relative' }}>
      <h1 className="mb-4">Search Patient History</h1>

      <Card className="mb-4">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="form-group mb-0" style={{ flex: 1 }}>
            <label>Patient Name</label>
            <input type="text" className="input-field" value={name} onChange={e => setName(e.target.value)} placeholder="Enter name" required />
          </div>
          <div className="form-group mb-0" style={{ flex: 1 }}>
            <label>Mobile Number</label>
            <input type="text" className="input-field" value={mobile} onChange={e => setMobile(e.target.value)} placeholder="Enter mobile number" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Search size={18} /> {loading ? 'Searching...' : 'Search'}
          </button>
        </form>
      </Card>

      {errorMsg && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{errorMsg}</div>}

      {results.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Visit History ({results.length} visits found)</h2>
            <button 
              onClick={handleDownloadHistory} 
              className="btn btn-secondary flex items-center gap-2" 
              style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
              disabled={isExporting}
            >
              <FileText size={16} /> 
              <span>{isExporting ? 'Exporting...' : 'Download Patient History'}</span>
            </button>
          </div>
          <div className="flex flex-col gap-4">
            {results.map((visit) => (
              <Card key={visit.id}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem' }}>{new Date(visit.visit_date).toLocaleDateString()}</h3>
                    <p className="text-secondary" style={{ fontSize: '0.9rem' }}>Disease/Symptoms: <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{visit.disease || 'N/A'}</span></p>
                  </div>
                  <div className="flex gap-2">
                    {Number(visit.pending_amount) > 0 && (
                      <button onClick={() => handleClearDue(visit.id)} className="btn" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem', backgroundColor: '#10b981', color: 'white' }}>
                        <CheckCircle size={16} /> Clear Due
                      </button>
                    )}
                    <button onClick={() => handleDelete(visit.id)} className="btn btn-danger" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      <Trash2 size={16} /> Delete
                    </button>
                    <Link to={`/print/${visit.id}`} target="_blank" className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      <FileText size={16} /> Print Prescription
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3" style={{ padding: '1rem', backgroundColor: '#fafafa', borderRadius: '8px' }}>
                  <div>
                    <p className="text-secondary mb-1" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Prescribed Medicines</p>
                    {visit.medicines && visit.medicines.length > 0 ? (
                      <ul style={{ listStyleType: 'none', fontSize: '0.9rem' }}>
                        {visit.medicines.map((m, idx) => (
                          <li key={idx} style={{ marginBottom: '0.25rem' }}>• {m.medicine_name} - {m.quantity} {m.type}</li>
                        ))}
                      </ul>
                    ) : (
                      <p style={{ fontSize: '0.9rem' }}>No medicines prescribed.</p>
                    )}
                  </div>
                  <div>
                    <p className="text-secondary mb-1" style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Billing Info</p>
                    <div style={{ fontSize: '0.9rem' }}>
                      <p>Total: ₹{visit.total_bill}</p>
                      <p>Paid: ₹{visit.paid_amount}</p>
                      <p>Pending: <span style={{ color: visit.pending_amount > 0 ? 'var(--danger-color)' : 'var(--success-color)', fontWeight: 600 }}>₹{visit.pending_amount}</span></p>
                    </div>
                  </div>
                </div>
                {visit.notes && (
                  <p style={{ fontSize: '0.9rem' }}><strong>Notes:</strong> {visit.notes}</p>
                )}
              </Card>
            ))}
          </div>

          {/* Total Dues Summary */}
          <Card className="mt-6" style={{ borderLeft: `4px solid ${totalDues > 0 ? 'var(--danger-color)' : 'var(--success-color)'}` }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div style={{
                  padding: '1rem', 
                  borderRadius: '12px', 
                  backgroundColor: totalDues > 0 ? '#fff1f2' : '#dcfce7',
                  color: totalDues > 0 ? 'var(--danger-color)' : 'var(--success-color)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <CreditCard size={28} />
                </div>
                <div>
                  <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.15rem', color: 'var(--text-primary)' }}>Account Summary</h3>
                  <p className="text-secondary" style={{ fontSize: '0.9rem', margin: 0 }}>Total pending amount across all visits</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ 
                  fontSize: '1.8rem', 
                  fontWeight: 800, 
                  color: totalDues > 0 ? 'var(--danger-color)' : 'var(--success-color)',
                  lineHeight: 1
                }}>
                  ₹{totalDues.toFixed(2)}
                </span>
                <p style={{ 
                  fontSize: '0.85rem', 
                  fontWeight: 600, 
                  marginTop: '0.25rem',
                  marginBottom: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: totalDues > 0 ? 'var(--danger-color)' : 'var(--success-color)' 
                }}>
                  {totalDues > 0 ? 'Payment Pending' : 'All Clear'}
                </p>
              </div>
            </div>
            {totalDues > 0 && (
              <div className="mt-4 pt-4" style={{ borderTop: '1px solid #fecdd3', display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: '0.9rem', color: '#9f1239', fontWeight: 500, marginBottom: '0.25rem', display: 'block' }}>Partial Payment Amount (₹)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={payAmount} 
                    onChange={e => setPayAmount(e.target.value)} 
                    placeholder="Enter amount to pay" 
                    min="1"
                    max={totalDues}
                    style={{ borderColor: '#fda4af' }}
                  />
                </div>
                <button onClick={handlePayDues} className="btn" disabled={isPaying} style={{ backgroundColor: '#e11d48', color: 'white', padding: '0.6rem 1.5rem', height: '42px' }}>
                  {isPaying ? 'Processing...' : 'Pay Now'}
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Auth Modal */}
      {authModal.isOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ width: '400px', backgroundColor: '#fff', padding: '2rem' }}>
            <div className="flex items-center gap-2 mb-4">
              <Lock size={20} color="var(--primary-color)" />
              <h3 style={{ margin: 0 }}>Authentication Required</h3>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1.5rem' }}>
              Please verify your identity by entering your login password to proceed with this sensitive action.
            </p>
            {authModal.error && (
              <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {authModal.error}
              </div>
            )}
            <form onSubmit={handleAuthSubmit}>
              <div className="form-group">
                <label>Password</label>
                <input 
                  type="password" 
                  className="input-field" 
                  value={authModal.password} 
                  onChange={e => setAuthModal({...authModal, password: e.target.value})} 
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  autoFocus
                  required 
                />
              </div>
              <div className="flex gap-3 justify-end mt-4">
                <button type="button" className="btn btn-secondary" onClick={() => setAuthModal(prev => ({ ...prev, isOpen: false }))}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={authModal.loading}>
                  {authModal.loading ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
};

export default SearchPatient;
