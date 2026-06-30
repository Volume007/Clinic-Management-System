const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const { execSync } = require('child_process');

// Detect if running inside Electron main process
let isElectron = false;
try {
  if (process.versions && process.versions.electron) {
    isElectron = true;
  }
} catch (e) {
  isElectron = false;
}

// Helper to format date as DD MMM YYYY, hh:mm AM/PM
function formatDateTime(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const day = String(date.getDate()).padStart(2, '0');
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const hoursStr = String(hours).padStart(2, '0');
  return `${day} ${month} ${year}, ${hoursStr}:${minutes} ${ampm}`;
}

// PowerShell Fallbacks for dialogs when running outside Electron
function openSaveFileDialogPowershell(defaultFilename) {
  const psScript = `
    Add-Type -AssemblyName System.Windows.Forms
    $dialog = New-Object System.Windows.Forms.SaveFileDialog
    $dialog.Filter = "SQLite Database (*.db)|*.db"
    $dialog.FileName = "${defaultFilename}"
    $dialog.Title = "Backup Database"
    if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
      Write-Output $dialog.FileName
    }
  `;
  try {
    const result = execSync(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`, { encoding: 'utf8' });
    return result.trim();
  } catch (e) {
    console.error('PowerShell Save Dialog error:', e);
    return null;
  }
}

function openOpenFileDialogPowershell(title) {
  const psScript = `
    Add-Type -AssemblyName System.Windows.Forms
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Filter = "SQLite Database (*.db)|*.db"
    $dialog.Title = "${title}"
    if ($dialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
      Write-Output $dialog.FileName
    }
  `;
  try {
    const result = execSync(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`, { encoding: 'utf8' });
    return result.trim();
  } catch (e) {
    console.error('PowerShell Open Dialog error:', e);
    return null;
  }
}

function showWarningMessageBoxPowershell(message, title) {
  const psScript = `
    Add-Type -AssemblyName System.Windows.Forms
    $result = [System.Windows.Forms.MessageBox]::Show("${message.replace(/\n/g, '`n')}", "${title}", [System.Windows.Forms.MessageBoxButtons]::OKCancel, [System.Windows.Forms.MessageBoxIcon]::Warning)
    Write-Output $result
  `;
  try {
    const result = execSync(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`, { encoding: 'utf8' });
    return result.trim() === 'OK';
  } catch (e) {
    console.error('PowerShell Warning Message Box error:', e);
    return false;
  }
}

function showInfoMessageBoxPowershell(message, title) {
  const psScript = `
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show("${message.replace(/\n/g, '`n')}", "${title}", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Information)
  `;
  try {
    execSync(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`);
  } catch (e) {
    console.error('PowerShell Info Message Box error:', e);
  }
}

