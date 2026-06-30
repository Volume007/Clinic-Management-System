# 🏥 Clinic Management System

A modern **offline desktop-based Clinic Management System** built using **Electron, React, Node.js, Express, and SQLite**. Designed for single-clinic environments, the application streamlines patient management, medicine inventory, prescriptions, billing, and database management while remaining completely offline.

---

## ✨ Features

### 👨‍⚕️ Doctor Authentication
- Secure login system
- Offline authentication
- Minimal and intuitive interface

### 📊 Dashboard
- Daily patient overview
- Medicine stock summary
- Pending dues overview
- Quick navigation

### 🧑 Patient Management
- Register new patients
- Store patient demographics
- Maintain complete visit history
- Search patients using Name & Mobile Number

### 💊 Dynamic Prescription System
- Add unlimited medicines dynamically
- Support for:
  - Tablets
  - Strips
  - Bottles
- Automatic quantity calculations
- Dynamic prescription generation

### 📦 Medicine Inventory
- Add new medicines
- Support multiple packaging units
- Dynamic pack sizes
- Automatic stock deduction after every prescription
- Inventory management

### 💰 Billing & Pending Dues
- Generate patient bills
- Track paid amount
- Calculate pending dues automatically
- View payment history

### 🖨️ Prescription Printing
- Professional printable prescription
- A4 optimized layout
- Clean formatting

### 📄 Patient History Export
- Export complete patient history as PDF
- Chronological visit history
- Medicines prescribed
- Billing summary
- Professional report format

### 💾 Database Management
- Automatic SQLite database initialization
- Database Backup
- Safe Database Restore
- Backup validation
- Automatic safety backup before restore
- Database Information panel
- Open Database Folder directly from the application

### 💻 Offline Desktop Application
- No internet connection required
- SQLite powered
- Standalone desktop software
- Suitable for small clinics and private practices

---

# 🛠️ Tech Stack

| Technology | Purpose |
|------------|---------|
| Electron | Desktop Application |
| React | Frontend |
| Node.js | Backend Runtime |
| Express.js | REST API |
| SQLite | Local Database |
| CSS | UI Styling |

---

# 📁 Project Structure

```
Clinic-Management-System
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   └── server.js
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── gallery/
│
├── Launcher.cs
├── main.js
├── package.json
└── README.md
```

---

# 🚀 Installation

Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/Clinic-Management-System.git
```

Install dependencies

```bash
npm install
```

Install frontend dependencies

```bash
cd frontend
npm install
```

Install backend dependencies

```bash
cd ../backend
npm install
```

Run the backend

```bash
node server.js
```

Run the frontend

```bash
npm run dev
```

---

# 📸 Screenshots

## Login

<img width="1918" height="872" alt="image" src="https://github.com/user-attachments/assets/aad256e4-19a0-403c-bcdb-f8ee7b45c027" />


---

## Dashboard

<img width="1918" height="872" alt="Screenshot 2026-06-30 162102" src="https://github.com/user-attachments/assets/90292309-74e0-4955-8716-72d6ce127da2" />


---

## Patient Management

<img width="1901" height="867" alt="Screenshot 2026-06-30 160730" src="https://github.com/user-attachments/assets/4413cf59-35f9-4b0c-8f9d-fb28bc7f4c2d" />


---

## Medicine Inventory

<img width="1901" height="862" alt="Screenshot 2026-06-30 162426" src="https://github.com/user-attachments/assets/e681217c-4319-4cdb-a7ce-aafc1d6bdd25" />


---

## Search Patient

<img width="1902" height="850" alt="Screenshot 2026-06-30 162206" src="https://github.com/user-attachments/assets/c3bff179-8112-4f85-baab-e87fd6c35015" />

---

## Prescription 

<img width="573" height="787" alt="Screenshot 2026-06-30 162228" src="https://github.com/user-attachments/assets/02323e5b-c592-4421-bac4-bb226bdae9f6" />

---

# 🔒 Security

- Offline-first architecture
- Local SQLite database
- Automatic database validation before restore
- Safe backup & restore workflow
- No cloud dependency

---

# 🎯 Future Improvements

- Appointment Scheduling
- Medicine Expiry Tracking
- Clinic Logo Customization
- Income & Sales Reports
- Multi-Doctor Support
- Multi-Clinic Support
- Cloud Backup & Sync

---

# 👨‍💻 Developer

**Agastya Bhardwaj**

Computer Engineering Student  
Passionate about Full Stack Development, AI, Desktop Applications, and Real-World Software Solutions.

---

# ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.

---

## 📄 License

This project is licensed under the MIT License.
