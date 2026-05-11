/**
 * ⚡ Circuit Breaker Pattern (2026 Resilient Design)
 * Prevents cascading failures when external services (AI, Email, APIs) hang or fail.
 */
class CircuitBreaker {
    constructor(serviceName, options = {}) {
        this.serviceName = serviceName;
        this.failureThreshold = options.failureThreshold || 5;
        this.recoveryTimeout = options.recoveryTimeout || 30000; // 30 seconds
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.nextAttempt = Date.now();
    }

    async fire(action, fallback = null) {
        if (this.state === 'OPEN') {
            if (Date.now() > this.nextAttempt) {
                this.state = 'HALF_OPEN';
                console.log(`📡 [CircuitBreaker] ${this.serviceName} entering HALF_OPEN state...`);
            } else {
                console.warn(`🛑 [CircuitBreaker] ${this.serviceName} is OPEN. Blocking request.`);
                if (fallback) return fallback();
                throw new Error(`Service ${this.serviceName} is currently unavailable (Circuit Open)`);
            }
        }

        try {
            const result = await action();
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            console.error(`💥 [CircuitBreaker] ${this.serviceName} failure (${this.failureCount}/${this.failureThreshold}):`, error.message);
            if (fallback) return fallback();
            throw error;
        }
    }

    onSuccess() {
        this.failureCount = 0;
        if (this.state !== 'CLOSED') {
            console.log(`✅ [CircuitBreaker] ${this.serviceName} is back online. Closing circuit.`);
            this.state = 'CLOSED';
        }
    }

    onFailure() {
        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.recoveryTimeout;
            console.error(`🔥 [CircuitBreaker] ${this.serviceName} failure threshold reached! Opening circuit for ${this.recoveryTimeout / 1000}s.`);
        }
    }
}

module.exports = CircuitBreaker;
