/**
 * Cyber-Cloud Notification Engine (Premium Edition)
 * Handles Desktop (Web) Notifications with fallback and permission management.
 */

class NotificationManager {
    constructor() {
        this.permission = 'default';
        if (typeof window !== 'undefined' && 'Notification' in window) {
            this.permission = Notification.permission;
        }
    }

    /**
     * Request permission from the user to show desktop notifications
     */
    async requestPermission() {
        if (!('Notification' in window)) {
            console.warn('This browser does not support desktop notifications');
            return false;
        }

        if (Notification.permission === 'granted') return true;

        const permission = await Notification.requestPermission();
        this.permission = permission;
        return permission === 'granted';
    }

    /**
     * Send a desktop notification
     * @param {string} title - The notification title
     * @param {Object} options - Notification options (body, icon, etc.)
     */
    async notify(title, options = {}) {
        // Check settings first (local storage)
        const settings = JSON.parse(localStorage.getItem('notification_settings') || '{}');
        const type = options.type || 'general';

        if (settings[type] === false) return;

        if (Notification.permission === 'granted') {
            const defaultOptions = {
                icon: '/logo192.png', // Fallback to app icon
                badge: '/favicon.ico',
                vibrate: [200, 100, 200],
                ...options
            };
            
            try {
                return new Notification(title, defaultOptions);
            } catch (e) {
                // Fallback for mobile/older browsers if ServiceWorker registration exists
                if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
                    navigator.serviceWorker.ready.then(registration => {
                        registration.showNotification(title, defaultOptions);
                    });
                }
            }
        }
    }

    /**
     * Specialized alerts
     */
    async alertOverdue(billName, amount, currency = '₹') {
        return this.notify('⚠️ Bill Overdue!', {
            body: `Your payment for "${billName}" of ${currency}${amount} is past due.`,
            type: 'overdueAlert',
            tag: `overdue-${billName}`,
            requireInteraction: true
        });
    }

    async alertSuccess(title, body) {
        return this.notify(`✅ ${title}`, {
            body,
            type: 'paymentConfirm',
            tag: 'success-alert'
        });
    }

    async alertReminder(billName, dueDate) {
        return this.notify('📅 Upcoming Bill', {
            body: `"${billName}" is due soon (${dueDate}).`,
            type: 'upcomingReminder',
            tag: `reminder-${billName}`
        });
    }
}

export const notificationEngine = new NotificationManager();
