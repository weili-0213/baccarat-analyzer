/**
 * Baccarat Analyzer V6.9
 * casino/strategy/StrategyPreset.js
 */

export const STRATEGY_PRESET_VERSION = "6.9.0";

export const StrategyPreset = Object.freeze({
    CONSERVATIVE: Object.freeze({
        name: "conservative",
        minimumEV: 0.01,
        minimumConfidence: 0.75,
        maximumKelly: 0.02,
        maximumRisk:
            "low",
        bankrollFractionCap: 0.01
    }),

    BALANCED: Object.freeze({
        name: "balanced",
        minimumEV: 0.005,
        minimumConfidence: 0.65,
        maximumKelly: 0.05,
        maximumRisk:
            "medium",
        bankrollFractionCap: 0.025
    }),

    AGGRESSIVE: Object.freeze({
        name: "aggressive",
        minimumEV: 0,
        minimumConfidence: 0.55,
        maximumKelly: 0.1,
        maximumRisk:
            "high",
        bankrollFractionCap: 0.05
    })
});

export function resolveStrategyPreset(
    preset = "balanced"
) {
    if (
        typeof preset === "object" &&
        preset !== null
    ) {
        return {
            ...StrategyPreset.BALANCED,
            ...preset
        };
    }

    const match =
        Object.values(
            StrategyPreset
        ).find(
            item =>
                item.name === preset
        );

    if (!match) {
        throw new Error(
            `Unknown strategy preset: ${preset}`
        );
    }

    return {
        ...match
    };
}
