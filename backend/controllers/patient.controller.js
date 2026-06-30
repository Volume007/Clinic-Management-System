const db = require('../config/db');

// Add Patient + Medicines (Transaction)
const addPatient = async (req, res) => {
  const {
    fullName, age, gender, mobileNumber, location, disease,
    visitDate, notes, totalBill, paidAmount, pendingAmount,
    medicines // Array of { medicineId, quantity, type }
  } = req.body;

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Insert Patient
    const [patientResult] = await connection.query(
      `INSERT INTO patients (full_name, age, gender, mobile_number, location, disease, visit_date, notes, total_bill, paid_amount, pending_amount) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [fullName, age, gender, mobileNumber, location, disease, visitDate, notes, totalBill, paidAmount, pendingAmount]
    );

    const patientId = patientResult.insertId;

    // 2. Process Medicines
    if (medicines && medicines.length > 0) {
      for (const med of medicines) {
        const { medicineId, quantity, type } = med;
        
        // Get current medicine details to know pack_size and medicine_name
        const [medRows] = await connection.query(`SELECT medicine_name, pack_size FROM medicines WHERE medicine_id = ?`, [medicineId]);
        if (medRows.length === 0) {
           throw new Error(`Medicine with ID ${medicineId} not found`);
        }
        
        const { medicine_name, pack_size: packSize } = medRows[0];

        // Insert into patient_medicines
        await connection.query(
          `INSERT INTO patient_medicines (patient_record_id, medicine_name, quantity_given, medicine_type, allotted_date) VALUES (?, ?, ?, ?, CURRENT_DATE)`,
          [patientId, medicine_name, quantity, type]
        );

        let unitsToReduce = 0;

        if (type === 'Strip' || type === 'Packet') {
          unitsToReduce = quantity * packSize;
        } else {
          unitsToReduce = quantity;
        }

        // Reduce stock from medicines table
        await connection.query(
          `UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE medicine_id = ?`,
          [unitsToReduce, medicineId]
        );
      }
    }

    await connection.commit();
    res.status(201).json({ message: 'Patient added successfully', patientId });

  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Transaction Error:', error);
    res.status(500).json({ message: 'Failed to add patient', error: error.message });
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Search Patients
const searchPatients = async (req, res) => {
  const { name, mobile } = req.query;

  if (!name || !mobile) {
    return res.status(400).json({ message: 'Both Name and Mobile Number are required for search' });
  }

  try {
    const [patients] = await db.query(
      `SELECT patient_record_id as id, full_name, age, gender, mobile_number, location, pending_amount, visit_date, disease, total_bill, paid_amount, notes FROM patients WHERE full_name LIKE ? AND mobile_number = ? ORDER BY visit_date DESC`,
      [`%${name}%`, mobile]
    );

    // Fetch medicines for each visit
    for (let i = 0; i < patients.length; i++) {
      const patientId = patients[i].id;
      const [medicines] = await db.query(
        `SELECT medicine_name, quantity_given as quantity, medicine_type as type 
         FROM patient_medicines 
         WHERE patient_record_id = ?`,
        [patientId]
      );
      patients[i].medicines = medicines;
    }

    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get Today's Patients
const getTodayPatients = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [patients] = await db.query(
      `SELECT patient_record_id as id, full_name, mobile_number, disease, visit_date 
       FROM patients 
       WHERE DATE(visit_date) = ? 
       ORDER BY patient_record_id DESC`,
      [today]
    );
    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get Pending Dues (All patients with pending amount > 0)
const getPendingDues = async (req, res) => {
  try {
    const [patients] = await db.query(
      `SELECT patient_record_id as id, full_name, mobile_number, pending_amount, visit_date 
       FROM patients 
       WHERE pending_amount > 0 
       ORDER BY visit_date DESC`
    );
    res.json(patients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get specific patient details (for prescription print or dues history)
const getPatientById = async (req, res) => {
  try {
    const [patients] = await db.query(`SELECT patient_record_id as id, full_name, mobile_number, pending_amount, visit_date, disease, total_bill, paid_amount, notes, age, gender, location FROM patients WHERE patient_record_id = ?`, [req.params.id]);
    if (patients.length === 0) return res.status(404).json({ message: 'Patient not found' });
    
    const patient = patients[0];
    const [medicines] = await db.query(
      `SELECT medicine_name, quantity_given as quantity, medicine_type as type 
       FROM patient_medicines 
       WHERE patient_record_id = ?`,
      [req.params.id]
    );
    patient.medicines = medicines;

    res.json(patient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete Patient Visit
const deletePatient = async (req, res) => {
  let connection;
  try {
    const patientId = req.params.id;
    connection = await db.getConnection();
    await connection.beginTransaction();

    // 1. Fetch medicines given in this visit to restore stock
    const [medicines] = await connection.query(
      `SELECT medicine_name, quantity_given, medicine_type FROM patient_medicines WHERE patient_record_id = ?`,
      [patientId]
    );

    // 2. Restore stock
    for (const med of medicines) {
      const { medicine_name, quantity_given, medicine_type } = med;
      
      const [medRows] = await connection.query(`SELECT medicine_id, pack_size FROM medicines WHERE medicine_name = ?`, [medicine_name]);
      if (medRows.length > 0) {
        const { medicine_id, pack_size } = medRows[0];
        let unitsToRestore = 0;
        if (medicine_type === 'Strip' || medicine_type === 'Packet') {
          unitsToRestore = quantity_given * pack_size;
        } else {
          unitsToRestore = quantity_given;
        }
        
        await connection.query(
          `UPDATE medicines SET stock_quantity = stock_quantity + ? WHERE medicine_id = ?`,
          [unitsToRestore, medicine_id]
        );
      }
    }

    // 3. Delete from patient_medicines
    await connection.query(`DELETE FROM patient_medicines WHERE patient_record_id = ?`, [patientId]);

    // 4. Delete from patients
    await connection.query(`DELETE FROM patients WHERE patient_record_id = ?`, [patientId]);

    await connection.commit();
    res.json({ message: 'Patient record deleted successfully' });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Delete Error:', error);
    res.status(500).json({ message: 'Failed to delete patient record', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

// Clear specific visit due
const clearPatientDue = async (req, res) => {
  try {
    const patientId = req.params.id;
    console.log('Clearing due for visit ID:', patientId);
    
    // Get current pending amount
    const [visits] = await db.query(`SELECT pending_amount, paid_amount FROM patients WHERE patient_record_id = ?`, [patientId]);
    if (visits.length === 0) {
      console.log('Visit not found for ID:', patientId);
      return res.status(404).json({ message: 'Visit not found' });
    }
    
    const visit = visits[0];
    const newPaidAmount = Number(visit.paid_amount || 0) + Number(visit.pending_amount || 0);
    
    await db.query(
      `UPDATE patients SET pending_amount = 0, paid_amount = ? WHERE patient_record_id = ?`,
      [newPaidAmount, patientId]
    );
    
    console.log('Due cleared successfully for visit ID:', patientId);
    res.json({ message: 'Due cleared successfully' });
  } catch (error) {
    console.error('Clear Due Error:', error);
    res.status(500).json({ message: 'Failed to clear due', error: error.message });
  }
};

// Pay multiple dues across visits for a patient
const payDues = async (req, res) => {
  const { name, mobile, amount } = req.body;
  let paymentAmount = Number(amount);
  
  console.log('Processing payment:', { name, mobile, amount });

  if (!mobile || isNaN(paymentAmount) || paymentAmount <= 0) {
    return res.status(400).json({ message: 'Valid mobile number and amount are required' });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Fetch all visits with pending amounts for this mobile number, ordered by oldest first
    // We optionally match the name but prioritize the mobile number which is unique.
    const [visits] = await connection.query(
      `SELECT patient_record_id, pending_amount, paid_amount 
       FROM patients 
       WHERE mobile_number = ? AND pending_amount > 0 
       ORDER BY visit_date ASC, patient_record_id ASC`,
      [mobile]
    );

    console.log(`Found ${visits.length} visits with pending dues for mobile: ${mobile}`);

    for (const visit of visits) {
      if (paymentAmount <= 0) break;

      const currentPending = Number(visit.pending_amount || 0);
      const currentPaid = Number(visit.paid_amount || 0);

      let amountToDeduct = 0;
      if (paymentAmount >= currentPending) {
        amountToDeduct = currentPending;
      } else {
        amountToDeduct = paymentAmount;
      }

      const newPending = currentPending - amountToDeduct;
      const newPaid = currentPaid + amountToDeduct;

      await connection.query(
        `UPDATE patients SET pending_amount = ?, paid_amount = ? WHERE patient_record_id = ?`,
        [newPending, newPaid, visit.patient_record_id]
      );

      console.log(`Updated visit ${visit.patient_record_id}: Paid ${amountToDeduct}, New Pending: ${newPending}`);
      paymentAmount -= amountToDeduct;
    }

    await connection.commit();
    console.log('Payment transaction committed. Remaining amount:', paymentAmount);
    res.json({ message: 'Payment processed successfully', remainingPayment: paymentAmount });
  } catch (error) {
    if (connection) await connection.rollback();
    console.error('Pay Dues Error:', error);
    res.status(500).json({ message: 'Failed to process payment', error: error.message });
  } finally {
    if (connection) connection.release();
  }
};

const exportHistoryPdf = async (req, res) => {
  const { name, mobile } = req.body;

  if (!name || !mobile) {
    return res.status(400).json({ message: 'Both Name and Mobile Number are required for export' });
  }

  try {
    // Helper to format date as DD MMM YYYY, hh:mm AM/PM
    const formatReportDateTime = (date) => {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const day = String(date.getDate()).padStart(2, '0');
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const hoursStr = String(hours).padStart(2, '0');
      return `${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`;
    };

    // 1. Fetch doctor details
    const [doctors] = await db.query('SELECT doctor_name FROM doctors LIMIT 1');
    const doctorName = doctors.length > 0 ? doctors[0].doctor_name : 'Dr. Bimal Sharma';

    // 2. Fetch all visits chronologically
    const [visits] = await db.query(
      `SELECT patient_record_id as id, full_name, age, gender, mobile_number, location, pending_amount, visit_date, disease, total_bill, paid_amount, notes FROM patients WHERE full_name LIKE ? AND mobile_number = ? ORDER BY visit_date ASC`,
      [`%${name}%`, mobile]
    );

    if (visits.length === 0) {
      return res.status(404).json({ message: 'No records found for this patient' });
    }

    const patientName = visits[0].full_name;
    const patientGender = visits[0].gender || 'N/A';
    const patientAge = visits[0].age || 'N/A';
    const patientMobile = visits[0].mobile_number;
    const patientAddress = visits[0].location || 'N/A';

    // Fetch medicines for each visit
    for (let i = 0; i < visits.length; i++) {
      const visitId = visits[i].id;
      const [medicines] = await db.query(
        `SELECT medicine_name, quantity_given as quantity, medicine_type as type 
         FROM patient_medicines 
         WHERE patient_record_id = ?`,
        [visitId]
      );
      visits[i].medicines = medicines;
    }

    // Compute Totals
    const totalVisits = visits.length;
    const totalBilled = visits.reduce((sum, v) => sum + (Number(v.total_bill) || 0), 0);
    const totalPaid = visits.reduce((sum, v) => sum + (Number(v.paid_amount) || 0), 0);
    const totalPending = visits.reduce((sum, v) => sum + (Number(v.pending_amount) || 0), 0);

    // Format suggested filename
    const safePatientName = patientName.replace(/[^a-zA-Z0-9]/g, '_');
    const defaultFilename = `${safePatientName}_${patientMobile}_History.pdf`;

    let isElectron = false;
    try {
      if (process.versions && process.versions.electron) {
        isElectron = true;
      }
    } catch (e) {
      isElectron = false;
    }

    let filePath = null;
    if (isElectron) {
      const { dialog, BrowserWindow } = require('electron');
      const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];

      const { filePath: selectedPath, canceled } = await dialog.showSaveDialog(win, {
        title: 'Save Patient History PDF',
        defaultPath: defaultFilename,
        filters: [{ name: 'PDF Document', extensions: ['pdf'] }]
      });

      if (canceled || !selectedPath) {
        return res.json({ success: false, message: 'Cancelled' });
      }
      filePath = selectedPath;
    }

    const formattedDate = formatReportDateTime(new Date());

    let visitsHtml = '';
    visits.forEach((v, index) => {
      const visitDateStr = new Date(v.visit_date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      let medsHtml = '';
      if (v.medicines && v.medicines.length > 0) {
        v.medicines.forEach((m) => {
          medsHtml += `<li>${m.medicine_name} &mdash; ${m.quantity} ${m.type}</li>`;
        });
      } else {
        medsHtml = '<li>No medicines prescribed.</li>';
      }

      const notesHtml = v.notes 
        ? `<div class="notes-section">
             <h4>Doctor's Notes</h4>
             <p>${v.notes.replace(/\n/g, '<br>')}</p>
           </div>`
        : '';

      const pendingColor = Number(v.pending_amount) > 0 ? '#e30000' : '#00a82d';

      visitsHtml += `
        <div class="visit-card">
          <div class="visit-header">
            <div class="visit-date">Visit #${index + 1} - ${visitDateStr}</div>
            <div class="visit-disease">Diagnosis: ${v.disease || 'N/A'}</div>
          </div>
          <div class="visit-details">
            <div class="medicines-list">
              <h4>Prescribed Medicines</h4>
              <ul>
                ${medsHtml}
              </ul>
            </div>
            <div>
              <h4>Billing Details</h4>
              <div class="billing-box">
                <div class="billing-row"><span>Total Bill:</span> <span>₹${Number(v.total_bill).toFixed(2)}</span></div>
                <div class="billing-row"><span>Paid Amount:</span> <span>₹${Number(v.paid_amount).toFixed(2)}</span></div>
                <div class="billing-row"><span>Pending Amount:</span> <span style="color: ${pendingColor}; font-weight: 600;">₹${Number(v.pending_amount).toFixed(2)}</span></div>
              </div>
            </div>
            ${notesHtml}
          </div>
        </div>
      `;
    });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Patient History - ${patientName}</title>
        <style>
          @page {
            size: A4;
            margin: 15mm 15mm 25mm 15mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #1d1d1f;
            margin: 0;
            padding: 0;
            line-height: 1.4;
            font-size: 13px;
          }
          .header {
            border-bottom: 2px solid #0071e3;
            padding-bottom: 12px;
            margin-bottom: 20px;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
          }
          .clinic-info h1 {
            font-size: 22px;
            margin: 0;
            color: #0071e3;
            font-weight: 700;
          }
          .clinic-info p {
            margin: 3px 0 0 0;
            color: #86868b;
            font-size: 13px;
          }
          .report-title {
            text-align: right;
          }
          .report-title h2 {
            font-size: 16px;
            margin: 0;
            color: #1d1d1f;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .report-title p {
            margin: 3px 0 0 0;
            color: #86868b;
            font-size: 11px;
          }
          .patient-card {
            background-color: #f5f5f7;
            border-radius: 6px;
            padding: 12px 18px;
            margin-bottom: 20px;
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 8px;
          }
          .info-item {
            margin: 0;
            font-size: 13px;
          }
          .info-item strong {
            color: #86868b;
            font-weight: 500;
            display: inline-block;
            width: 110px;
          }
          .info-item span {
            color: #1d1d1f;
            font-weight: 600;
          }
          .visit-card {
            border: 1px solid #d2d2d7;
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 15px;
            page-break-inside: avoid;
          }
          .visit-header {
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #e5e5ea;
            padding-bottom: 6px;
            margin-bottom: 10px;
          }
          .visit-date {
            font-size: 14px;
            font-weight: 600;
            color: #0071e3;
          }
          .visit-disease {
            font-size: 13px;
            color: #1d1d1f;
            font-weight: 500;
          }
          .visit-details {
            display: grid;
            grid-template-columns: 1.8fr 1.2fr;
            gap: 15px;
          }
          .medicines-list h4, .notes-section h4 {
            margin: 0 0 6px 0;
            font-size: 11px;
            text-transform: uppercase;
            color: #86868b;
            letter-spacing: 0.5px;
          }
          .medicines-list ul {
            margin: 0;
            padding-left: 15px;
          }
          .medicines-list li {
            margin-bottom: 3px;
            color: #1d1d1f;
          }
          .billing-box {
            background-color: #fafafa;
            border: 1px solid #e5e5ea;
            border-radius: 4px;
            padding: 8px 10px;
            font-size: 12px;
          }
          .billing-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .billing-row:last-child {
            margin-bottom: 0;
            font-weight: 600;
            border-top: 1px solid #e5e5ea;
            padding-top: 3px;
            margin-top: 3px;
          }
          .notes-section {
            margin-top: 8px;
            grid-column: span 2;
            border-top: 1px solid #f2f2f7;
            padding-top: 8px;
          }
          .notes-section p {
            margin: 0;
            font-style: italic;
            color: #515154;
          }
          .summary-card {
            background: linear-gradient(135deg, #0071e3 0%, #005bb5 100%);
            color: white;
            border-radius: 6px;
            padding: 15px;
            margin-top: 25px;
            page-break-inside: avoid;
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10px;
            text-align: center;
          }
          .summary-item h4 {
            margin: 0 0 4px 0;
            font-size: 10px;
            text-transform: uppercase;
            opacity: 0.8;
            letter-spacing: 0.5px;
          }
          .summary-item p {
            margin: 0;
            font-size: 18px;
            font-weight: 700;
          }
          
          /* Footer to be printed at bottom of every page */
          .report-footer {
            display: none;
          }
          @media print {
            body {
              margin-bottom: 40mm;
            }
            .report-footer {
              display: block;
              position: fixed;
              bottom: 0;
              left: 0;
              right: 0;
              text-align: center;
              font-size: 11px;
              color: #86868b;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="clinic-info">
            <h1>Clinic Management System</h1>
            <p>Doctor: ${doctorName}</p>
          </div>
          <div class="report-title">
            <h2>Patient Visit History</h2>
            <p>Generated on: ${formattedDate}</p>
          </div>
        </div>

        <div class="patient-card">
          <p class="info-item"><strong>Patient Name:</strong> <span>${patientName}</span></p>
          <p class="info-item"><strong>Mobile Number:</strong> <span>${patientMobile}</span></p>
          <p class="info-item"><strong>Age / Gender:</strong> <span>${patientAge} / ${patientGender}</span></p>
          <p class="info-item"><strong>Address:</strong> <span>${patientAddress}</span></p>
        </div>

        ${visitsHtml}

        <div class="summary-card">
          <div class="summary-item">
            <h4>Total Visits</h4>
            <p>${totalVisits}</p>
          </div>
          <div class="summary-item">
            <h4>Total Billed</h4>
            <p>₹${totalBilled.toFixed(2)}</p>
          </div>
          <div class="summary-item">
            <h4>Total Paid</h4>
            <p>₹${totalPaid.toFixed(2)}</p>
          </div>
          <div class="summary-item">
            <h4>Total Pending</h4>
            <p>₹${totalPending.toFixed(2)}</p>
          </div>
        </div>

        <div class="report-footer">
          <div style="border-top: 1px dashed #d2d2d7; padding-top: 8px; margin-top: 10px;">
            <p style="margin: 0; font-weight: 600;">Generated by Clinic Management System</p>
            <p style="margin: 3px 0 0 0;">Generated On: ${formattedDate}</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // 4. Print to PDF in a hidden window
    if (isElectron) {
      const { BrowserWindow } = require('electron');
      const pdfWin = new BrowserWindow({
        show: false,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true
        }
      });

      await pdfWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

      pdfWin.webContents.on('did-finish-load', async () => {
        try {
          const pdfData = await pdfWin.webContents.printToPDF({
            printBackground: true,
            pageSize: 'A4',
            margins: {
              top: 15,
              bottom: 15,
              left: 15,
              right: 15
            }
          });

          const fs = require('fs');
          await fs.promises.writeFile(filePath, pdfData);

          pdfWin.destroy();
          res.json({ success: true, path: filePath });
        } catch (printErr) {
          console.error('Print PDF Error:', printErr);
          pdfWin.destroy();
          res.status(500).json({ message: 'Failed to print PDF file', error: printErr.message });
        }
      });
    } else {
      res.json({
        success: true,
        useBrowserPrint: true,
        htmlContent: htmlContent
      });
    }

  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  addPatient,
  searchPatients,
  getTodayPatients,
  getPendingDues,
  getPatientById,
  deletePatient,
  clearPatientDue,
  payDues,
  exportHistoryPdf
};
