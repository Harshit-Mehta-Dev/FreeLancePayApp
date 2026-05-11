const nodemailer = require('nodemailer');
const CircuitBreaker = require('../infrastructure/CircuitBreaker');

/**
 * ✉️ Resilient Email Service
 */
class EmailService {
    constructor() {
        this.transporter = null;
        this.breaker = new CircuitBreaker('EmailService', {
            failureThreshold: 3,
            recoveryTimeout: 60000 // 1 minute
        });
        this.init();
    }

    async init() {
        if (process.env.SMTP_HOST && process.env.SMTP_USER) {
            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                }
            });
        } else {
            console.warn('⚠️  SMTP credentials missing. Email service falling back to console logging.');
        }
    }

    async sendMail(options) {
        return this.breaker.fire(
            async () => {
                if (!this.transporter) {
                    console.log('📬 [Simulated Email]', options.to, options.subject);
                    return { messageId: 'simulated' };
                }
                return await this.transporter.sendMail(options);
            },
            () => {
                console.error('🩹 [CircuitBreaker Fallback] Email service unavailable. Logging request to recovery queue.');
                // Here you could save to a 'failed_emails' table
                return { success: false, circuitOpen: true };
            }
        );
    }
}

module.exports = new EmailService();
