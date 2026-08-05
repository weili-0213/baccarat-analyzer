/**
 * Baccarat Analyzer V9.1
 * ui/ai/AIUIRenderer.js
 */
export const AI_UI_RENDERER_VERSION = "9.1.0";

export default class AIUIRenderer {
    constructor({
        root = null,
        selectors = {}
    } = {}) {
        this.root =
            root ??
            (
                typeof document !==
                    "undefined"
                    ? document
                    : null
            );

        this.selectors = {
            status:
                "[data-ai-status]",
            recommendation:
                "[data-ai-recommendation]",
            confidence:
                "[data-ai-confidence]",
            safety:
                "[data-ai-safety]",
            decision:
                "[data-ai-decision]",
            error:
                "[data-ai-error]",
            ...selectors
        };
    }

    find(name) {
        if (
            !this.root ||
            typeof this.root.querySelector !==
                "function"
        ) {
            return null;
        }

        return this.root.querySelector(
            this.selectors[name]
        );
    }

    setText(name, value) {
        const element =
            this.find(name);

        if (element) {
            element.textContent =
                value ?? "—";
        }

        return element;
    }

    render(viewModel = {}) {
        this.setText(
            "status",
            viewModel.status
        );

        this.setText(
            "recommendation",
            viewModel.recommendation
        );

        this.setText(
            "confidence",
            Number.isFinite(
                viewModel.confidence
            )
                ? `${Math.round(
                    viewModel.confidence *
                    100
                )}%`
                : "—"
        );

        this.setText(
            "safety",
            viewModel.safetyLevel ??
            (
                viewModel.safe === true
                    ? "safe"
                    : viewModel.safe === false
                        ? "unsafe"
                        : "—"
            )
        );

        this.setText(
            "decision",
            viewModel.decision
        );

        this.setText(
            "error",
            viewModel.error
        );

        return viewModel;
    }

    clear() {
        for (
            const name of
            Object.keys(
                this.selectors
            )
        ) {
            this.setText(
                name,
                "—"
            );
        }

        return this;
    }

    get summary() {
        return {
            version:
                AI_UI_RENDERER_VERSION,
            hasRoot:
                Boolean(
                    this.root
                )
        };
    }
}
