/** Baccarat Analyzer V9.2 */
export const DECISION_GATEWAY_VERSION = "9.2.0";
export default class DecisionGateway {
    constructor({decision}={}) { if(!decision || typeof decision.decide!=="function") throw new TypeError("DecisionGateway requires decision.decide()."); this.decision=decision; }
    async decide(input={}) { return this.decision.decide(input); }
    get summary(){ return {version:DECISION_GATEWAY_VERSION}; }
}
