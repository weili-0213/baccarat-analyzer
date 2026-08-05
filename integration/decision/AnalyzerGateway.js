/** Baccarat Analyzer V9.2 */
export const ANALYZER_GATEWAY_VERSION = "9.2.0";
export default class AnalyzerGateway {
    constructor({analyzer}={}) { if(!analyzer || typeof analyzer.analyze!=="function") throw new TypeError("AnalyzerGateway requires analyzer.analyze()."); this.analyzer=analyzer; }
    async analyze(input={}) { return this.analyzer.analyze(input); }
    get summary(){ return {version:ANALYZER_GATEWAY_VERSION}; }
}
