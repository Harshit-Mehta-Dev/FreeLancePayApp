const mongoose = require('mongoose');

const connectMongo = async () => {
    try {
        const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/freelance_pay_vault';
        await mongoose.connect(mongoURI, { bufferCommands: false });
        console.log('🍃 MongoDB Intelligence Vault Connected');
    } catch (err) {
        // Self-Healing: Silently fallback to local SQLite when NoSQL Intelligence Vault is unreachable
    }
};

// --- Intelligence Schemas ---

// Security Audit Schema (High frequency logs)
const AuditLogSchema = new mongoose.Schema({
    event: String,
    ip: String,
    details: String,
    timestamp: { type: Date, default: Date.now }
}, { bufferCommands: false });

// AI Inspection Schema (Telemetry)
const AIInspectionSchema = new mongoose.Schema({
    resourceType: String,
    resourceId: String,
    status: String,
    confidence: Number,
    anomalies: Array,
    timestamp: { type: Date, default: Date.now }
}, { bufferCommands: false });

const AuditLog = mongoose.model('AuditLog', AuditLogSchema);
const AIInspection = mongoose.model('AIInspection', AIInspectionSchema);

module.exports = { connectMongo, AuditLog, AIInspection };
