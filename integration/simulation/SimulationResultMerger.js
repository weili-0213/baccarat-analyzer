/**
 * Baccarat Analyzer V9.3
 * Path: integration/simulation/SimulationResultMerger.js
 * Purpose: Merges probability, exact and Monte Carlo outputs.
 */
export const SIMULATION_RESULT_MERGER_VERSION = "9.3.0";
const OUTCOMES=["Player","Banker","Tie"];
const value=(source,outcome)=>{const v=source?.probabilities?.[outcome]??source?.[outcome]??0;return Number.isFinite(v)?v:0;};
export default class SimulationResultMerger {merge({probability=null,exact=null,monteCarlo=null,mode="hybrid"}={}){const sources=[probability,exact,monteCarlo].filter(Boolean),probabilities={};for(const outcome of OUTCOMES){probabilities[outcome]=sources.length?sources.reduce((t,s)=>t+value(s,outcome),0)/sources.length:0;}const ranking=Object.entries(probabilities).map(([outcome,probability])=>({outcome,probability})).sort((a,b)=>b.probability-a.probability);const spread=ranking.length>1?ranking[0].probability-ranking[1].probability:0;return {mode,probabilities,ranking,bestOutcome:ranking[0]?.outcome??null,confidence:Math.max(0,Math.min(1,spread*5)),sourceCount:sources.length,sources:{probability,exact,monteCarlo}};}get summary(){return {version:SIMULATION_RESULT_MERGER_VERSION};}}
