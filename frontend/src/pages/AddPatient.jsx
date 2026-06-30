import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Trash2 } from 'lucide-react';
import Card from '../components/Card';

const AddPatient = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: 'Male',
    mobileNumber: '',
    location: '',
    disease: '',
    visitDate: new Date().toISOString().split('T')[0],
    notes: '',
    totalBill: 0,
    paidAmount: 0,
  });

  const [medicinesList, setMedicinesList] = useState([]); // from DB
  const [patientMedicines, setPatientMedicines] = useState([]); // dynamically added by doctor
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchMedicines = async () => {
    try {
      const res = await axios.get('http://localhost:5001/api/medicines');
      setMedicinesList(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addMedicineRow = () => {
    setPatientMedicines([...patientMedicines, { medicineId: '', quantity: 1, type: 'Tablet' }]);
  };

  const removeMedicineRow = (index) => {
    const list = [...patientMedicines];
    list.splice(index, 1);
    setPatientMedicines(list);
  };

  const handleMedicineChange = (index, field, value) => {
    const list = [...patientMedicines];
    list[index][field] = value;
    setPatientMedicines(list);
  };

  const calculatePending = () => {
    const total = parseFloat(formData.totalBill) || 0;
    const paid = parseFloat(formData.paidAmount) || 0;
    return total - paid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    setErrorMsg('');

    // Validate medicines
    const validMedicines = patientMedicines.filter(m => m.medicineId && m.quantity > 0);
    
    const payload = {
      ...formData,
      pendingAmount: calculatePending(),
      medicines: validMedicines
    };

    try {
      await axios.post('http://localhost:5001/api/patients', payload);
      setSuccessMsg('Patient and prescription saved successfully!');
      // Reset form
      setFormData({
        fullName: '', age: '', gender: 'Male', mobileNumber: '', location: '',
        disease: '', visitDate: new Date().toISOString().split('T')[0], notes: '',
        totalBill: 0, paidAmount: 0
      });
      setPatientMedicines([]);
      fetchMedicines(); // Refresh stock internally
    } catch (error) {
      setErrorMsg(error.response?.data?.message || 'Failed to save patient');
    }
  };

  return (
    <div>
      <h1 className="mb-4">Add Patient & Prescription</h1>
      
      {successMsg && <div style={{ background: '#ecfdf5', color: '#047857', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{successMsg}</div>}
      {errorMsg && <div style={{ background: '#fef2f2', color: '#b91c1c', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>{errorMsg}</div>}

      <form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <h2 className="mb-3" style={{ fontSize: '1.2rem' }}>Patient Details</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" className="input-field" name="fullName" value={formData.fullName} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Mobile Number</label>
              <input type="text" className="input-field" name="mobileNumber" value={formData.mobileNumber} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Age</label>
              <input type="number" className="input-field" name="age" value={formData.age} onChange={handleInputChange} required />
            </div>
            <div className="form-group">
              <label>Gender</label>
              <select className="input-field" name="gender" value={formData.gender} onChange={handleInputChange}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Location</label>
              <input type="text" className="input-field" name="location" value={formData.location} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Visit Date</label>
              <input type="date" className="input-field" name="visitDate" value={formData.visitDate} onChange={handleInputChange} required />
            </div>
          </div>
          
          <div className="form-group mt-2">
            <label>Disease / Symptoms</label>
            <input type="text" className="input-field" name="disease" value={formData.disease} onChange={handleInputChange} />
          </div>
          
          <div className="form-group">
            <label>Notes</label>
            <textarea className="input-field" name="notes" rows="2" value={formData.notes} onChange={handleInputChange}></textarea>
          </div>
        </Card>

        <Card className="mb-4">
          <div className="flex justify-between items-center mb-3">
            <h2 style={{ fontSize: '1.2rem' }}>Medicines</h2>
            <button type="button" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={addMedicineRow}>
              <Plus size={16} /> Add Medicine
            </button>
          </div>
          
          {patientMedicines.length === 0 ? (
            <p className="text-secondary" style={{ fontSize: '0.9rem', fontStyle: 'italic' }}>No medicines added yet. Click 'Add Medicine' to prescribe.</p>
          ) : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Medicine Name</th>
                    <th style={{ width: '150px' }}>Quantity</th>
                    <th style={{ width: '150px' }}>Type</th>
                    <th style={{ width: '80px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {patientMedicines.map((med, idx) => (
                    <tr key={idx}>
                      <td>
                        <select 
                          className="input-field" 
                          value={med.medicineId} 
                          onChange={(e) => handleMedicineChange(idx, 'medicineId', e.target.value)}
                          required
                        >
                          <option value="">Select Medicine</option>
                          {medicinesList.map(m => (
                            <option key={m.medicine_id} value={m.medicine_id}>
                              {m.medicine_name} (Stock: {m.stock_quantity} total units)
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input 
                          type="number" 
                          min="1"
                          className="input-field" 
                          value={med.quantity} 
                          onChange={(e) => handleMedicineChange(idx, 'quantity', e.target.value)}
                          required
                        />
                      </td>
                      <td>
                        <select 
                          className="input-field" 
                          value={med.type} 
                          onChange={(e) => handleMedicineChange(idx, 'type', e.target.value)}
                        >
                          <option value="Tablet">Tablet</option>
                          <option value="Strip">Strip</option>
                          <option value="Capsule">Capsule</option>
                          <option value="Bottle">Bottle</option>
                          <option value="Injection">Injection</option>
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button type="button" onClick={() => removeMedicineRow(idx)} style={{ background: 'none', border: 'none', color: 'var(--danger-color)', cursor: 'pointer' }}>
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card className="mb-4">
          <h2 className="mb-3" style={{ fontSize: '1.2rem' }}>Billing</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="form-group">
              <label>Total Bill (₹)</label>
              <input type="number" className="input-field" name="totalBill" value={formData.totalBill} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Paid Amount (₹)</label>
              <input type="number" className="input-field" name="paidAmount" value={formData.paidAmount} onChange={handleInputChange} />
            </div>
            <div className="form-group">
              <label>Pending Amount (₹)</label>
              <input type="text" className="input-field" value={calculatePending()} readOnly style={{ backgroundColor: '#f9fafb', fontWeight: 600 }} />
            </div>
          </div>
        </Card>

        <div className="flex justify-end gap-4 mb-4">
          <button type="button" className="btn btn-secondary">Cancel</button>
          <button type="submit" className="btn btn-primary">Save Patient</button>
        </div>
      </form>
    </div>
  );
};

export default AddPatient;
