/**
 * Baccarat Analyzer V9.3
 * Path: integration/simulation/MonteCarloSimulationGateway.js
 * Purpose: Adapts Monte Carlo Engine.
 */
export const MONTE_CARLO_SIMULATION_GATEWAY_VERSION = "9.3.0";
export default class MonteCarloSimulationGateway {constructor({monteCarlo}={}){if(!monteCarlo||typeof monteCarlo.simulate!=="function")throw new TypeError("MonteCarloSimulationGateway requires monteCarlo.simulate().");this.monteCarlo=monteCarlo;}async simulate(input={}){return this.monteCarlo.simulate(input);}get summary(){return {version:MONTE_CARLO_SIMULATION_GATEWAY_VERSION};}}