function showErrorMessageBoxPowershell(message, title) {
  const psScript = `
    Add-Type -AssemblyName System.Windows.Forms
    [System.Windows.Forms.MessageBox]::Show("${message.replace(/\n/g, '`n')}", "${title}", [System.Windows.Forms.MessageBoxButtons]::OK, [System.Windows.Forms.MessageBoxIcon]::Error)
  `;
  try {
    execSync(`powershell -NoProfile -Command "${psScript.replace(/\n/g, ' ')}"`);
  } catch (e) {
    console.error('PowerShell Error Message Box error:', e);
  }
}

const getDbInfo = async (req, res) => {
  try {
    const dbPath = process.env.USER_DATA_PATH 
      ? path.join(process.env.USER_DATA_PATH, 'clinic.db')
      : path.resolve(__dirname, '../clinic.db');

    let sizeStr = '0.00 MB';
    let lastModifiedStr = 'N/A';

    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      const sizeInMB = stats.size / (1024 * 1024);
      sizeStr = `${sizeInMB.toFixed(2)} MB`;
      lastModifiedStr = formatDateTime(stats.mtime);
    }

    res.json({
      type: 'SQLite',
      size: sizeStr,
      lastModified: lastModifiedStr,
      location: dbPath
    });
  } catch (error) {
    console.error('Get DB Info Error:', error);
    res.status(500).json({ message: 'Failed to fetch database information', error: error.message });
  }
};

const openDbFolder = async (req, res) => {
  try {
    const dbPath = process.env.USER_DATA_PATH 
      ? path.join(process.env.USER_DATA_PATH, 'clinic.db')
      : path.resolve(__dirname, '../clinic.db');

    if (fs.existsSync(dbPath)) {
      if (isElectron) {
        const { shell } = require('electron');
        shell.showItemInFolder(dbPath);
      } else {
        const { exec } = require('child_process');
        exec(`explorer.exe /select,"${dbPath}"`);
      }
      res.json({ success: true });
    } else {
      res.status(404).json({ message: 'Database file not found' });
    }
  } catch (error) {
    console.error('Open DB Folder Error:', error);
    res.status(500).json({ message: 'Failed to open database folder', error: error.message });
  }
};

const backupDb = async (req, res) => {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const defaultName = `Clinic_Backup_${year}-${month}-${day}_${hours}-${minutes}.db`;
    let filePath = null;

    if (isElectron) {
      const { dialog, BrowserWindow } = require('electron');
      const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      const { filePath: selectedPath, canceled } = await dialog.showSaveDialog(win, {
        title: 'Backup Database',
        defaultPath: defaultName,
        filters: [{ name: 'SQLite Database', extensions: ['db'] }]
      });
      if (!canceled) {
        filePath = selectedPath;
      }
    } else {
      filePath = openSaveFileDialogPowershell(defaultName);
    }

    if (!filePath) {
      return res.json({ success: false, message: 'Cancelled' });
    }

    const dbPath = process.env.USER_DATA_PATH 
      ? path.join(process.env.USER_DATA_PATH, 'clinic.db')
      : path.resolve(__dirname, '../clinic.db');

    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ success: false, message: 'Source database file not found' });
    }

    await fs.promises.copyFile(dbPath, filePath);

    res.json({
      success: true,
      message: `Database backed up successfully.`,
      path: filePath
    });
  } catch (error) {
    console.error('Backup DB Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create backup', error: error.message });
  }
};

const restoreDb = async (req, res) => {
  try {
    let confirmed = false;

    if (isElectron) {
      const { dialog, BrowserWindow } = require('electron');
      const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      const choice = await dialog.showMessageBox(win, {
        type: 'warning',
        buttons: ['Cancel', 'Restore'],
        defaultId: 0,
        cancelId: 0,
        title: 'Restore Database',
        message: 'Restoring a backup will replace the current database.\nThis action cannot be undone.'
      });
      confirmed = (choice.response === 1);
    } else {
      confirmed = showWarningMessageBoxPowershell(
        "Restoring a backup will replace the current database.\nThis action cannot be undone.",
        "Restore Database"
      );
    }

    if (!confirmed) {
      return res.json({ success: false, message: 'Cancelled' });
    }

    let selectedFile = null;
    if (isElectron) {
      const { dialog, BrowserWindow } = require('electron');
      const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      const { filePaths, canceled } = await dialog.showOpenDialog(win, {
        title: 'Select Backup File',
        filters: [{ name: 'SQLite Database', extensions: ['db'] }],
        properties: ['openFile']
      });
      if (!canceled && filePaths.length > 0) {
        selectedFile = filePaths[0];
      }
    } else {
      selectedFile = openOpenFileDialogPowershell("Restore Database");
    }

    if (!selectedFile) {
      return res.json({ success: false, message: 'Cancelled' });
    }

    // Validate selected database
    let isValid = false;
    let tempDb = null;
    try {
      tempDb = await open({
        filename: selectedFile,
        driver: sqlite3.Database
      });

      const tables = await tempDb.all("SELECT name FROM sqlite_master WHERE type='table'");
      const tableNames = tables.map(t => t.name.toLowerCase());

      const requiredTables = ['doctors', 'patients', 'medicines', 'patient_medicines', 'prescription_items'];
      isValid = requiredTables.every(name => tableNames.includes(name.toLowerCase()));
    } catch (dbErr) {
      console.error('Failed to open backup DB for validation:', dbErr);
    } finally {
      if (tempDb) {
        await tempDb.close();
      }
    }

    if (!isValid) {
      const errorMsg = 'The selected file is not a valid Clinic Management System database.\n\nRestore has been cancelled.';
      if (isElectron) {
        const { dialog, BrowserWindow } = require('electron');
        const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
        await dialog.showMessageBox(win, {
          type: 'error',
          title: 'Invalid Backup File',
          message: errorMsg,
          buttons: ['OK']
        });
      } else {
        showErrorMessageBoxPowershell(errorMsg, 'Invalid Backup File');
      }
      return res.json({ success: false, message: 'Validation failed' });
    }

    // Success, copy database
    const dbDir = process.env.USER_DATA_PATH 
      ? process.env.USER_DATA_PATH
      : path.resolve(__dirname, '..');

    const dbPath = path.join(dbDir, 'clinic.db');

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    const safetyBackupName = `Auto_Backup_Before_Restore_${year}-${month}-${day}_${hours}-${minutes}.db`;
    const safetyBackupPath = path.join(dbDir, safetyBackupName);

    // Create safety backup
    if (fs.existsSync(dbPath)) {
      await fs.promises.copyFile(dbPath, safetyBackupPath);
    }

    // Close current connection and replace file
    await db.closeDb();
    await fs.promises.copyFile(selectedFile, dbPath);

    res.json({ success: true });

    const successMsg = `Database restored successfully.\n\nSafety backup created at:\n${safetyBackupPath}\n\nThe application will now restart.`;
    if (isElectron) {
      const { dialog, BrowserWindow } = require('electron');
      const win = BrowserWindow.getFocusedWindow() || BrowserWindow.getAllWindows()[0];
      await dialog.showMessageBox(win, {
        type: 'info',
        title: 'Restore Successful',
        message: successMsg,
        buttons: ['OK']
      });
      const { app } = require('electron');
      app.relaunch();
      app.exit(0);
    } else {
      showInfoMessageBoxPowershell(
        "Database restored successfully.\n\nSafety backup created at:\n" + safetyBackupPath + "\n\nPlease restart the application manually.",
        "Restore Successful"
      );
    }

  } catch (error) {
    console.error('Restore DB Error:', error);
    res.status(500).json({ success: false, message: 'Failed to restore database', error: error.message });
  }
};

module.exports = {
  getDbInfo,
  openDbFolder,
  backupDb,
  restoreDb
};
