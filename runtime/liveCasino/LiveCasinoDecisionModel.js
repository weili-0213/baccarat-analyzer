/**
 * Baccarat Analyzer V10.5.0
 * Path: runtime/liveCasino/LiveCasinoDecisionModel.js
 *
 * Compatibility facade. Existing callers keep using build(), while V10.5
 * delegates the actual decision to AILiveDecisionEngine.
 */

import AILiveDecisionEngine, {
    AI_LIVE_DECISION_ENGINE_VERSION
} from "./AILiveDecisionEngine.js";

/**
 * Retained for V10.4.5 compatibility tests and existing integrations.
 */
export const LIVE_CASINO_DECISION_MODEL_VERSION =
    "10.4.5";


export default class LiveCasinoDecisionModel {
    constructor({
        engine = null,
        thresholds = {}
    } = {}) {
        this.engine =
            engine ??
            new AILiveDecisionEngine(
                thresholds
            );
    }


    build(analysis = null) {
        return this.engine
            .decide(analysis);
    }


    get summary() {
        return {
            version:
                LIVE_CASINO_DECISION_MODEL_VERSION,
            engineVersion:
                AI_LIVE_DECISION_ENGINE_VERSION,
            engine:
                this.engine.summary
        };
    }
}

export {
    AI_LIVE_DECISION_ENGINE_VERSION
};

