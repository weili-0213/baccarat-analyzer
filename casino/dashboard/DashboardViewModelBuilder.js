/**
 * Baccarat Analyzer V6.6
 * casino/dashboard/DashboardViewModelBuilder.js
 */

export const DASHBOARD_VIEW_MODEL_VERSION = "6.6.0";

function safeObject(value) {
    return (
        value &&
        typeof value === "object"
            ? value
            : {}
    );
}

export default class DashboardViewModelBuilder {
    build({
        session = null,
        shoe = null,
        round = null,
        analysis = null,
        statistics = null,
        roadmap = null,
        recommendation = null,
        metadata = {}
    } = {}) {
        const analysisData =
            safeObject(analysis);

        const recommendationData =
            recommendation ??
            analysisData.recommendation ??
            null;

        return {
            version:
                DASHBOARD_VIEW_MODEL_VERSION,

            session: {
                id:
                    session?.sessionId ??
                    session?.id ??
                    null,

                state:
                    session?.state ??
                    null,

                roundCount:
                    session?.roundCount ??
                    0,

                duration:
                    session?.duration ??
                    0
            },

            shoe: {
                number:
                    shoe?.shoeNumber ??
                    null,

                roundNumber:
                    shoe?.roundNumber ??
                    null,

                remainingCards:
                    shoe?.remainingCards ??
                    shoe?.remaining ??
                    0,

                cutReached:
                    Boolean(
                        shoe?.cutReached
                    ),

                needsNewShoe:
                    Boolean(
                        shoe?.needsNewShoe
                    )
            },

            round: {
                id:
                    round?.roundId ??
                    null,

                number:
                    round?.roundNumber ??
                    null,

                winner:
                    round?.winner ??
                    round?.result?.winner ??
                    null,

                playerValue:
                    round?.playerValue ??
                    round?.result?.playerValue ??
                    null,

                bankerValue:
                    round?.bankerValue ??
                    round?.result?.bankerValue ??
                    null
            },

            analysis: {
                id:
                    analysisData.analysisId ??
                    null,

                mode:
                    analysisData.mode ??
                    null,

                probability:
                    analysisData.probability ??
                    null,

                ev:
                    analysisData.ev ??
                    null,

                kelly:
                    analysisData.kelly ??
                    null,

                risk:
                    analysisData.risk ??
                    null,

                confidence:
                    analysisData.confidence ??
                    null,

                ranking:
                    analysisData.ranking ??
                    null
            },

            recommendation:
                recommendationData,

            statistics:
                statistics ??
                session?.statistics ??
                shoe?.statistics ??
                null,

            roadmap:
                roadmap,

            metadata: {
                ...metadata
            }
        };
    }

    get summary() {
        return {
            version:
                DASHBOARD_VIEW_MODEL_VERSION
        };
    }
}
