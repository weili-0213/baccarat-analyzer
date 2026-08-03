/**
 * Baccarat Analyzer V3.5
 * analysis/pipeline/KellyRiskPipeline.js
 */

export const KELLY_RISK_PIPELINE_VERSION = "3.5.0";

function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

function finite(value, fallback = null) {
    return Number.isFinite(value) ? value : fallback;
}

export default class KellyRiskPipeline {
    constructor({
        kellyEngine,
        riskEngine,
        betConfig,
        bankroll = 10000,
        fraction = 0.25,
        minBet = 100,
        maxBet = 10000,
        roundTo = 100,
        maxBankrollRatio = 1
    } = {}) {
        if (!kellyEngine) throw new Error("KellyRiskPipeline requires a Kelly engine.");
        if (!riskEngine) throw new Error("KellyRiskPipeline requires a Risk engine.");
        if (!isObject(betConfig)) throw new TypeError("KellyRiskPipeline requires betConfig.");

        this.kellyEngine = kellyEngine;
        this.riskEngine = riskEngine;
        this.betConfig = betConfig;
        this.defaults = { bankroll, fraction, minBet, maxBet, roundTo, maxBankrollRatio };
        this.validateOptions(this.defaults);
    }

    validateOptions(options) {
        const { bankroll, fraction, minBet, maxBet, roundTo, maxBankrollRatio } = options;
        if (!Number.isFinite(bankroll) || bankroll < 0) throw new RangeError("bankroll must be non-negative.");
        if (!Number.isFinite(fraction) || fraction < 0) throw new RangeError("fraction must be non-negative.");
        if (!Number.isFinite(minBet) || minBet < 0) throw new RangeError("minBet must be non-negative.");
        if (!Number.isFinite(maxBet) || maxBet < minBet) throw new RangeError("maxBet must be >= minBet.");
        if (!Number.isFinite(roundTo) || roundTo <= 0) throw new RangeError("roundTo must be > 0.");
        if (!Number.isFinite(maxBankrollRatio) || maxBankrollRatio < 0 || maxBankrollRatio > 1) {
            throw new RangeError("maxBankrollRatio must be between 0 and 1.");
        }
    }

    resolveOptions(state) {
        const runOptions = isObject(state.runOptions) ? state.runOptions : {};
        const options = {
            bankroll: finite(runOptions.bankroll, finite(state.bankroll, this.defaults.bankroll)),
            fraction: finite(runOptions.fraction, this.defaults.fraction),
            minBet: finite(runOptions.minBet, this.defaults.minBet),
            maxBet: finite(runOptions.maxBet, this.defaults.maxBet),
            roundTo: finite(runOptions.roundTo, this.defaults.roundTo),
            maxBankrollRatio: finite(runOptions.maxBankrollRatio, this.defaults.maxBankrollRatio)
        };
        this.validateOptions(options);
        return options;
    }

    calculateKelly(name, probability, ev, options) {
        const payload = { name, probability, ev, ...options };
        if (typeof this.kellyEngine.calculateBet === "function") return this.kellyEngine.calculateBet(payload);
        if (typeof this.kellyEngine[name] === "function") return this.kellyEngine[name](payload);
        if (typeof this.kellyEngine.calculate === "function") return this.kellyEngine.calculate(probability, ev, options);
        throw new Error(`Kelly engine cannot calculate ${name}.`);
    }

    calculateRisk(name, probability, ev, kelly, amount, options) {
        const payload = { name, probability, ev, kelly, amount, ...options };
        if (typeof this.riskEngine.evaluateBet === "function") return this.riskEngine.evaluateBet(payload);
        if (typeof this.riskEngine[name] === "function") return this.riskEngine[name](payload);
        if (typeof this.riskEngine.evaluate === "function") return this.riskEngine.evaluate(payload);
        throw new Error(`Risk engine cannot evaluate ${name}.`);
    }

    normalizeKelly(result) {
        if (Number.isFinite(result)) return { fraction: result, fullKelly: result, amount: null };
        if (!isObject(result)) throw new TypeError("Kelly result must be a number or object.");
        const fraction = finite(result.fraction, finite(result.kelly, finite(result.value, 0)));
        return {
            fraction,
            fullKelly: finite(result.fullKelly, fraction),
            amount: finite(result.amount, null)
        };
    }

    normalizeRisk(result) {
        if (Number.isFinite(result)) return { value: result, level: null, label: null };
        if (!isObject(result)) throw new TypeError("Risk result must be a number or object.");
        return {
            value: finite(result.value, finite(result.risk, 0)),
            level: result.level ?? result.riskLevel ?? null,
            label: result.label ?? result.riskLabel ?? null
        };
    }

    normalizeAmount(rawAmount, options) {
        if (!Number.isFinite(rawAmount) || rawAmount <= 0) return 0;
        const upper = Math.min(options.maxBet, options.bankroll * options.maxBankrollRatio);
        const rounded = Math.floor(rawAmount / options.roundTo) * options.roundTo;
        if (rounded < options.minBet || upper < options.minBet) return 0;
        return Math.min(upper, Math.max(options.minBet, rounded));
    }

    run({ state }) {
        if (!isObject(state.probability)) throw new Error("KellyRiskPipeline requires state.probability.");
        if (!isObject(state.ev)) throw new Error("KellyRiskPipeline requires state.ev.");

        const options = this.resolveOptions(state);
        const kelly = {};
        const fullKelly = {};
        const amount = {};
        const risk = {};
        const riskLevel = {};
        const riskLabel = {};

        for (const name of Object.keys(this.betConfig)) {
            const probability = state.probability[name];
            const ev = state.ev[name];
            if (!Number.isFinite(probability) || !Number.isFinite(ev)) continue;

            const rawKelly = this.normalizeKelly(this.calculateKelly(name, probability, ev, options));
            const scaledKelly = Math.max(0, rawKelly.fraction * options.fraction);
            const rawAmount = rawKelly.amount ?? options.bankroll * scaledKelly;
            const normalizedAmount = this.normalizeAmount(rawAmount, options);
            const rawRisk = this.normalizeRisk(
                this.calculateRisk(name, probability, ev, scaledKelly, normalizedAmount, options)
            );

            kelly[name] = scaledKelly;
            fullKelly[name] = Math.max(0, rawKelly.fullKelly);
            amount[name] = normalizedAmount;
            risk[name] = rawRisk.value;
            riskLevel[name] = rawRisk.level;
            riskLabel[name] = rawRisk.label;
        }

        return {
            kelly,
            fullKelly,
            amount,
            risk,
            riskLevel,
            riskLabel,
            bankroll: options.bankroll,
            bettingLimits: {
                minBet: options.minBet,
                maxBet: options.maxBet,
                roundTo: options.roundTo,
                maxBankrollRatio: options.maxBankrollRatio
            }
        };
    }

    toDefinition({ name = "kelly-risk", priority = 30 } = {}) {
        return {
            name,
            priority,
            requires: ["probability", "ev"],
            run: context => this.run(context),
            metadata: { version: KELLY_RISK_PIPELINE_VERSION, type: "kelly-risk" }
        };
    }

    get summary() {
        return {
            version: KELLY_RISK_PIPELINE_VERSION,
            bets: Object.keys(this.betConfig).length,
            defaults: { ...this.defaults }
        };
    }
}
