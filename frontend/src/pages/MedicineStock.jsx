import { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import Card from '../components/Card';

const getSmartDefaults = (type) => {
  switch (type) {
    case 'Tablet': return { pack_size: 10, pack_unit: 'tablets/strip' };
    case 'Capsule': return { pack_size: 15, pack_unit: 'capsules/strip' };
    case 'Bottle': return { pack_size: 100, pack_unit: 'ml' };
    case 'Injection': return { pack_size: 1, pack_unit: 'vial' };
    default: return { pack_size: 1, pack_unit: 'units' };
  }
};

const medicineTypes = ['Tablet', 'Capsule', 'Bottle', 'Injection'];
const packUnits = ['tablets/strip', 'capsules/strip', 'ml', 'vial'];

const formatStock = (quantity, packSize) => {
  if (!packSize || packSize <= 1) return `${quantity}`;
  const packs = Math.floor(quantity / packSize);
  const loose = quantity % packSize;
  if (packs > 0 && loose > 0) return `${quantity} (${packs} packs, ${loose} loose)`;
  if (packs > 0) return `${quantity} (${packs} packs)`;
  return `${quantity} loose`;
};

const MedicineStock = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMed, setNewMed] = useState({
    medicine_name: '',
    medicine_type: 'Tablet',
    pack_size: 10,
    pack_unit: 'tablets/strip',
    stock_quantity: 0,
    stock_added_date: new Date().toISOString().split('T')[0]
  });

  // Edit states
  const [editMedId, setEditMedId] = useState(null);
  const [editMed, setEditMed] = useState({});

  // Delete states
  const [deleteMedId, setDeleteMedId] = useState(null);

  async function fetchMedicines() {
    try {
      const res = await axios.get('http://localhost:5001/api/medicines');
      setMedicines(res.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMedicines();
  }, []);

  const handleNewMedTypeChange = (e) => {
    const type = e.target.value;
    const defaults = getSmartDefaults(type);
    setNewMed({ ...newMed, medicine_type: type, ...defaults });
  };

  const handleEditMedTypeChange = (e) => {
    const type = e.target.value;
    const defaults = getSmartDefaults(type);
    setEditMed({ ...editMed, medicine_type: type, ...defaults });
  };

  const handleAddMedicine = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5001/api/medicines', newMed);
      setShowAddForm(false);
      setNewMed({
        medicine_name: '',
        medicine_type: 'Tablet',
        pack_size: 10,
        pack_unit: 'tablets/strip',
        stock_quantity: 0,
        stock_added_date: new Date().toISOString().split('T')[0]
      });
      fetchMedicines();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to add medicine');
    }
  };

  const startEdit = (med) => {
    setEditMedId(med.medicine_id);
    setEditMed({
      medicine_name: med.medicine_name,
      medicine_type: med.medicine_type,
      pack_size: med.pack_size,
      pack_unit: med.pack_unit,
      stock_quantity: med.stock_quantity,
    });
  };

  const saveEdit = async () => {
    try {
      await axios.put(`http://localhost:5001/api/medicines/${editMedId}`, editMed);
      setEditMedId(null);
      fetchMedicines();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to update medicine');
    }
  };

  const confirmDelete = async () => {
    if (!deleteMedId) return;
    try {
      await axios.delete(`http://localhost:5001/api/medicines/${deleteMedId}`);
      setDeleteMedId(null);
      fetchMedicines();
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || 'Failed to delete medicine');
      setDeleteMedId(null);
    }
  };

  const filteredMedicines = medicines.filter(m => 
    m.medicine_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.medicine_type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ position: 'relative' }}>
      <div className="flex justify-between items-center mb-4">
        <h1>Medicine Stock</h1>
        <div className="flex gap-4 items-center">
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
            <input 
              type="text" 
              className="input-field" 
              placeholder="Search medicines..." 
              style={{ paddingLeft: '35px', width: '250px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button className="btn btn-primary flex items-center gap-2" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={18} /> New Medicine
          </button>
        </div>
      </div>

      {showAddForm && (
        <Card className="mb-4" style={{ backgroundColor: '#fafafa' }}>
          <h3 className="mb-3">Add New Medicine</h3>
          <form onSubmit={handleAddMedicine} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="form-group mb-0">
              <label>Medicine Name</label>
              <input type="text" className="input-field" value={newMed.medicine_name} onChange={e => setNewMed({...newMed, medicine_name: e.target.value})} required />
            </div>
            <div className="form-group mb-0">
              <label>Medicine Type</label>
              <select className="input-field" value={newMed.medicine_type} onChange={handleNewMedTypeChange}>
                {medicineTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group mb-0">
              <label>Pack Size</label>
              <input type="number" className="input-field" value={newMed.pack_size} onChange={e => setNewMed({...newMed, pack_size: e.target.value})} required />
            </div>
            <div className="form-group mb-0">
              <label>Pack Unit</label>
              <select className="input-field" value={newMed.pack_unit} onChange={e => setNewMed({...newMed, pack_unit: e.target.value})}>
                {packUnits.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group mb-0">
              <label>Initial Stock (Packs/Strips)</label>
              <div className="flex gap-2">
                <input type="number" className="input-field" 
                  value={newMed.stock_quantity / (newMed.pack_size || 1) || 0} 
                  onChange={e => setNewMed({...newMed, stock_quantity: Math.max(0, parseInt(e.target.value || 0) * (newMed.pack_size || 1))})} 
                  min="0" required />
              </div>
              <small className="text-secondary" style={{ fontSize: '0.8rem', marginTop: '4px', display: 'block' }}>
                Total Units: {newMed.stock_quantity}
              </small>
            </div>
            <div className="form-group mb-0">
              <label>Stock Added Date</label>
              <input type="date" className="input-field" value={newMed.stock_added_date} onChange={e => setNewMed({...newMed, stock_added_date: e.target.value})} required />
            </div>
            <div className="md:col-span-3 mt-2 flex justify-end">
              <button type="submit" className="btn btn-primary" style={{ minWidth: '150px' }}>Save Medicine</button>
            </div>
          </form>
        </Card>
      )}

      {loading ? <p>Loading...</p> : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Medicine Name</th>
                <th>Type</th>
                <th>Pack Info</th>
                <th>Stock Quantity</th>
                <th>Stock Added Date</th>
                <th style={{ width: '180px', textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMedicines.map(med => (
                <tr key={med.medicine_id}>
                  {editMedId === med.medicine_id ? (
                    // Edit Row
                    <>
                      <td><input type="text" className="input-field" value={editMed.medicine_name} onChange={e => setEditMed({...editMed, medicine_name: e.target.value})} style={{ padding: '0.4rem' }}/></td>
                      <td>
                        <select className="input-field" value={editMed.medicine_type} onChange={handleEditMedTypeChange} style={{ padding: '0.4rem' }}>
                          {medicineTypes.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          <input type="number" className="input-field" value={editMed.pack_size} onChange={e => setEditMed({...editMed, pack_size: e.target.value})} style={{ padding: '0.4rem', width: '60px' }}/>
                          <select className="input-field" value={editMed.pack_unit} onChange={e => setEditMed({...editMed, pack_unit: e.target.value})} style={{ padding: '0.4rem', width: '100px' }}>
                            {packUnits.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                        </div>
                      </td>
                      <td><input type="number" className="input-field" value={editMed.stock_quantity} onChange={e => setEditMed({...editMed, stock_quantity: e.target.value})} min="0" style={{ padding: '0.4rem', width: '80px' }}/></td>
                      <td>{new Date(med.stock_added_date).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2 justify-center">
                          <button className="btn btn-primary" onClick={saveEdit} style={{ padding: '0.4rem 0.8rem' }}>Save</button>
                          <button className="btn btn-secondary" onClick={() => setEditMedId(null)} style={{ padding: '0.4rem 0.8rem' }}>Cancel</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    // View Row
                    <>
                      <td style={{ fontWeight: 500 }}>{med.medicine_name}</td>
                      <td>{med.medicine_type}</td>
                      <td>{med.pack_size} {med.pack_unit}</td>
                      <td>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '0.85rem',
                          fontWeight: 500,
                          backgroundColor: med.stock_quantity < med.pack_size ? '#fee2e2' : '#dcfce7',
                          color: med.stock_quantity < med.pack_size ? '#991b1b' : '#166534'
                        }}>
                          <span style={{ fontSize: '10px' }}>{med.stock_quantity < med.pack_size ? '🔴' : '🟢'}</span>
                          {formatStock(med.stock_quantity, med.pack_size)} {med.stock_quantity < med.pack_size ? 'Low Stock' : 'Normal'}
                        </span>
                      </td>
                      <td>{new Date(med.stock_added_date).toLocaleDateString()}</td>
                      <td>
                        <div className="flex gap-2 justify-center">
                          <button className="btn btn-secondary flex items-center justify-center" onClick={() => startEdit(med)} style={{ padding: '0.4rem', width: '32px', height: '32px' }} title="Edit">
                            <Edit2 size={16} />
                          </button>
                          <button className="btn btn-secondary flex items-center justify-center" onClick={() => setDeleteMedId(med.medicine_id)} style={{ padding: '0.4rem', width: '32px', height: '32px', color: 'var(--danger-color)' }} title="Delete">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
              {filteredMedicines.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem' }}>No medicines found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteMedId && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <Card style={{ width: '400px', backgroundColor: '#fff', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>Delete Medicine</h3>
            <p style={{ marginBottom: '2rem', color: '#666' }}>Are you sure you want to delete this medicine? This action cannot be undone.</p>
            <div className="flex gap-4 justify-center">
              <button className="btn btn-secondary" onClick={() => setDeleteMedId(null)} style={{ padding: '0.6rem 1.5rem' }}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmDelete} style={{ padding: '0.6rem 1.5rem', backgroundColor: 'var(--danger-color)' }}>Delete</button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MedicineStock;
