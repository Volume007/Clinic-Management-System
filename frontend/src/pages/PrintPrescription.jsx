import { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Printer } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const PrintPrescription = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Hide body scrollbar/background for print view
    document.body.style.backgroundColor = '#fff';
    
    const fetchPatient = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5001/api/patients/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setPatient(res.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatient();

    return () => {
      document.body.style.backgroundColor = '';
    };
  }, [id]);

  if (loading) return <div style={{ padding: '2rem' }}>Loading...</div>;
  if (!patient) return <div style={{ padding: '2rem' }}>Patient not found</div>;



  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem', backgroundColor: '#f0f4f8' }}>
      <style>
        {`
          @media print {
            body { background-color: #fff !important; }
            .no-print { display: none !important; }
            .print-area { 
              box-shadow: none !important; 
              border: none !important; 
              margin: 0 !important; 
              padding: 0 !important;
              width: 210mm !important;
              height: 297mm !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print-area * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            @page { margin: 0; size: auto; }
          }
        `}
      </style>

      {/* Controls - Hidden during print */}
      <div className="no-print flex justify-end mb-4">
        <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Printer size={18} /> Print Prescription
        </button>
      </div>

      {/* A4 Printable Area */}
      <div className="print-area" style={{ 
          width: '210mm', 
          height: '297mm', 
          margin: '0 auto', 
          backgroundColor: '#fff',
          backgroundImage: 'url(/prescription-pad.png)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)', 
          overflow: 'hidden',
          boxSizing: 'border-box'
        }}>
        
        {/* Patient Name */}
        <div style={{ position: 'absolute', top: '19.4%', left: '25%', fontSize: '15px', color: '#000', fontWeight: '700', width: '26%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {patient.full_name}
        </div>

        {/* Age */}
        <div style={{ position: 'absolute', top: '19.4%', left: '62%', fontSize: '15px', color: '#000', fontWeight: '700', width: '7%' }}>
          {patient.age}
        </div>

        {/* Sex */}
        <div style={{ position: 'absolute', top: '19.4%', left: '83.5%', fontSize: '15px', color: '#000', fontWeight: '700', width: '11%' }}>
          {patient.gender}
        </div>

        {/* Address */}
        <div style={{ position: 'absolute', top: '22.8%', left: '19.5%', fontSize: '15px', color: '#000', fontWeight: '700', width: '48%', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {patient.location || 'N/A'}
        </div>

        {/* Date */}
        <div style={{ position: 'absolute', top: '22.8%', left: '80.5%', fontSize: '15px', color: '#000', fontWeight: '700', width: '14%' }}>
          {new Date(patient.visit_date).toLocaleDateString()}
        </div>

        {/* Body Content / Medicines & Advice */}
        <div style={{ 
          position: 'absolute', 
          top: '30.0%', 
          left: '6%', 
          right: '6%', 
          bottom: '12%',
          display: 'flex',
          gap: '30px'
        }}>
          
          {/* Left Column: Diagnosis & Advice */}
          <div style={{ width: '32%', borderRight: '1px solid #e5e7eb', paddingRight: '15px', boxSizing: 'border-box' }}>
            {patient.disease && (
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#104f9c', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', borderBottom: '1px solid #bfdbfe', paddingBottom: '3px' }}>
                  Diagnosis
                </h4>
                <p style={{ margin: 0, fontSize: '14px', color: '#1f2937', fontWeight: '500' }}>
                  {patient.disease}
                </p>
              </div>
            )}

            {patient.notes && (
              <div>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#104f9c', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700', borderBottom: '1px solid #bfdbfe', paddingBottom: '3px' }}>
                  Advice / Notes
                </h4>
                <p style={{ margin: 0, fontSize: '13.5px', color: '#374151', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
                  {patient.notes}
                </p>
              </div>
            )}
          </div>

          {/* Right Column: Rx & Medicines */}
          <div style={{ width: '68%', paddingLeft: '5px', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: '15px' }}>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#104f9c', fontFamily: 'Georgia, serif', marginRight: '8px', lineHeight: '1' }}>Rₓ</span>
              <span style={{ fontSize: '12px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: '600' }}>Medicines / Treatment</span>
            </div>

            {patient.medicines && patient.medicines.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {patient.medicines.map((m, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px dashed #e5e7eb', paddingBottom: '6px', fontSize: '14.5px' }}>
                    <div>
                      <strong style={{ color: '#1f2937' }}>{idx + 1}. {m.medicine_name}</strong>
                    </div>
                    <div style={{ color: '#4b5563', fontWeight: '500' }}>
                      <span>{m.quantity} {m.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: '#9ca3af', fontStyle: 'italic' }}>No medicines prescribed.</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default PrintPrescription;
