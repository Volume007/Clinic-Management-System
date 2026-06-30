import { useState, useEffect } from 'react';
import axios from 'axios';
import { Eye } from 'lucide-react';
import { Link } from 'react-router-dom';

const TodayPatients = () => {
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTodayPatients = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/patients/today');
      setPatients(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayPatients();
  }, []);

  return (
    <div>
      <h1 className="mb-4">Today's Patients</h1>

      {loading ? <p>Loading...</p> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Patient Name</th>
                <th>Mobile Number</th>
                <th>Disease / Symptoms</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {patients.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: 500 }}>{p.full_name}</td>
                  <td>{p.mobile_number}</td>
                  <td>{p.disease || 'N/A'}</td>
                  <td>
                    <Link to={`/search-patient?name=${p.full_name}&mobile=${p.mobile_number}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      <Eye size={16} /> View Details
                    </Link>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem' }}>No patients visited today.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TodayPatients;
