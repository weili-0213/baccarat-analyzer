/**
 * Baccarat Analyzer V9.3
 * Path: integration/simulation/SimulationModeSelector.js
 * Purpose: Selects exact, Monte Carlo or hybrid mode.
 */
import {SimulationMode} from "./SimulationIntegrationState.js";
export const SIMULATION_MODE_SELECTOR_VERSION = "9.3.0";
export default class SimulationModeSelector {select({requestedMode=SimulationMode.AUTO,remainingCount=null,exactThreshold=80}={}){if(requestedMode!==SimulationMode.AUTO)return requestedMode;return Number.isFinite(remainingCount)&&remainingCount<=exactThreshold?SimulationMode.EXACT:SimulationMode.HYBRID;}get summary(){return {version:SIMULATION_MODE_SELECTOR_VERSION};}}
