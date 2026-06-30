import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Printer } from 'lucide-react';

const PrintPrescription = () => {
  const { id } = useParams();
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);

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
              width: 100% !important;
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
          minHeight: '297mm', 
          margin: '0 auto', 
          backgroundColor: '#fff',
          backgroundImage: 'url(/Prescription.png?v=2)',
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
          position: 'relative',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)', 
          overflow: 'hidden' 
        }}>
        
        {/* Date (दिनाँक) */}
        <div style={{ position: 'absolute', top: '76.5mm', left: '165mm', fontSize: '15px', color: '#000', fontWeight: 'bold' }}>
          {new Date(patient.visit_date).toLocaleDateString()}
        </div>

        {/* Patient Name - Wraps but lifted up to avoid baseline touch */}
        <div style={{ position: 'absolute', top: '85mm', left: '40mm', fontSize: '16px', color: '#000', fontWeight: 'bold', width: '33mm', whiteSpace: 'normal', wordWrap: 'break-word', lineHeight: '1.0' }}>
          {patient.full_name}
        </div>

        {/* Age */}
        <div style={{ position: 'absolute', top: '86.5mm', left: '123mm', fontSize: '16px', color: '#000', fontWeight: 'bold' }}>
          {patient.age}
        </div>

        {/* Sex */}
        <div style={{ position: 'absolute', top: '86.5mm', left: '160mm', fontSize: '16px', color: '#000', fontWeight: 'bold' }}>
          {patient.gender}
        </div>

        {/* Content / Medicines / Notes (Positioned below Rx in the right column) */}
        <div style={{ position: 'absolute', top: '120mm', left: '78mm', right: '15mm', bottom: '15mm' }}>
          
          {/* Diagnosis */}
          {patient.disease && (
            <div style={{ marginBottom: '20px', fontSize: '16px', color: '#333', textAlign: 'right' }}>
              <strong>Diagnosis:</strong> {patient.disease}
            </div>
          )}

          {/* Medicines List */}
          {patient.medicines && patient.medicines.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {patient.medicines.map((m, idx) => (
                <div key={idx} style={{ fontSize: '16px', color: '#222' }}>
                  <span style={{ fontWeight: '500' }}>{idx + 1}. {m.medicine_name}</span> 
                  <span style={{ marginLeft: '15px', color: '#555' }}>&mdash; {m.quantity} {m.type}</span>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        {/* Advice / Notes (Positioned in the 'Adv for' left column) */}
        {patient.notes && (
          <div style={{ position: 'absolute', top: '106mm', left: '15mm', width: '58mm', fontSize: '15px', color: '#222', whiteSpace: 'pre-wrap', lineHeight: '1.4' }}>
            {patient.notes}
          </div>
        )}
      </div>
    </div>
  );
};

export default PrintPrescription;
