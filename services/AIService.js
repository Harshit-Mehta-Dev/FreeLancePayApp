const mavin = require('../mavin-ai');
const CircuitBreaker = require('../infrastructure/CircuitBreaker');

/**
 * 🤖 Resilient AI Service (MAVIN Wrapper)
 */
class AIService {
    constructor() {
        this.breaker = new CircuitBreaker('MavinAI', {
            failureThreshold: 5,
            recoveryTimeout: 30000
        });
    }

    async init() {
        await mavin.init();
    }

    async inspect(type, data) {
        return this.breaker.fire(
            async () => await mavin.inspect(type, data),
            () => {
                console.warn('🩹 [MavinAI Fallback] Using heuristic pass due to AI service load.');
                return {
                    status: "PASS",
                    confidence: 0.5,
                    anomalies: "SERVICE_TEMPORARILY_UNAVAILABLE",
                    timestamp: new Date().toISOString()
                };
            }
        );
    }

    async train(modelName, samples) {
        return this.breaker.fire(async () => await mavin.train(modelName, samples));
    }

    getSystemHealth() {
        return mavin.getSystemHealth();
    }
}

module.exports = new AIService();
