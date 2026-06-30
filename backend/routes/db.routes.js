const express = require('express');
const router = express.Router();
const { getDbInfo, openDbFolder, backupDb, restoreDb } = require('../controllers/db.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/info', protect, getDbInfo);
router.post('/open-folder', protect, openDbFolder);
router.post('/backup', protect, backupDb);
router.post('/restore', protect, restoreDb);

module.exports = router;
