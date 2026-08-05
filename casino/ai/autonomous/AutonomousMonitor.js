/**
 * Baccarat Analyzer V8.0
 * casino/ai/autonomous/AutonomousMonitor.js
 */
export const AUTONOMOUS_MONITOR_VERSION = "8.0.0";
export default class AutonomousMonitor {
    inspect({
        state,
        context,
        scheduler,
        memory,
        cycleCount,
        error = null
    } = {}) {
        const warnings = [];
        if (error) {
            warnings.push(error?.message ?? String(error));
        }
        if (scheduler?.summary?.failedCount > 0) {
            warnings.push("One or more autonomous tasks failed.");
        }
        if (context?.governance?.blocked === true) {
            warnings.push("Governance blocked the current action.");
        }
        if (context?.assurance?.passed === false) {
            warnings.push("Assurance check failed.");
        }
        return {
            healthy: warnings.length === 0,
            state,
            cycleCount: cycleCount ?? 0,
            pendingTasks: scheduler?.summary?.pendingCount ?? 0,
            memoryCount: memory?.summary?.count ?? 0,
            warnings
        };
    }
    get summary() {
        return { version: AUTONOMOUS_MONITOR_VERSION };
    }
}
