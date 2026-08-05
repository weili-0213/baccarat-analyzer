/**
 * Baccarat Analyzer V9.2
 * tests/aiDecisionIntegration.test.js
 */
import { DECISION_INTEGRATION_STATE_VERSION, DecisionIntegrationState, DecisionIntegrationAction } from "../integration/decision/DecisionIntegrationState.js";
import DecisionIntegrationContext, { DECISION_INTEGRATION_CONTEXT_VERSION } from "../integration/decision/DecisionIntegrationContext.js";
import DecisionInputCollector, { DECISION_INPUT_COLLECTOR_VERSION } from "../integration/decision/DecisionInputCollector.js";
import AnalyzerGateway, { ANALYZER_GATEWAY_VERSION } from "../integration/decision/AnalyzerGateway.js";
import StrategyGateway, { STRATEGY_GATEWAY_VERSION } from "../integration/decision/StrategyGateway.js";
import DecisionGateway, { DECISION_GATEWAY_VERSION } from "../integration/decision/DecisionGateway.js";
import BetRecommendationMapper, { BET_RECOMMENDATION_MAPPER_VERSION } from "../integration/decision/BetRecommendationMapper.js";
import DecisionIntegrationHistory, { DECISION_INTEGRATION_HISTORY_VERSION } from "../integration/decision/DecisionIntegrationHistory.js";
import AIDecisionIntegration, { AI_DECISION_INTEGRATION_VERSION, DecisionIntegrationEvent } from "../integration/decision/AIDecisionIntegration.js";
import DecisionIntegrationRuntimeAdapter, { DECISION_INTEGRATION_RUNTIME_ADAPTER_VERSION } from "../runtime/adapters/DecisionIntegrationRuntimeAdapter.js";
import { AI_DECISION_INTEGRATION_FACTORY_VERSION } from "../integration/decision/createAIDecisionIntegration.js";

function assert(condition,message){ if(!condition) throw new Error(message); }

