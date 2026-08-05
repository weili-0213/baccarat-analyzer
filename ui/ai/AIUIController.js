/**
 * Baccarat Analyzer V9.1
 * ui/ai/AIUIController.js
 */
import {
    AIUIState
} from "./AIUIState.js";

import AIUIContext
    from "./AIUIContext.js";

import AIUIViewModel
    from "./AIUIViewModel.js";

import AIUIStore
    from "./AIUIStore.js";

import AIUIRenderer
    from "./AIUIRenderer.js";

import AIUIEventBinder
    from "./AIUIEventBinder.js";


export const AI_UI_CONTROLLER_VERSION = "9.1.0";

export const AIUIEvent = Object.freeze({
    STATE_CHANGE: "ai-ui:state-change",
    CONNECTED: "ai-ui:connected",
    ANALYSIS_STARTED: "ai-ui:analysis-started",
    ANALYSIS_COMPLETED: "ai-ui:analysis-completed",
    RENDERED: "ai-ui:rendered",
    PAUSED: "ai-ui:paused",
    RESUMED: "ai-ui:resumed",
    ERROR: "ai-ui:error",
    DESTROYED: "ai-ui:destroyed"
});


function isFunction(value) {
    return typeof value ===
        "function";
}


export default class AIUIController {
    constructor({
        uiBridge,
        viewModel = null,
        store = null,
        renderer = null,
        binder = null,
        eventBus = null
    } = {}) {
        if (
            !uiBridge ||
            typeof uiBridge.analyze !==
                "function"
        ) {
            throw new TypeError(
                "AIUIController requires a UIBridge-compatible object."
            );
        }

        if (
            eventBus !== null &&
            !isFunction(eventBus.emit)
        ) {
            throw new TypeError(
                "eventBus requires emit()."
            );
        }

        this.uiBridge =
            uiBridge;

        this.viewModel =
            viewModel ??
            new AIUIViewModel();

        this.store =
            store ??
            new AIUIStore();

        this.renderer =
            renderer ??
            new AIUIRenderer();

        this.binder =
            binder ??
            new AIUIEventBinder();

        this.eventBus =
            eventBus;

        this.state =
            AIUIState.IDLE;

        this.previousState = null;
        this.paused = false;
        this.destroyed = false;
        this.analysisCount = 0;
        this.lastResult = null;
        this.lastError = null;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "ai-ui-controller"
                }
            ) ??
            null;
    }

    setState(state) {
        const previous =
            this.state;

        this.previousState =
            previous;

        this.state =
            state;

        this.store.setState({
            state
        });

        this.emit(
            AIUIEvent.STATE_CHANGE,
            {
                previous,
                current:
                    state
            }
        );

        return this;
    }

    assertNotDestroyed() {
        if (this.destroyed) {
            throw new Error(
                "AIUIController has been destroyed."
            );
        }
    }

    connect() {
        this.assertNotDestroyed();

        this.setState(
            AIUIState.CONNECTING
        );

        const status =
            this.uiBridge.getStatus();

        const globalState =
            this.uiBridge.getGlobalState();

        const model =
            this.viewModel.build({
                status,
                globalState
            });

        this.store.setState({
            status,
            globalState,
            viewModel:
                model
        });

        this.renderer.render(
            model
        );

        this.setState(
            AIUIState.READY
        );

        this.emit(
            AIUIEvent.CONNECTED,
            {
                status,
                globalState,
                viewModel:
                    model
            }
        );

        return model;
    }

    async analyze({
        context = {},
        steps = []
    } = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return null;
        }

        const uiContext =
            context instanceof
                AIUIContext
                ? context
                : new AIUIContext(
                    context
                );

        this.setState(
            AIUIState.ANALYZING
        );

        this.emit(
            AIUIEvent.ANALYSIS_STARTED,
            {
                context:
                    uiContext,
                steps
            }
        );

        try {
            const result =
                await this.uiBridge
                    .analyze({
                        context:
                            uiContext,
                        steps
                    });

            const status =
                this.uiBridge
                    .getStatus();

            const globalState =
                this.uiBridge
                    .getGlobalState();

            const model =
                this.viewModel
                    .build({
                        result,
                        status,
                        globalState
                    });

            this.lastResult =
                result;

            this.analysisCount++;

            this.store.setState({
                result,
                status,
                globalState,
                viewModel:
                    model,
                error:
                    null
            });

            this.emit(
                AIUIEvent.ANALYSIS_COMPLETED,
                result
            );

            this.setState(
                AIUIState.RENDERING
            );

            this.renderer.render(
                model
            );

            this.emit(
                AIUIEvent.RENDERED,
                model
            );

            this.setState(
                AIUIState.READY
            );

            return result;
        }
        catch (error) {
            return this.handleError(
                error,
                "analyze"
            );
        }
    }

    bindDefaultActions({
        analyzeSelector =
            "[data-ai-analyze]",
        pauseSelector =
            "[data-ai-pause]",
        resumeSelector =
            "[data-ai-resume]",
        getInput =
            () => ({})
    } = {}) {
        this.binder.bind({
            selector:
                analyzeSelector,
            handler:
                () =>
                    this.analyze(
                        getInput()
                    )
        });

        this.binder.bind({
            selector:
                pauseSelector,
            handler:
                () =>
                    this.pause()
        });

        this.binder.bind({
            selector:
                resumeSelector,
            handler:
                () =>
                    this.resume()
        });

        return this.binder.summary;
    }

    pause() {
        this.assertNotDestroyed();

        this.paused = true;
        this.uiBridge.pause();

        this.setState(
            AIUIState.PAUSED
        );

        this.emit(
            AIUIEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused = false;
        this.uiBridge.resume();

        this.setState(
            AIUIState.READY
        );

        this.emit(
            AIUIEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    reset() {
        this.assertNotDestroyed();

        this.uiBridge.reset();

        this.analysisCount = 0;
        this.lastResult = null;
        this.lastError = null;
        this.paused = false;

        this.store.reset();
        this.renderer.clear();

        this.setState(
            AIUIState.IDLE
        );

        return this;
    }

    handleError(
        error,
        phase
    ) {
        this.lastError =
            error;

        const status =
            this.uiBridge
                .getStatus();

        const globalState =
            this.uiBridge
                .getGlobalState();

        const model =
            this.viewModel
                .build({
                    status,
                    globalState,
                    error
                });

        this.store.setState({
            error,
            viewModel:
                model
        });

        this.renderer.render(
            model
        );

        this.setState(
            AIUIState.ERROR
        );

        this.emit(
            AIUIEvent.ERROR,
            {
                phase,
                message:
                    error?.message ??
                    String(error)
            }
        );

        throw error;
    }

    destroy() {
        if (this.destroyed) {
            return this;
        }

        this.binder.unbindAll();
        this.store.destroy();
        this.renderer.clear();

        this.lastResult = null;
        this.lastError = null;
        this.destroyed = true;

        this.setState(
            AIUIState.DESTROYED
        );

        this.emit(
            AIUIEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                AI_UI_CONTROLLER_VERSION,
            state:
                this.state,
            previousState:
                this.previousState,
            paused:
                this.paused,
            destroyed:
                this.destroyed,
            analysisCount:
                this.analysisCount,
            hasResult:
                Boolean(
                    this.lastResult
                ),
            lastError:
                this.lastError
                    ?.message ??
                null,
            viewModel:
                this.viewModel.summary,
            store:
                this.store.summary,
            renderer:
                this.renderer.summary,
            binder:
                this.binder.summary
        };
    }
}
