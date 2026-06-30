const express = require('express');
const router = express.Router();
const { addPatient, searchPatients, getTodayPatients, getPendingDues, getPatientById, deletePatient, clearPatientDue, payDues, exportHistoryPdf } = require('../controllers/patient.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, addPatient);
router.get('/search', protect, searchPatients);
router.get('/today', protect, getTodayPatients);
router.get('/dues', protect, getPendingDues);

// Debugging route
router.get('/ping', (req, res) => res.json({ message: 'Patients API is reachable' }));

// Specific routes before generic ones
router.post('/pay-dues', protect, payDues);
router.post('/clear-due/:id', protect, clearPatientDue);
router.post('/export-history-pdf', protect, exportHistoryPdf);

router.get('/:id', protect, getPatientById);
router.delete('/:id', protect, deletePatient);

module.exports = router;
