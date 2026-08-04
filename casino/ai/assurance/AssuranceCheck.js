/**
 * Baccarat Analyzer V7.8
 * casino/ai/assurance/AssuranceCheck.js
 */

export const ASSURANCE_CHECK_VERSION = "7.8.0";

export default class AssuranceCheck {
    constructor({
        checkId,
        name,
        type,
        weight = 1,
        evaluate,
        enabled = true,
        metadata = {}
    } = {}) {
        if (
            typeof checkId !== "string" ||
            checkId.length === 0
        ) {
            throw new TypeError(
                "AssuranceCheck checkId is required."
            );
        }

        if (typeof evaluate !== "function") {
            throw new TypeError(
                "AssuranceCheck evaluate must be a function."
            );
        }

        this.version = ASSURANCE_CHECK_VERSION;
        this.checkId = checkId;
        this.name = name ?? checkId;
        this.type = type;
        this.weight = Number.isFinite(weight) ? weight : 1;
        this.evaluate = evaluate;
        this.enabled = Boolean(enabled);
        this.metadata = { ...metadata };
        this.executionCount = 0;
    }

    async run(context = {}) {
        if (!this.enabled) {
            return {
                checkId: this.checkId,
                name: this.name,
                type: this.type,
                skipped: true,
                passed: true,
                score: 100,
                issues: []
            };
        }

        this.executionCount++;

        const result =
            await this.evaluate(context);

        return {
            checkId: this.checkId,
            name: this.name,
            type: this.type,
            skipped: false,
            passed: result?.passed !== false,
            score: Number.isFinite(result?.score)
                ? Math.max(0, Math.min(100, result.score))
                : result?.passed === false
                    ? 0
                    : 100,
            issues: Array.isArray(result?.issues)
                ? [...result.issues]
                : [],
            details: result?.details ?? null,
            weight: this.weight
        };
    }
}
