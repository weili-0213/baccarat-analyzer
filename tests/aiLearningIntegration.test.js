/**
 * Baccarat Analyzer V9.5
 * Path: tests/aiLearningIntegration.test.js
 * Purpose: Full V9.5 syntax-compatible runtime integration test.
 */
import {LEARNING_INTEGRATION_STATE_VERSION,LearningIntegrationState,LearningIntegrationAction}
    from "../integration/learning/LearningIntegrationState.js";
import LearningIntegrationContext,{LEARNING_INTEGRATION_CONTEXT_VERSION}
    from "../integration/learning/LearningIntegrationContext.js";
import LearningInputCollector,{LEARNING_INPUT_COLLECTOR_VERSION}
    from "../integration/learning/LearningInputCollector.js";
import OutcomeCollector,{OUTCOME_COLLECTOR_VERSION}
    from "../integration/learning/OutcomeCollector.js";
import PredictionEvaluator,{PREDICTION_EVALUATOR_VERSION}
    from "../integration/learning/PredictionEvaluator.js";
import DecisionEvaluator,{DECISION_EVALUATOR_VERSION}
    from "../integration/learning/DecisionEvaluator.js";
import IntegrationRewardCalculator,{INTEGRATION_REWARD_CALCULATOR_VERSION}
    from "../integration/learning/IntegrationRewardCalculator.js";
import LearningMemoryStore,{LEARNING_MEMORY_STORE_VERSION}
    from "../integration/learning/LearningMemoryStore.js";
import LearningIntegrationHistory,{LEARNING_INTEGRATION_HISTORY_VERSION}
    from "../integration/learning/LearningIntegrationHistory.js";
import LearningEngineGateway,{LEARNING_ENGINE_GATEWAY_VERSION}
    from "../integration/learning/LearningEngineGateway.js";
import AILearningIntegration,{AI_LEARNING_INTEGRATION_VERSION,LearningIntegrationEvent}
    from "../integration/learning/AILearningIntegration.js";
import LearningIntegrationRuntimeAdapter,{LEARNING_INTEGRATION_RUNTIME_ADAPTER_VERSION}
    from "../runtime/adapters/LearningIntegrationRuntimeAdapter.js";
import {AI_LEARNING_INTEGRATION_FACTORY_VERSION}
    from "../integration/learning/createAILearningIntegration.js";

const assert=(condition,message)=>{if(!condition)throw new Error(message);};

