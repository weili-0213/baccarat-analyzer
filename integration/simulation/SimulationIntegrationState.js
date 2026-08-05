/**
 * Baccarat Analyzer V9.3
 * Path: integration/simulation/SimulationIntegrationState.js
 * Purpose: Defines simulation lifecycle states and modes.
 */
export const SIMULATION_INTEGRATION_STATE_VERSION = "9.3.0";
export const SimulationIntegrationState = Object.freeze({IDLE:"idle",COLLECTING:"collecting",PROBABILITY:"probability",EXACT:"exact",MONTE_CARLO:"monte-carlo",MERGING:"merging",COMPLETED:"completed",PAUSED:"paused",ERROR:"error",DESTROYED:"destroyed"});
export const SimulationMode = Object.freeze({AUTO:"auto",EXACT:"exact",MONTE_CARLO:"monte-carlo",HYBRID:"hybrid"});
