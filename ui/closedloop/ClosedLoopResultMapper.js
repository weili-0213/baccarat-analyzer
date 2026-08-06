/**
 * Baccarat Analyzer V10.1
 * Path: ui/closedloop/ClosedLoopResultMapper.js
 * Purpose: Maps V10.0 Closed-Loop outputs to UI values.
 */
export const CLOSED_LOOP_RESULT_MAPPER_VERSION="10.1.0";
const pct=v=>Number.isFinite(v)?`${Math.round(v*1000)/10}%`:"—";
export default class ClosedLoopResultMapper{
 map(result={}){const o=result.outputs??{},s=o.simulation??{},p=o.prediction??{},d=o.decision??{},st=o.strategy??{},e=o.execution??{},f=o.feedback??{},l=o.learning??{},a=o.adaptive??{};
  const r=d.recommendation??d,probs=s.merged?.probabilities??s.probabilities??p.fused?.probabilities??p.probabilities??{};
  const amount=st.plan?.amount??r.recommendedAmount??null,betType=st.plan?.betType??r.bestBet??"—";
  return {status:result.action??"completed",stage:result.completedStages?.at(-1)??"completed",
   simulation:`P ${pct(probs.Player)} / B ${pct(probs.Banker)} / T ${pct(probs.Tie)}`,
   prediction:p.predictedOutcome??p.bestOutcome??p.fused?.predictedOutcome??"—",confidence:pct(p.confidence??p.fused?.confidence??r.confidence),
   decision:r.action?`${r.action}: ${r.bestBet??"—"}`:"—",strategy:st.selection?.strategy?.strategyId??st.plan?.strategyId??"—",
   bet:amount==null?`${betType}`:`${betType} / ${amount}`,execution:e.monitoring?.status??(e.monitoring?.accepted?"accepted":e.action??"—"),
   feedback:f.action??"—",learning:(l.reward?.reward??l.experience?.reward??l.reward)??"—",adaptive:a.snapshot?.revision!=null?`revision ${a.snapshot.revision}`:a.action??"—",error:""};
 }
 mapError(error){return {status:"error",error:error?.message??String(error)};}
 get summary(){return {version:CLOSED_LOOP_RESULT_MAPPER_VERSION};}
}
