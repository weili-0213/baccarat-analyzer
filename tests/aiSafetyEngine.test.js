/**
 * Baccarat Analyzer V8.7
 * tests/aiSafetyEngine.test.js
 */
import SafetyEngine, {
    SAFETY_ENGINE_VERSION,
    SafetyEvent
} from "../casino/ai/safety/SafetyEngine.js";
import {
    SAFETY_STATE_VERSION,
    SafetyState,
    SafetyLevel
} from "../casino/ai/safety/SafetyState.js";
import SafetyContext, {
    SAFETY_CONTEXT_VERSION
} from "../casino/ai/safety/SafetyContext.js";
import HazardRegistry, {
    HAZARD_REGISTRY_VERSION
} from "../casino/ai/safety/HazardRegistry.js";
import ThreatEvaluator, {
    THREAT_EVALUATOR_VERSION
} from "../casino/ai/safety/ThreatEvaluator.js";
import GuardrailEngine, {
    GUARDRAIL_ENGINE_VERSION
} from "../casino/ai/safety/GuardrailEngine.js";
import FailSafeController, {
    FAIL_SAFE_CONTROLLER_VERSION
} from "../casino/ai/safety/FailSafeController.js";
import IncidentManager, {
    INCIDENT_MANAGER_VERSION
} from "../casino/ai/safety/IncidentManager.js";
import SafetyScorer, {
    SAFETY_SCORER_VERSION
} from "../casino/ai/safety/SafetyScorer.js";
import SafetyHistory, {
    SAFETY_HISTORY_VERSION
} from "../casino/ai/safety/SafetyHistory.js";
import SafetyRuntimeAdapter, {
    SAFETY_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/SafetyRuntimeAdapter.js";
import {
    SAFETY_ENGINE_FACTORY_VERSION
} from "../casino/ai/safety/createSafetyEngine.js";

function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

export default async function aiSafetyEngineTest() {
    const messages = [];

    assert(
        [
            SAFETY_ENGINE_VERSION,
            SAFETY_STATE_VERSION,
            SAFETY_CONTEXT_VERSION,
            HAZARD_REGISTRY_VERSION,
            THREAT_EVALUATOR_VERSION,
            GUARDRAIL_ENGINE_VERSION,
            FAIL_SAFE_CONTROLLER_VERSION,
            INCIDENT_MANAGER_VERSION,
            SAFETY_SCORER_VERSION,
            SAFETY_HISTORY_VERSION,
            SAFETY_RUNTIME_ADAPTER_VERSION,
            SAFETY_ENGINE_FACTORY_VERSION
        ].every(version => version === "8.7.0"),
        "V8.7 AI Safety Engine 版本錯誤"
    );

    assert(
        SafetyLevel.SAFE === "safe",
        "Safety Level 錯誤"
    );

    messages.push("✓ V8.7 AI Safety Engine 版本正確");

    const context = new SafetyContext({
        action: {
            actionId: "safe-action",
            risk: "low",
            amount: 10
        },
        ethics: {
            ethical: true
        },
        alignment: {
            aligned: true
        },
        constraints: [
            {
                constraintId: "max-amount",
                evaluate: ({ action }) =>
                    action.amount <= 100,
                reason: "Amount exceeds safe limit."
            }
        ]
    });

    assert(
        context.action.risk === "low" &&
        context.constraints.length === 1,
        "Safety Context 錯誤"
    );

    messages.push("✓ Safety Context 正確");

    const registry = new HazardRegistry();

    registry.register({
        hazardId: "high-risk",
        severity: 4,
        detect: ({ context }) => ({
            detected:
                context.action?.risk === "high",
            score: 80,
            reason: "High-risk action detected."
        })
    });

    registry.register({
        hazardId: "ethics-failure",
        severity: 5,
        detect: ({ context }) => ({
            detected:
                context.ethics?.ethical === false,
            score: 90,
            reason:
                "Ethics engine rejected the action."
        })
    });

    assert(
        registry.summary.count === 2,
        "Hazard Registry 錯誤"
    );

    messages.push("✓ Hazard Registry 正確");

    const threat = new ThreatEvaluator().evaluate({
        hazards: registry.all(),
        context
    });

    assert(
        threat.detected === false &&
        threat.threatScore === 0,
        "Threat Evaluator 錯誤"
    );

    messages.push("✓ Threat Evaluator 正確");

    const guardrail = new GuardrailEngine().evaluate({
        action: context.action,
        constraints: context.constraints,
        threat
    });

    assert(
        guardrail.allowed === true,
        "Guardrail Engine 錯誤"
    );

    messages.push("✓ Guardrail Engine 正確");

    const failSafe = new FailSafeController().decide({
        guardrail,
        threat
    });

    assert(
        failSafe.activated === false &&
        failSafe.action === "continue",
        "Fail-Safe Controller 錯誤"
    );

    messages.push("✓ Fail-Safe Controller 正確");

    const incidentManager = new IncidentManager();

    const incident = incidentManager.create({
        threat,
        guardrail,
        failSafe
    });

    assert(
        incident.status === "none" &&
        incidentManager.summary.count === 1,
        "Incident Manager 錯誤"
    );

    messages.push("✓ Incident Manager 正確");

    const scored = new SafetyScorer().score({
        threat,
        guardrail,
        failSafe
    });

    assert(
        scored.score === 100 &&
        scored.level === SafetyLevel.SAFE,
        "Safety Scorer 錯誤"
    );

    messages.push("✓ Safety Scorer 正確");

    let now = 100;
    const events = [];

    const engine = new SafetyEngine({
        hazards: registry,
        history: new SafetyHistory({
            limit: 20
        }),
        eventBus: {
            emit(type, payload) {
                events.push({
                    type,
                    payload
                });
            }
        },
        clock: () => now++
    });

    assert(
        engine.state === SafetyState.IDLE,
        "Safety Engine initial state 錯誤"
    );

    const result = await engine.check({
        context
    });

    assert(
        result.safe === true &&
        result.level === SafetyLevel.SAFE &&
        result.failSafe.activated === false &&
        engine.state === SafetyState.COMPLETED &&
        engine.summary.checkCount === 1 &&
        engine.summary.history.count === 1,
        "Safety Engine 錯誤"
    );

    messages.push(
        "✓ Scan → Evaluate → Guard → Respond 正確"
    );

    const unsafeContext = new SafetyContext({
        action: {
            actionId: "unsafe-action",
            risk: "high",
            amount: 500
        },
        ethics: {
            ethical: false
        },
        constraints: context.constraints
    });

    const unsafe = await engine.check({
        context: unsafeContext
    });

    assert(
        unsafe.safe === false &&
        unsafe.level === SafetyLevel.UNSAFE &&
        unsafe.failSafe.activated === true &&
        unsafe.incident.status === "open",
        "Unsafe Detection 錯誤"
    );

    messages.push(
        "✓ Unsafe Detection 與 Fail-Safe 正確"
    );

    engine.pause();

    const pausedResult = await engine.check({
        context
    });

    assert(
        engine.state === SafetyState.PAUSED &&
        pausedResult === null,
        "Safety Pause 錯誤"
    );

    engine.resume();

    assert(
        engine.state === SafetyState.IDLE &&
        engine.summary.paused === false,
        "Safety Resume 錯誤"
    );

    messages.push("✓ Pause／Resume 正確");

    const adapter = new SafetyRuntimeAdapter({
        safety: engine
    });

    const adapterResult = await adapter.check({
        context
    });

    assert(
        adapterResult !== null &&
        adapter.summary.safety.checkCount === 3,
        "Safety Runtime Adapter 錯誤"
    );

    messages.push("✓ Runtime Adapter 正確");

    assert(
        [
            SafetyEvent.STARTED,
            SafetyEvent.HAZARDS_LOADED,
            SafetyEvent.THREAT_EVALUATED,
            SafetyEvent.GUARDRAIL_EVALUATED,
            SafetyEvent.FAIL_SAFE_DECIDED,
            SafetyEvent.INCIDENT_CREATED,
            SafetyEvent.SCORE_CALCULATED,
            SafetyEvent.COMPLETED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type === type
                )
        ),
        "Safety Events 錯誤"
    );

    messages.push("✓ Safety Events 正確");

    engine.reset();

    assert(
        engine.state === SafetyState.IDLE &&
        engine.summary.checkCount === 0 &&
        engine.summary.history.count === 0 &&
        engine.summary.incidents.count === 0,
        "Safety Reset 錯誤"
    );

    engine.destroy();

    assert(
        engine.state === SafetyState.DESTROYED &&
        engine.summary.destroyed === true &&
        engine.summary.hazards.count === 0,
        "Safety Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI Safety Engine V8.7 測試完成

Safety State：通過
Safety Context：通過
Hazard Registry：通過
Threat Evaluator：通過
Guardrail Engine：通過
Fail-Safe Controller：通過
Incident Manager：通過
Safety Scorer：通過
Safety Engine：通過
Unsafe Detection：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
