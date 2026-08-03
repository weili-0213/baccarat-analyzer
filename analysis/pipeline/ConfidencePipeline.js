/**
 * Baccarat Analyzer V3.5
 * analysis/pipeline/ConfidencePipeline.js
 */

export const CONFIDENCE_PIPELINE_VERSION = "3.5.0";

function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function clamp01(value) {
    return Math.min(1, Math.max(0, value));
}

function normalize(result) {
    if (Number.isFinite(result)) {
        return { value: clamp01(result), level: null, label: null, provisional: false };
    }

    if (!isObject(result)) throw new TypeError("Confidence result must be a number or object.");
    const value = result.value ?? result.confidence ?? result.score;
    if (!Number.isFinite(value)) throw new TypeError("Confidence result requires a finite value.");

    return {
        value: clamp01(value),
        level: result.level ?? result.confidenceLevel ?? null,
        label: result.label ?? result.confidenceLabel ?? null,
        provisional: Boolean(result.provisional ?? result.confidenceProvisional)
    };
}

export default class ConfidencePipeline {
    constructor({ engine, betConfig, overallMethod = "maximum" } = {}) {
        if (!engine) throw new Error("ConfidencePipeline requires a Confidence engine.");
        if (!isObject(betConfig)) throw new TypeError("ConfidencePipeline requires betConfig.");
        if (!["maximum", "average", "bestEV"].includes(overallMethod)) {
            throw new Error(`Unknown overall confidence method: ${overallMethod}`);
        }

        this.engine = engine;
        this.betConfig = betConfig;
        this.overallMethod = overallMethod;
    }

    calculate(name, state) {
        const payload = {
            name,
            probability: state.probability[name],
            ev: state.ev[name],
            risk: state.risk[name],
            riskLevel: state.riskLevel?.[name] ?? null,
            kelly: state.kelly?.[name] ?? 0,
            amount: state.amount?.[name] ?? 0,
            method: state.method,
            monteCarlo: state.monteCarlo,
            exact: state.exact,
            roundCount: state.roundCount ?? 0,
            historyCount: state.historyCount ?? 0
        };

        if (typeof this.engine.evaluateBet === "function") return this.engine.evaluateBet(payload);
        if (typeof this.engine[name] === "function") return this.engine[name](payload);
        if (typeof this.engine.evaluate === "function") return this.engine.evaluate(payload);
        if (typeof this.engine.calculate === "function") return this.engine.calculate(payload);
        throw new Error(`Confidence engine cannot evaluate ${name}.`);
    }

    calculateOverall(confidence, state) {
        const entries = Object.entries(confidence).filter(
            ([name, value]) => Number.isFinite(value) && Number.isFinite(state.ev[name])
        );

        if (!entries.length) return 0;
        if (this.overallMethod === "average") {
            return entries.reduce((total, [, value]) => total + value, 0) / entries.length;
        }
        if (this.overallMethod === "bestEV") {
            entries.sort(([left], [right]) => state.ev[right] - state.ev[left]);
            return entries[0][1];
        }
        return Math.max(...entries.map(([, value]) => value));
    }

    run({ state }) {
        if (!isObject(state.probability)) throw new Error("ConfidencePipeline requires state.probability.");
        if (!isObject(state.ev)) throw new Error("ConfidencePipeline requires state.ev.");
        if (!isObject(state.risk)) throw new Error("ConfidencePipeline requires state.risk.");

        const confidence = {};
        const confidenceLevel = {};
        const confidenceLabel = {};
        const confidenceProvisional = {};

        for (const name of Object.keys(this.betConfig)) {
            if (
                !Number.isFinite(state.probability[name]) ||
                !Number.isFinite(state.ev[name]) ||
                !Number.isFinite(state.risk[name])
            ) continue;

            const item = normalize(this.calculate(name, state));
            confidence[name] = item.value;
            confidenceLevel[name] = item.level;
            confidenceLabel[name] = item.label;
            confidenceProvisional[name] = item.provisional;
        }

        return {
            confidence,
            confidenceLevel,
            confidenceLabel,
            confidenceProvisional,
            overallConfidence: this.calculateOverall(confidence, state)
        };
    }

    toDefinition({ name = "confidence", priority = 40 } = {}) {
        return {
            name,
            priority,
            requires: ["probability", "ev", "risk"],
            run: context => this.run(context),
            metadata: { version: CONFIDENCE_PIPELINE_VERSION, type: "confidence" }
        };
    }

    get summary() {
        return {
            version: CONFIDENCE_PIPELINE_VERSION,
            bets: Object.keys(this.betConfig).length,
            overallMethod: this.overallMethod
        };
    }
}
