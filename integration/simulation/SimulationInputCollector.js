/**
 * Baccarat Analyzer V9.3
* Path: integration/simulation/SimulationInputCollector.js
 * Purpose: Normalizes game state for simulation.
 */
export const SIMULATION_INPUT_COLLECTOR_VERSION = "9.3.0";
export default class SimulationInputCollector {collect(context={}){return {round:context.round??
null,shoe:context.shoe??null,remainingCards:context.remainingCards??null,statistics:context.statistics??
null,roadmap:context.roadmap??null,settings:context.settings??
null,mode:context.mode??"auto",iterations:Number.isInteger(context.iterations)&&context.iterations>0?
context.iterations:10000};}get summary(){return {version:SIMULATION_INPUT_COLLECTOR_VERSION};}}
