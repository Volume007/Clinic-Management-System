const db = require('../config/db');

// Get all medicines
const getMedicines = async (req, res) => {
  try {
    const [medicines] = await db.query(
      'SELECT medicine_id, medicine_name, medicine_type, pack_size, pack_unit, stock_quantity, stock_added_date FROM medicines ORDER BY medicine_name ASC'
    );
    res.json(medicines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Add new medicine
const addMedicine = async (req, res) => {
  const { medicine_name, medicine_type, pack_size, pack_unit, stock_quantity, stock_added_date } = req.body;
  
  if (!medicine_name || medicine_name.trim() === '') {
    return res.status(400).json({ message: 'Medicine name is required' });
  }
  if (stock_quantity < 0) {
    return res.status(400).json({ message: 'Stock quantity cannot be negative' });
  }

  try {
    const [result] = await db.query(
      'INSERT INTO medicines (medicine_name, medicine_type, pack_size, pack_unit, stock_quantity, stock_added_date) VALUES (?, ?, ?, ?, ?, ?)',
      [medicine_name.trim(), medicine_type, pack_size, pack_unit, stock_quantity || 0, stock_added_date]
    );
    res.status(201).json({ id: result.insertId, message: 'Medicine added successfully' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY' || error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ message: 'Medicine name already exists' });
    }
    res.status(500).json({ message: 'Failed to add medicine' });
  }
};

// Update medicine
const updateMedicine = async (req, res) => {
  const { id } = req.params;
  const { medicine_name, medicine_type, pack_size, pack_unit, stock_quantity } = req.body;

  if (!medicine_name || medicine_name.trim() === '') {
    return res.status(400).json({ message: 'Medicine name is required' });
  }
  if (stock_quantity < 0) {
    return res.status(400).json({ message: 'Stock quantity cannot be negative' });
  }

  try {
    await db.query(
      'UPDATE medicines SET medicine_name = ?, medicine_type = ?, pack_size = ?, pack_unit = ?, stock_quantity = ? WHERE medicine_id = ?',
      [medicine_name.trim(), medicine_type, pack_size, pack_unit, stock_quantity, id]
    );
    res.json({ message: 'Medicine updated successfully' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_DUP_ENTRY' || error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ message: 'Medicine name already exists' });
    }
    res.status(500).json({ message: 'Failed to update medicine' });
  }
};

// Delete medicine
const deleteMedicine = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM medicines WHERE medicine_id = ?', [id]);
    res.json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    console.error(error);
    if (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'SQLITE_CONSTRAINT') {
      return res.status(400).json({ message: 'Cannot delete this medicine because it has been prescribed to patients.' });
    }
    res.status(500).json({ message: 'Failed to delete medicine' });
  }
};

module.exports = {
  getMedicines,
  addMedicine,
  updateMedicine,
  deleteMedicine
};
