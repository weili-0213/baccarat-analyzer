/** Baccarat Analyzer V7.1 */
import LearningEngine,{LEARNING_ENGINE_VERSION,LearningEvent} from "../casino/ai/learning/LearningEngine.js";
import {LEARNING_STATE_VERSION,LearningState,LearningAction} from "../casino/ai/learning/LearningState.js";
import LearningMemory,{LEARNING_MEMORY_VERSION} from "../casino/ai/learning/LearningMemory.js";
import ExperienceBuffer,{EXPERIENCE_BUFFER_VERSION} from "../casino/ai/learning/ExperienceBuffer.js";
import FeatureExtractor,{FEATURE_EXTRACTOR_VERSION} from "../casino/ai/learning/FeatureExtractor.js";
import OutcomeEvaluator,{OUTCOME_EVALUATOR_VERSION} from "../casino/ai/learning/OutcomeEvaluator.js";
import RewardCalculator,{REWARD_CALCULATOR_VERSION} from "../casino/ai/learning/RewardCalculator.js";
import LearningPolicy,{LEARNING_POLICY_VERSION} from "../casino/ai/learning/LearningPolicy.js";
import LearningRuntimeAdapter,{LEARNING_RUNTIME_ADAPTER_VERSION} from "../runtime/adapters/LearningRuntimeAdapter.js";
import {LEARNING_ENGINE_FACTORY_VERSION} from "../casino/ai/learning/createLearningEngine.js";
const assert=(c,m)=>{if(!c)throw new Error(m);};
export default async function aiLearningEngineTest(){ const messages=[]; assert([LEARNING_ENGINE_VERSION,LEARNING_STATE_VERSION,LEARNING_MEMORY_VERSION,EXPERIENCE_BUFFER_VERSION,FEATURE_EXTRACTOR_VERSION,OUTCOME_EVALUATOR_VERSION,REWARD_CALCULATOR_VERSION,LEARNING_POLICY_VERSION,LEARNING_RUNTIME_ADAPTER_VERSION,LEARNING_ENGINE_FACTORY_VERSION].every(v=>v==="7.1.0"),"V7.1 AI Learning Engine 版本錯誤"); messages.push("✓ V7.1 AI Learning Engine 版本正確"); const memory=new LearningMemory({limit:10}); memory.add({experienceId:"m1",reward:5}); assert(memory.summary.count===1&&memory.summary.totalReward===5,"Learning Memory 錯誤"); messages.push("✓ Learning Memory 正確"); const buffer=new ExperienceBuffer({capacity:3,random:()=>0}); buffer.push({experienceId:"b1"}); buffer.push({experienceId:"b2"}); assert(buffer.sample(1)[0].experienceId==="b1","Experience Buffer 錯誤"); messages.push("✓ Experience Buffer 正確"); const extractor=new FeatureExtractor(); const features=extractor.extract({decision:{bestBet:"Banker",confidence:.8,score:80,expectedValue:.02,kelly:.03,risk:"low",fusedProbability:{Player:.4,Banker:.5,Tie:.1},patterns:[{}],trend:{strength:.7}},statistics:{roundCount:20,winners:{Player:8,Banker:11,Tie:1}},roadmap:{bigRoad:["B","B","P"]},bankroll:{balance:1000,profit:100}}); assert(features.bankerRate===.55&&features.roadmapSize===3,"Feature Extractor 錯誤"); messages.push("✓ Feature Extractor 正確"); const evaluator=new OutcomeEvaluator(); const evaluation=evaluator.evaluate({decision:{action:"recommend",bestBet:"Banker"},outcome:{winner:"Banker",profit:95},before:{roi:.01,winRate:.5},after:{roi:.02,winRate:.55}}); assert(evaluation.correct&&evaluation.successful,"Outcome Evaluator 錯誤"); messages.push("✓ Outcome Evaluator 正確"); const reward=new RewardCalculator().calculate({evaluation,features}); assert(reward.reward>5,"Reward Calculator 錯誤"); messages.push("✓ Reward Calculator 正確"); const policy=new LearningPolicy(); assert(policy.decide({reward:reward.reward,experience:{weight:1}}).action===LearningAction.UPDATE&&policy.decide({reward:-5}).action===LearningAction.FORGET,"Learning Policy 錯誤"); messages.push("✓ Learning Policy 正確"); let now=100; const events=[]; const engine=new LearningEngine({memory:new LearningMemory({limit:20}),buffer:new ExperienceBuffer({capacity:20,random:()=>0}),featureExtractor:extractor,outcomeEvaluator:evaluator,rewardCalculator:new RewardCalculator(),policy,eventBus:{emit(type,payload){events.push({type,payload});}},clock:()=>now++}); assert(engine.state===LearningState.IDLE,"Learning initial state 錯誤"); const experience=await engine.learn({decision:{decisionId:"d1",action:"recommend",bestBet:"Banker",confidence:.8,score:80,expectedValue:.02,kelly:.03,risk:"low",fusedProbability:{Player:.4,Banker:.5,Tie:.1},patterns:[{}],trend:{strength:.7}},outcome:{winner:"Banker",profit:95},statistics:{roundCount:20,winners:{Player:8,Banker:11,Tie:1}},bankroll:{balance:1095,profit:95},before:{roi:0,winRate:0},after:{roi:.095,winRate:1}}); assert(experience.reward>0&&engine.state===LearningState.COMPLETED&&engine.summary.memory.count===1&&engine.summary.buffer.size===1,"Learning Engine learn 錯誤"); messages.push("✓ Learning Engine 正確"); assert(engine.sample(1).length===1,"Replay Sample 錯誤"); messages.push("✓ Replay Sample 正確"); engine.pause(); assert(await engine.learn({decision:{decisionId:"paused"}})===null,"Pause 錯誤"); engine.resume(); assert(engine.state===LearningState.IDLE,"Resume 錯誤"); messages.push("✓ Pause／Resume 正確"); const adapter=new LearningRuntimeAdapter({learning:engine}); const e2=await adapter.learn({decision:{decisionId:"d2",action:"skip",candidateBet:"Player",confidence:.4,expectedValue:-.01,risk:"medium"},outcome:{winner:"Banker",profit:0}}); assert(e2&&adapter.summary.learning.learningCount===2,"Runtime Adapter 錯誤"); messages.push("✓ Runtime Adapter 正確"); assert([LearningEvent.COLLECTING,LearningEvent.EXPERIENCE_CREATED,LearningEvent.OUTCOME_EVALUATED,LearningEvent.REWARD_CALCULATED,LearningEvent.POLICY_APPLIED,LearningEvent.MEMORY_UPDATED,LearningEvent.COMPLETED].every(t=>events.some(e=>e.type===t)),"Learning Events 錯誤"); messages.push("✓ Learning Events 正確"); engine.reset(); assert(engine.summary.memory.count===0&&engine.summary.buffer.size===0,"Reset 錯誤"); engine.destroy(); assert(engine.state===LearningState.DESTROYED&&engine.summary.destroyed,"Destroy 錯誤"); messages.push("✓ Summary、Reset 與 Destroy 正確"); return `
${messages.join("\n")}

AI Learning Engine V7.1 測試完成

Learning State：通過
Learning Memory：通過
Experience Buffer：通過
Feature Extractor：通過
Outcome Evaluator：通過
Reward Calculator：通過
Learning Policy：通過
Learning Engine：通過
Replay Sample：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