export default async function aiDecisionIntegrationTest(){
    const messages=[];
    assert([DECISION_INTEGRATION_STATE_VERSION,DECISION_INTEGRATION_CONTEXT_VERSION,DECISION_INPUT_COLLECTOR_VERSION,ANALYZER_GATEWAY_VERSION,STRATEGY_GATEWAY_VERSION,DECISION_GATEWAY_VERSION,BET_RECOMMENDATION_MAPPER_VERSION,DECISION_INTEGRATION_HISTORY_VERSION,AI_DECISION_INTEGRATION_VERSION,DECISION_INTEGRATION_RUNTIME_ADAPTER_VERSION,AI_DECISION_INTEGRATION_FACTORY_VERSION].every(v=>v==="9.2.0"),"V9.2 AI Decision Integration 版本錯誤");
    assert(DecisionIntegrationAction.BET==="bet","Decision Integration Action 錯誤");
    messages.push("✓ V9.2 AI Decision Integration 版本正確");

    const context=new DecisionIntegrationContext({round:{roundId:"r1"},statistics:{roundCount:20},roadmap:{bigRoad:["B","B","P"]},bankroll:{balance:1000}});
    assert(context.round.roundId==="r1"&&context.bankroll.balance===1000,"Decision Integration Context 錯誤");
    messages.push("✓ Decision Integration Context 正確");

    const collected=new DecisionInputCollector().collect(context);
    assert(collected.analyzerInput.round.roundId==="r1"&&collected.bankroll.balance===1000,"Decision Input Collector 錯誤");
    messages.push("✓ Decision Input Collector 正確");

    const analyzer={async analyze(){return {bestBet:"Banker",confidence:.8,expectedValue:.02,kelly:.03,risk:"low"};}};
    const strategy={async evaluate({analysis}){return {bestBet:analysis.bestBet,confidence:.85,expectedValue:analysis.expectedValue,kelly:analysis.kelly,risk:analysis.risk};}};
    const decision={async decide({strategy}){return {action:"bet",bestBet:strategy.bestBet,confidence:.9,expectedValue:strategy.expectedValue,kelly:strategy.kelly,risk:strategy.risk,reason:"Positive EV and acceptable risk."};}};

    const analyzerGateway=new AnalyzerGateway({analyzer});
    const strategyGateway=new StrategyGateway({strategy});
    const decisionGateway=new DecisionGateway({decision});

    assert((await analyzerGateway.analyze({})).bestBet==="Banker","Analyzer Gateway 錯誤");
    assert((await strategyGateway.evaluate({analysis:{bestBet:"Banker",expectedValue:.02,kelly:.03,risk:"low"}})).bestBet==="Banker","Strategy Gateway 錯誤");
    assert((await decisionGateway.decide({strategy:{bestBet:"Banker",expectedValue:.02,kelly:.03,risk:"low"}})).action==="bet","Decision Gateway 錯誤");
    messages.push("✓ Analyzer、Strategy、Decision Gateway 正確");

    const mapped=new BetRecommendationMapper().map({decision:{action:"bet",bestBet:"Banker",confidence:.9,expectedValue:.02,kelly:.03,risk:"low"},bankroll:{balance:1000}});
    assert(mapped.bestBet==="Banker"&&mapped.recommendedAmount===30,"Bet Recommendation Mapper 錯誤");
    messages.push("✓ Bet Recommendation Mapper 正確");

    let now=100; const events=[];
    const integration=new AIDecisionIntegration({analyzerGateway,strategyGateway,decisionGateway,history:new DecisionIntegrationHistory({limit:20}),eventBus:{emit(type,payload){events.push({type,payload});}},clock:()=>now++});
    assert(integration.state===DecisionIntegrationState.IDLE,"Decision Integration initial state 錯誤");

    const result=await integration.run({context});
    assert(result.recommendation.action==="bet"&&result.recommendation.bestBet==="Banker"&&result.recommendation.recommendedAmount===30&&integration.state===DecisionIntegrationState.COMPLETED&&integration.summary.runCount===1&&integration.summary.history.count===1,"AI Decision Integration 錯誤");
    messages.push("✓ Collect → Analyze → Strategy → Decide → Map 正確");

    integration.pause();
    assert(await integration.run({context})===null&&integration.state===DecisionIntegrationState.PAUSED,"Decision Integration Pause 錯誤");
    integration.resume();
    assert(integration.state===DecisionIntegrationState.IDLE&&!integration.summary.paused,"Decision Integration Resume 錯誤");
    messages.push("✓ Pause／Resume 正確");

    const adapter=new DecisionIntegrationRuntimeAdapter({integration});
    const adapterResult=await adapter.analyze({context});
    assert(adapterResult&&adapter.summary.integration.runCount===2,"Decision Integration Runtime Adapter 錯誤");
    messages.push("✓ Runtime Adapter 正確");

    assert([DecisionIntegrationEvent.STARTED,DecisionIntegrationEvent.INPUT_COLLECTED,DecisionIntegrationEvent.ANALYSIS_COMPLETED,DecisionIntegrationEvent.STRATEGY_COMPLETED,DecisionIntegrationEvent.DECISION_COMPLETED,DecisionIntegrationEvent.RECOMMENDATION_MAPPED,DecisionIntegrationEvent.COMPLETED].every(type=>events.some(event=>event.type===type)),"Decision Integration Events 錯誤");
    messages.push("✓ Decision Integration Events 正確");

    integration.reset();
    assert(integration.state===DecisionIntegrationState.IDLE&&integration.summary.runCount===0&&integration.summary.history.count===0,"Decision Integration Reset 錯誤");
    integration.destroy();
    assert(integration.state===DecisionIntegrationState.DESTROYED&&integration.summary.destroyed,"Decision Integration Destroy 錯誤");
    messages.push("✓ Summary、Reset 與 Destroy 正確");

    return `
${messages.join("\n")}

AI Decision Integration V9.2 測試完成

Decision Integration State：通過
Decision Integration Context：通過
Decision Input Collector：通過
Analyzer Gateway：通過
Strategy Gateway：通過
Decision Gateway：通過
Bet Recommendation Mapper：通過
AI Decision Integration：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
