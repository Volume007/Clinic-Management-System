import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const PendingDues = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDues = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/patients/dues');
      setPatients(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDues();
  }, []);

  return (
    <div>
      <h1 className="mb-4">Pending Dues</h1>

      {loading ? <p>Loading...</p> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Mobile Number</th>
                <th>Last Visit Date</th>
                <th>Pending Amount (₹)</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.full_name}</td>
                  <td>{p.mobile_number}</td>
                  <td>{new Date(p.visit_date).toLocaleDateString()}</td>
                  <td>
                    <span style={{ color: 'var(--danger-color)', fontWeight: 600 }}>
                      ₹{p.pending_amount}
                    </span>
                  </td>
                  <td>
                    {/* Re-use search with params or specific view */}
                    <Link to={`/search-patient?name=${p.full_name}&mobile=${p.mobile_number}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      <Eye size={16} /> View History
                    </Link>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>No pending dues found!</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default PendingDues;