export default async function aiLearningIntegrationTest(){
    const messages=[];
    assert([
        LEARNING_INTEGRATION_STATE_VERSION,LEARNING_INTEGRATION_CONTEXT_VERSION,
        LEARNING_INPUT_COLLECTOR_VERSION,OUTCOME_COLLECTOR_VERSION,
        PREDICTION_EVALUATOR_VERSION,DECISION_EVALUATOR_VERSION,
        INTEGRATION_REWARD_CALCULATOR_VERSION,LEARNING_MEMORY_STORE_VERSION,
        LEARNING_INTEGRATION_HISTORY_VERSION,LEARNING_ENGINE_GATEWAY_VERSION,
        AI_LEARNING_INTEGRATION_VERSION,LEARNING_INTEGRATION_RUNTIME_ADAPTER_VERSION,
        AI_LEARNING_INTEGRATION_FACTORY_VERSION
    ].every(version=>version==="9.5.0"),"V9.5 AI Learning Integration 版本錯誤");
    assert(LearningIntegrationAction.UPDATE==="update","Learning Integration Action 錯誤");
    messages.push("✓ V9.5 AI Learning Integration 版本正確");

    const context=new LearningIntegrationContext({
        simulation:{merged:{bestOutcome:"Banker"}},
        prediction:{predictedOutcome:"Banker",confidence:.8,
            fused:{probabilities:{Player:.4,Banker:.5,Tie:.1}}},
        decision:{recommendation:{action:"bet",bestBet:"Banker",confidence:.85,
            expectedValue:.02,kelly:.03,risk:"low",recommendedAmount:30}},
        actualOutcome:{roundId:"r1",winner:"Banker",profit:95,payout:95,stake:100},
        statistics:{roundCount:20},bankroll:{balance:1095},
        before:{roi:0,winRate:0},after:{roi:.095,winRate:1}
    });
    assert(context.prediction.predictedOutcome==="Banker"&&context.actualOutcome.winner==="Banker",
        "Learning Integration Context 錯誤");
    messages.push("✓ Learning Integration Context 正確");

    const input=new LearningInputCollector().collect(context);
    assert(input.decision.recommendation.bestBet==="Banker"&&input.bankroll.balance===1095,
        "Learning Input Collector 錯誤");
    messages.push("✓ Learning Input Collector 正確");

    const outcome=new OutcomeCollector().collect(input.actualOutcome);
    assert(outcome.winner==="Banker"&&outcome.profit===95,"Outcome Collector 錯誤");
    messages.push("✓ Outcome Collector 正確");

    const predictionEvaluation=new PredictionEvaluator().evaluate({
        prediction:input.prediction,outcome
    });
    assert(predictionEvaluation.correct&&predictionEvaluation.actualProbability===.5,
        "Prediction Evaluator 錯誤");
    messages.push("✓ Prediction Evaluator 正確");

    const decisionEvaluation=new DecisionEvaluator().evaluate({
        decision:input.decision,outcome
    });
    assert(decisionEvaluation.correct&&decisionEvaluation.recommendedAmount===30,
        "Decision Evaluator 錯誤");
    messages.push("✓ Decision Evaluator 正確");

    const rewardResult=new IntegrationRewardCalculator().calculate({
        predictionEvaluation,decisionEvaluation,outcome
    });
    assert(rewardResult.reward>5&&rewardResult.action==="update",
        "Integration Reward Calculator 錯誤");
    messages.push("✓ Integration Reward Calculator 正確");

    const memory=new LearningMemoryStore({limit:20});
    memory.add({experienceId:"m1",reward:rewardResult.reward});
    assert(memory.summary.count===1&&memory.summary.totalReward===rewardResult.reward,
        "Learning Memory Store 錯誤");
    memory.clear();
    messages.push("✓ Learning Memory Store 正確");

    const learningCalls=[];
    const learningEngine={
        async learn(data){
            learningCalls.push(data);
            return {learned:true,action:data.reward.action,reward:data.reward.reward};
        }
    };
    const learningGateway=new LearningEngineGateway({learningEngine});
    const gatewayResult=await learningGateway.learn({reward:rewardResult});
    assert(gatewayResult.learned&&gatewayResult.action==="update","Learning Engine Gateway 錯誤");
    messages.push("✓ Learning Engine Gateway 正確");

    let now=100;
    const events=[];
    const integration=new AILearningIntegration({
        learningGateway,
        memory:new LearningMemoryStore({limit:20}),
        history:new LearningIntegrationHistory({limit:20}),
        eventBus:{emit(type,payload){events.push({type,payload});}},
        clock:()=>now++
    });
    assert(integration.state===LearningIntegrationState.IDLE,"Learning initial state 錯誤");

    const result=await integration.run({context});
    assert(result.predictionEvaluation.correct&&result.decisionEvaluation.correct&&
        result.reward.action==="update"&&result.learningResult.learned&&
        integration.state===LearningIntegrationState.COMPLETED&&
        integration.summary.runCount===1&&integration.summary.memory.count===1&&
        integration.summary.history.count===1,"AI Learning Integration 錯誤");
    messages.push("✓ Collect → Evaluate → Reward → Learn → Update 正確");

    const negativeResult=await integration.run({context:new LearningIntegrationContext({
        prediction:{predictedOutcome:"Player",confidence:.9,
            fused:{probabilities:{Player:.8,Banker:.15,Tie:.05}}},
        decision:{recommendation:{action:"bet",bestBet:"Player",recommendedAmount:50}},
        actualOutcome:{winner:"Banker",profit:-50}
    })});
    assert(negativeResult.reward.action==="forget"&&negativeResult.reward.reward<0,
        "Negative Learning 錯誤");
    messages.push("✓ Negative Learning 正確");

    integration.pause();
    assert(await integration.run({context})===null&&integration.state===LearningIntegrationState.PAUSED,
        "Pause 錯誤");
    integration.resume();
    assert(integration.state===LearningIntegrationState.IDLE&&!integration.summary.paused,
        "Resume 錯誤");
    messages.push("✓ Pause／Resume 正確");

    const adapter=new LearningIntegrationRuntimeAdapter({integration});
    const adapterResult=await adapter.learn({context});
    assert(adapterResult&&adapter.summary.integration.runCount===3,"Runtime Adapter 錯誤");
    messages.push("✓ Runtime Adapter 正確");

    assert([
        LearningIntegrationEvent.STARTED,LearningIntegrationEvent.INPUT_COLLECTED,
        LearningIntegrationEvent.OUTCOME_COLLECTED,LearningIntegrationEvent.PREDICTION_EVALUATED,
        LearningIntegrationEvent.DECISION_EVALUATED,LearningIntegrationEvent.REWARD_CALCULATED,
        LearningIntegrationEvent.LEARNING_COMPLETED,LearningIntegrationEvent.MEMORY_UPDATED,
        LearningIntegrationEvent.COMPLETED
    ].every(type=>events.some(event=>event.type===type)),"Learning Integration Events 錯誤");
    messages.push("✓ Learning Integration Events 正確");

    assert(learningCalls.length>=4,"Learning Gateway Call Count 錯誤");

    integration.reset();
    assert(integration.state===LearningIntegrationState.IDLE&&integration.summary.runCount===0&&
        integration.summary.memory.count===0&&integration.summary.history.count===0,
        "Reset 錯誤");
    integration.destroy();
    assert(integration.state===LearningIntegrationState.DESTROYED&&integration.summary.destroyed,
        "Destroy 錯誤");
    messages.push("✓ Summary、Reset 與 Destroy 正確");

    return `
${messages.join("\n")}

AI Learning Integration V9.5 測試完成

Learning Integration State：通過
Learning Integration Context：通過
Learning Input Collector：通過
Outcome Collector：通過
Prediction Evaluator：通過
Decision Evaluator：通過
Integration Reward Calculator：通過
Learning Memory Store：通過
Learning Engine Gateway：通過
AI Learning Integration：通過
Negative Learning：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
