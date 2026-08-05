/**
 * Baccarat Analyzer V8.7
 * casino/ai/safety/IncidentManager.js
 */
export const INCIDENT_MANAGER_VERSION = "8.7.0";
export default class IncidentManager {
    constructor() {
        this.incidents = [];
        this.sequence = 0;
    }
    create({
        threat,
        guardrail,
        failSafe,
        createdAt = null
    } = {}) {
        this.sequence++;
        const incident = {
            incidentId: `incident-${this.sequence}`,
            threat,
            guardrail,
            failSafe,
            status: failSafe?.activated ? "open" : "none",
            createdAt
        };
        this.incidents.push(incident);
        return incident;
    }
    resolve(incidentId, resolution = {}) {
        const incident = this.incidents.find(
            item => item.incidentId === incidentId
        );
        if (!incident) {
            return false;
        }
        incident.status = "resolved";
        incident.resolution = { ...resolution };
        return true;
    }
    clear() {
        this.incidents = [];
        this.sequence = 0;
        return this;
    }
    get summary() {
        return {
            version: INCIDENT_MANAGER_VERSION,
            count: this.incidents.length,
            openCount: this.incidents.filter(
                incident => incident.status === "open"
            ).length
        };
    }
}
