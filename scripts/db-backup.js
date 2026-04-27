const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../server/freelancepay.sqlite');
const BACKUP_DIR = path.join(__dirname, '../backups');

function createBackup() {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR);
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(BACKUP_DIR, `freelancepay-backup-${timestamp}.sqlite`);

    try {
        if (fs.existsSync(DB_PATH)) {
            fs.copyFileSync(DB_PATH, backupPath);
            console.log(`✅ Database backup created successfully at: ${backupPath}`);
            
            // Clean up old backups (keep last 5)
            const files = fs.readdirSync(BACKUP_DIR)
                .filter(f => f.endsWith('.sqlite'))
                .map(f => ({ name: f, time: fs.statSync(path.join(BACKUP_DIR, f)).mtime.getTime() }))
                .sort((a, b) => b.time - a.time);

            if (files.length > 5) {
                files.slice(5).forEach(f => {
                    fs.unlinkSync(path.join(BACKUP_DIR, f.name));
                    console.log(`[CLEANUP] Deleted old backup: ${f.name}`);
                });
            }
        } else {
            console.error('❌ Error: Database file not found at ' + DB_PATH);
        }
    } catch (error) {
        console.error('❌ Backup failed:', error.message);
    }
}

console.log('📦 Starting Cyber-Cloud Automated Backup...');
createBackup();
console.log('✅ Backup process complete.');
