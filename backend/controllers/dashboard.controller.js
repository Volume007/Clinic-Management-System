const db = require('../config/db');

const getDashboardStats = async (req, res) => {
  try {
    // Total Patients Today
    const today = new Date().toISOString().split('T')[0];
    const [patientsToday] = await db.query(
      'SELECT COUNT(*) as count FROM patients WHERE DATE(visit_date) = ?', 
      [today]
    );

    // Pending Dues (Sum of all pending amounts or count of patients with dues)
    // The requirement says "Pending Dues card", usually this shows total amount or count.
    // I'll return both.
    const [pendingDues] = await db.query(
      'SELECT SUM(pending_amount) as total_amount, COUNT(*) as count FROM patients WHERE pending_amount > 0'
    );

    // Low Stock Medicines
    // A medicine is considered low stock if its stock quantity is less than 10
    const [lowStock] = await db.query(
      'SELECT COUNT(*) as count FROM medicines WHERE stock_quantity < 10'
    );

    res.json({
      patientsToday: patientsToday[0].count,
      pendingDuesAmount: pendingDues[0].total_amount || 0,
      pendingDuesCount: pendingDues[0].count,
      lowStockCount: lowStock[0].count
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

module.exports = {
  getDashboardStats
};
