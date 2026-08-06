/**
 * Baccarat Analyzer V9.7
 * Path: tests/aiStrategyIntegration.test.js
 * Purpose: Full V9.7 syntax-compatible runtime integration test.
 */
import {STRATEGY_INTEGRATION_STATE_VERSION,StrategyIntegrationState,StrategyIntegrationAction}
    from "../integration/strategy/StrategyIntegrationState.js";
import StrategyIntegrationContext,{STRATEGY_INTEGRATION_CONTEXT_VERSION}
    from "../integration/strategy/StrategyIntegrationContext.js";
import StrategyInputCollector,{STRATEGY_INPUT_COLLECTOR_VERSION}
    from "../integration/strategy/StrategyInputCollector.js";
import StrategyRepository,{STRATEGY_REPOSITORY_VERSION}
    from "../integration/strategy/StrategyRepository.js";
import StrategyFeatureExtractor,{STRATEGY_FEATURE_EXTRACTOR_VERSION}
    from "../integration/strategy/StrategyFeatureExtractor.js";
import StrategyScorer,{STRATEGY_SCORER_VERSION}
    from "../integration/strategy/StrategyScorer.js";
import StrategySelector,{STRATEGY_SELECTOR_VERSION}
    from "../integration/strategy/StrategySelector.js";
import StrategyConflictResolver,{STRATEGY_CONFLICT_RESOLVER_VERSION}
    from "../integration/strategy/StrategyConflictResolver.js";
import BetPlanBuilder,{BET_PLAN_BUILDER_VERSION}
    from "../integration/strategy/BetPlanBuilder.js";
import StrategyIntegrationHistory,{STRATEGY_INTEGRATION_HISTORY_VERSION}
    from "../integration/strategy/StrategyIntegrationHistory.js";
import AIStrategyIntegration,{AI_STRATEGY_INTEGRATION_VERSION,StrategyIntegrationEvent}
    from "../integration/strategy/AIStrategyIntegration.js";
import StrategyIntegrationRuntimeAdapter,{STRATEGY_INTEGRATION_RUNTIME_ADAPTER_VERSION}
    from "../runtime/adapters/StrategyIntegrationRuntimeAdapter.js";
import {AI_STRATEGY_INTEGRATION_FACTORY_VERSION}
    from "../integration/strategy/createAIStrategyIntegration.js";

const assert=(c,m)=>{if(!c)throw new Error(m);};

