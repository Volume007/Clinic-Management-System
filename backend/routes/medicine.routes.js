const express = require('express');
const router = express.Router();
const { getMedicines, addMedicine, updateMedicine, deleteMedicine } = require('../controllers/medicine.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getMedicines);
router.post('/', protect, addMedicine);
router.put('/:id', protect, updateMedicine);
router.delete('/:id', protect, deleteMedicine);

module.exports = router;
