/**
 * Baccarat Analyzer V9.4
 * Path: integration/prediction/PatternPredictionGateway.js
 * Purpose: Adapts the existing pattern recognizer or predictor.
 */

export const PATTERN_PREDICTION_GATEWAY_VERSION = "9.4.0";

export default class PatternPredictionGateway {
    constructor({ predictor } = {}) {
        if (
            !predictor ||
            typeof predictor.predict !==
                "function"
        ) {
            throw new TypeError(
                "PatternPredictionGateway requires predictor.predict()."
            );
        }

        this.predictor =
            predictor;
    }

    async predict(input = {}) {
        return this.predictor
            .predict(
                input
            );
    }

    get summary() {
        return {
            version:
                PATTERN_PREDICTION_GATEWAY_VERSION
        };
    }
}