export default async function aiStrategyIntegrationTest(){
    const messages=[];
    assert([
        STRATEGY_INTEGRATION_STATE_VERSION,STRATEGY_INTEGRATION_CONTEXT_VERSION,
        STRATEGY_INPUT_COLLECTOR_VERSION,STRATEGY_REPOSITORY_VERSION,
        STRATEGY_FEATURE_EXTRACTOR_VERSION,STRATEGY_SCORER_VERSION,
        STRATEGY_SELECTOR_VERSION,STRATEGY_CONFLICT_RESOLVER_VERSION,
        BET_PLAN_BUILDER_VERSION,STRATEGY_INTEGRATION_HISTORY_VERSION,
        AI_STRATEGY_INTEGRATION_VERSION,STRATEGY_INTEGRATION_RUNTIME_ADAPTER_VERSION,
        AI_STRATEGY_INTEGRATION_FACTORY_VERSION
    ].every(v=>v==="9.7.0"),"V9.7 AI Strategy Integration 版本錯誤");
    assert(StrategyIntegrationAction.EXECUTE==="execute","Strategy Action 錯誤");
    messages.push("✓ V9.7 AI Strategy Integration 版本正確");

    const strategies=[
        {strategyId:"balanced",riskLevel:.5,baseWeight:1,stakeMultiplier:1,
            description:"Balanced strategy",maxRounds:3},
        {strategyId:"aggressive",riskLevel:.8,baseWeight:.9,stakeMultiplier:1.5,
            requiresPositiveReward:true,description:"Aggressive strategy",maxRounds:2},
        {strategyId:"conservative",riskLevel:.2,baseWeight:.95,stakeMultiplier:.5,
            description:"Conservative strategy",maxRounds:5}
    ];
    const context=new StrategyIntegrationContext({
        prediction:{confidence:.8},
        decision:{recommendation:{action:"bet",bestBet:"Banker",confidence:.85,
            expectedValue:.02,risk:"low",recommendedAmount:40}},
        learning:{reward:{reward:6}},
        adaptive:{snapshot:{current:{riskTolerance:.5,kellyMultiplier:.5}}},
        bankroll:{balance:1000,profit:100},
        statistics:{roundCount:20},roadmap:{bigRoad:["B","B","P"]},
        settings:{minimumStrategyScore:.3}
    });
    assert(context.decision.recommendation.bestBet==="Banker","Strategy Context 錯誤");
    messages.push("✓ Strategy Integration Context 正確");

    const input=new StrategyInputCollector().collect(context);
    assert(input.bankroll.balance===1000,"Strategy Input Collector 錯誤");
    messages.push("✓ Strategy Input Collector 正確");

    const repository=new StrategyRepository({strategies});
    assert(repository.summary.count===3&&repository.get("balanced").strategyId==="balanced",
        "Strategy Repository 錯誤");
    messages.push("✓ Strategy Repository 正確");

    const features=new StrategyFeatureExtractor().extract(input);
    assert(features.predictionConfidence===.8&&features.kellyMultiplier===.5,
        "Strategy Feature Extractor 錯誤");
    messages.push("✓ Strategy Feature Extractor 正確");

    const scorer=new StrategyScorer();
    const scores=repository.all().map(strategy=>scorer.score({strategy,features}));
    assert(scores.length===3&&scores.every(item=>item.score>0),"Strategy Scorer 錯誤");
    messages.push("✓ Strategy Scorer 正確");

    const selection=new StrategySelector().select({
        strategies:repository.all(),scores,minimumScore:.3
    });
    assert(selection.strategy&&selection.score.score>=.3,"Strategy Selector 錯誤");
    messages.push("✓ Strategy Selector 正確");

    const resolution=new StrategyConflictResolver().resolve({selection,input,features});
    assert(resolution.allowed,"Strategy Conflict Resolver 錯誤");
    messages.push("✓ Strategy Conflict Resolver 正確");

    const plan=new BetPlanBuilder().build({strategy:resolution.strategy,input,features});
    assert(plan.action==="bet"&&plan.betType==="Banker"&&plan.amount>0,
        "Bet Plan Builder 錯誤");
    messages.push("✓ Bet Plan Builder 正確");

    let now=100;
    const events=[];
    const integration=new AIStrategyIntegration({
        repository,history:new StrategyIntegrationHistory({limit:20}),
        eventBus:{emit(type,payload){events.push({type,payload});}},
        clock:()=>now++
    });
    assert(integration.state===StrategyIntegrationState.IDLE,"Strategy initial state 錯誤");

    const result=await integration.run({context});
    assert(result.action===StrategyIntegrationAction.EXECUTE&&result.plan&&
        integration.state===StrategyIntegrationState.COMPLETED&&
        integration.summary.runCount===1&&integration.summary.history.count===1,
        "AI Strategy Integration 錯誤");
    messages.push("✓ Collect → Score → Select → Resolve → Build 正確");

    const waitResult=await integration.run({context:new StrategyIntegrationContext({
        prediction:{confidence:.7},
        decision:{recommendation:{action:"wait",bestBet:null,recommendedAmount:0}},
        learning:{reward:{reward:1}},
        adaptive:{snapshot:{current:{riskTolerance:.4,kellyMultiplier:.5}}},
        settings:{minimumStrategyScore:.3}
    })});
    assert(waitResult.action===StrategyIntegrationAction.WAIT&&waitResult.plan===null,
        "Strategy Wait Decision 錯誤");
    messages.push("✓ Strategy Wait Decision 正確");

    integration.pause();
    assert(await integration.run({context})===null&&integration.state===StrategyIntegrationState.PAUSED,
        "Pause 錯誤");
    integration.resume();
    assert(integration.state===StrategyIntegrationState.IDLE&&!integration.summary.paused,
        "Resume 錯誤");
    messages.push("✓ Pause／Resume 正確");

    const adapter=new StrategyIntegrationRuntimeAdapter({integration});
    const adapterResult=await adapter.strategize({context});
    assert(adapterResult&&adapter.summary.integration.runCount===3,"Runtime Adapter 錯誤");
    messages.push("✓ Runtime Adapter 正確");

    assert([
        StrategyIntegrationEvent.STARTED,StrategyIntegrationEvent.INPUT_COLLECTED,
        StrategyIntegrationEvent.FEATURES_EXTRACTED,StrategyIntegrationEvent.STRATEGIES_SCORED,
        StrategyIntegrationEvent.STRATEGY_SELECTED,StrategyIntegrationEvent.CONFLICT_RESOLVED,
        StrategyIntegrationEvent.PLAN_BUILT,StrategyIntegrationEvent.COMPLETED
    ].every(type=>events.some(event=>event.type===type)),"Strategy Events 錯誤");
    messages.push("✓ Strategy Integration Events 正確");

    integration.reset();
    assert(integration.state===StrategyIntegrationState.IDLE&&integration.summary.runCount===0&&
        integration.summary.history.count===0,"Reset 錯誤");
    integration.destroy();
    assert(integration.state===StrategyIntegrationState.DESTROYED&&integration.summary.destroyed,
        "Destroy 錯誤");
    messages.push("✓ Summary、Reset 與 Destroy 正確");

    return `
${messages.join("\n")}

AI Strategy Integration V9.7 測試完成

Strategy Integration State：通過
Strategy Integration Context：通過
Strategy Input Collector：通過
Strategy Repository：通過
Strategy Feature Extractor：通過
Strategy Scorer：通過
Strategy Selector：通過
Strategy Conflict Resolver：通過
Bet Plan Builder：通過
AI Strategy Integration：通過
Strategy Wait Decision：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
