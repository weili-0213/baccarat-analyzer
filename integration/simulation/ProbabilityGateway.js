/**
 * Baccarat Analyzer V9.3
 * Path: integration/simulation/ProbabilityGateway.js
 * Purpose: Adapts Probability Engine.
 */
export const PROBABILITY_GATEWAY_VERSION = "9.3.0";
export default class ProbabilityGateway {constructor({probability}={}){if(!probability||typeof probability.calculate!=="function")throw new TypeError("ProbabilityGateway requires probability.calculate().");this.probability=probability;}async calculate(input={}){return this.probability.calculate(input);}get summary(){return {version:PROBABILITY_GATEWAY_VERSION};}}
