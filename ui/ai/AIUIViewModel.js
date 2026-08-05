/**
 * Baccarat Analyzer V9.1
 * ui/ai/AIUIViewModel.js
 */
export const AI_UI_VIEW_MODEL_VERSION = "9.1.0";

export default class AIUIViewModel {
    build({
        result = null,
        status = null,
        globalState = null,
        error = null
    } = {}) {
        const outputs =
            result?.pipeline?.outputs ??
            globalState?.state?.lastOutputs ??
            {};

        const decision =
            outputs.decision ??
            null;

        const safety =
            outputs.safety ??
            null;

        const recommendation =
            decision?.bestBet ??
            decision?.recommendation ??
            null;

        const confidence =
            Number.isFinite(
                decision?.confidence
            )
                ? decision.confidence
                : null;

        return {
            status:
                status?.state ??
                "idle",
            systemOnline:
                status?.booted ===
                true,
            recommendation,
            confidence,
            safetyLevel:
                safety?.level ??
                null,
            safe:
                safety?.safe ??
                null,
            decision:
                result?.decision ??
                globalState?.state?.decision ??
                null,
            timeline:
                result?.pipeline?.timeline ??
                globalState?.state?.lastTimeline ??
                [],
            outputs,
            error:
                error?.message ??
                error ??
                null
        };
    }

    get summary() {
        return {
            version:
                AI_UI_VIEW_MODEL_VERSION
        };
    }
}
