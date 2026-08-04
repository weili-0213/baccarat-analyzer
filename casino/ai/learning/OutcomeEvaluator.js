/** Baccarat Analyzer V7.1 */
export const OUTCOME_EVALUATOR_VERSION = "7.1.0";
export default class OutcomeEvaluator {
  evaluate({decision={},outcome={},before={},after={}}={}) {
    const predicted=decision.bestBet??decision.candidateBet??null;
    const actual=outcome.winner??outcome.result?.winner??null;
    const recommended=decision.action==="recommend";
    const skipped=decision.action==="skip"||decision.action==="wait";
    const correct=recommended&&predicted!==null&&predicted===actual;
    const profit=Number.isFinite(outcome.profit)?outcome.profit:0;
    const roiDelta=(Number.isFinite(after.roi)?after.roi:(Number.isFinite(before.roi)?before.roi:0))-(Number.isFinite(before.roi)?before.roi:0);
    const winRateDelta=(Number.isFinite(after.winRate)?after.winRate:(Number.isFinite(before.winRate)?before.winRate:0))-(Number.isFinite(before.winRate)?before.winRate:0);
    return {predicted,actual,recommended,skipped,correct,profit,roiDelta,winRateDelta,successful:skipped?profit>=0:correct&&profit>=0};
  }
  get summary(){ return {version:OUTCOME_EVALUATOR_VERSION}; }
}
