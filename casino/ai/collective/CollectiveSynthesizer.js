/**
 * Baccarat Analyzer V8.3
 * casino/ai/collective/CollectiveSynthesizer.js
 */

export const COLLECTIVE_SYNTHESIZER_VERSION = "8.3.0";

export default class CollectiveSynthesizer {
    synthesize({
        task,
        contributions,
        deliberation,
        mediation
    } = {}) {
        const selected =
            mediation?.recommended ??
            deliberation?.leading ??
            null;

        return {
            task,
            decision:
                selected?.opinion ??
                null,
            score:
                selected?.score ??
                0,
            supporters:
                selected?.supporters ??
                [],
            evidence:
                selected?.evidence ??
                [],
            conflict:
                mediation?.conflict ??
                false,
            margin:
                mediation?.margin ??
                0,
            contributionCount:
                contributions?.length ??
                0
        };
    }

    get summary() {
        return {
            version:
                COLLECTIVE_SYNTHESIZER_VERSION
        };
    }
}
