/**
 * Baccarat Analyzer V9.3
 * Path: integration/simulation/ExactSimulationGateway.js
 * Purpose: Adapts Exact Simulation Engine.
 */
export const EXACT_SIMULATION_GATEWAY_VERSION = "9.3.0";
export default class ExactSimulationGateway {constructor({exact}={}){if(!exact||typeof exact.simulate!=="function")throw new TypeError("ExactSimulationGateway requires exact.simulate().");this.exact=exact;}async simulate(input={}){return this.exact.simulate(input);}get summary(){return {version:EXACT_SIMULATION_GATEWAY_VERSION};}}
