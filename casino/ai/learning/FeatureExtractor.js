/** Baccarat Analyzer V7.1 */
export const FEATURE_EXTRACTOR_VERSION = "7.1.0";
const n=v=>Number.isFinite(v)?v:0;
export default class FeatureExtractor {
  extract({decision={},analysis={},statistics={},roadmap={},bankroll={}}={}) {
    const bestBet=decision.bestBet??decision.candidateBet??analysis.recommendation?.bestBet??null;
    const p=decision.fusedProbability??analysis.probability??{};
    const w=statistics.winners??{};
    const rounds=n(statistics.roundCount)||Object.values(w).reduce((s,v)=>s+n(v),0);
    return {bestBet,confidence:n(decision.confidence),score:n(decision.score),expectedValue:n(decision.expectedValue),kelly:n(decision.kelly),risk:decision.risk??"unavailable",playerProbability:n(p.Player),bankerProbability:n(p.Banker),tieProbability:n(p.Tie),playerRate:rounds?n(w.Player)/rounds:0,bankerRate:rounds?n(w.Banker)/rounds:0,tieRate:rounds?n(w.Tie)/rounds:0,patternCount:Array.isArray(decision.patterns)?decision.patterns.length:0,trendStrength:n(decision.trend?.strength),roadmapSize:Array.isArray(roadmap.bigRoad)?roadmap.bigRoad.length:0,bankrollBalance:n(bankroll.balance),bankrollProfit:n(bankroll.profit)};
  }
  get summary(){ return {version:FEATURE_EXTRACTOR_VERSION}; }
}
