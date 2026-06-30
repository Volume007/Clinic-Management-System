const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

const loginDoctor = async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM doctors WHERE username = ?', [username]);

    if (rows.length === 0) {
      // If no doctors exist at all, let's create a default admin for first setup
      const [allDoctors] = await db.query('SELECT COUNT(*) as count FROM doctors');
      if (allDoctors[0].count === 0 && username === 'admin') {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('admin123', salt);
        await db.query('INSERT INTO doctors (username, password, doctor_name) VALUES (?, ?, ?)', ['admin', hashedPassword, 'Dr. Bimal']);
        
        // Fetch the newly created user
        const [newRows] = await db.query('SELECT * FROM doctors WHERE username = ?', ['admin']);
        const newDoctor = newRows[0];
        
        return res.json({
          id: newDoctor.doctor_id,
          username: newDoctor.username,
          name: newDoctor.doctor_name,
          token: generateToken(newDoctor.doctor_id)
        });
      }

      return res.status(401).json({ message: 'Invalid username or password' });
    }

    const doctor = rows[0];

    // Check password
    const isMatch = await bcrypt.compare(password, doctor.password);

    if (isMatch) {
      res.json({
        id: doctor.doctor_id,
        username: doctor.username,
        name: doctor.doctor_name,
        token: generateToken(doctor.doctor_id)
      });
    } else {
      res.status(401).json({ message: 'Invalid username or password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const getMe = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT doctor_id as id, username, doctor_name as name FROM doctors WHERE doctor_id = ?', [req.doctorId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const verifyPassword = async (req, res) => {
  const { password } = req.body;
  try {
    const [rows] = await db.query('SELECT password FROM doctors WHERE doctor_id = ?', [req.doctorId]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }
    const isMatch = await bcrypt.compare(password, rows[0].password);
    if (isMatch) {
      res.json({ success: true });
    } else {
      res.status(401).json({ message: 'Incorrect password' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  loginDoctor,
  getMe,
  verifyPassword
};
