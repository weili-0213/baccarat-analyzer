/**
 * Baccarat Analyzer V9.1
 * tests/aiUIIntegration.test.js
 */
import {
    AI_UI_STATE_VERSION,
    AIUIState,
    AIUIStatus
} from "../ui/ai/AIUIState.js";

import AIUIContext, {
    AI_UI_CONTEXT_VERSION
} from "../ui/ai/AIUIContext.js";

import AIUIViewModel, {
    AI_UI_VIEW_MODEL_VERSION
} from "../ui/ai/AIUIViewModel.js";

import AIUIStore, {
    AI_UI_STORE_VERSION
} from "../ui/ai/AIUIStore.js";

import AIUIRenderer, {
    AI_UI_RENDERER_VERSION
} from "../ui/ai/AIUIRenderer.js";

import AIUIEventBinder, {
    AI_UI_EVENT_BINDER_VERSION
} from "../ui/ai/AIUIEventBinder.js";

import AIUIController, {
    AI_UI_CONTROLLER_VERSION,
    AIUIEvent
} from "../ui/ai/AIUIController.js";

import AIUIRuntimeAdapter, {
    AI_UI_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/AIUIRuntimeAdapter.js";

import {
    AI_UI_INTEGRATION_FACTORY_VERSION
} from "../ui/ai/createAIUIIntegration.js";


function assert(
    condition,
    message
) {
    if (!condition) {
        throw new Error(
            message
        );
    }
}


function createFakeRoot() {
    const elements =
        new Map();

    const ensure =
        selector => {
            if (
                !elements.has(
                    selector
                )
            ) {
                elements.set(
                    selector,
                    {
                        textContent:
                            "",
                        listeners:
                            new Map(),
                        addEventListener(
                            type,
                            handler
                        ) {
                            this.listeners.set(
                                type,
                                handler
                            );
                        },
                        removeEventListener(
                            type
                        ) {
                            this.listeners.delete(
                                type
                            );
                        }
                    }
                );
            }

            return elements.get(
                selector
            );
        };

    return {
        elements,
        querySelector(
            selector
        ) {
            return ensure(
                selector
            );
        }
    };
}


export default async function aiUIIntegrationTest() {
    const messages = [];

    assert(
        [
            AI_UI_STATE_VERSION,
            AI_UI_CONTEXT_VERSION,
            AI_UI_VIEW_MODEL_VERSION,
            AI_UI_STORE_VERSION,
            AI_UI_RENDERER_VERSION,
            AI_UI_EVENT_BINDER_VERSION,
            AI_UI_CONTROLLER_VERSION,
            AI_UI_RUNTIME_ADAPTER_VERSION,
            AI_UI_INTEGRATION_FACTORY_VERSION
        ].every(
            version =>
                version ===
                "9.1.0"
        ),
        "V9.1 AI UI Integration 版本錯誤"
    );

    assert(
        AIUIStatus.ONLINE ===
            "online",
        "AI UI Status 錯誤"
    );

    messages.push(
        "✓ V9.1 AI UI Integration 版本正確"
    );

    const context =
        new AIUIContext({
            round: {
                roundId:
                    "r1"
            },
            bankroll: {
                balance:
                    1000
            }
        });

    assert(
        context.round.roundId ===
            "r1" &&
        context.bankroll.balance ===
            1000,
        "AI UI Context 錯誤"
    );

    messages.push(
        "✓ AI UI Context 正確"
    );

    const viewModel =
        new AIUIViewModel();

    const model =
        viewModel.build({
            result: {
                decision:
                    "proceed",
                pipeline: {
                    outputs: {
                        decision: {
                            bestBet:
                                "Banker",
                            confidence:
                                0.82
                        },
                        safety: {
                            safe:
                                true,
                            level:
                                "safe"
                        }
                    },
                    timeline: [
                        {
                            engineId:
                                "decision"
                        }
                    ]
                }
            },
            status: {
                state:
                    "ready",
                booted:
                    true
            }
        });

    assert(
        model.recommendation ===
            "Banker" &&
        model.confidence ===
            0.82 &&
        model.safe ===
            true,
        "AI UI ViewModel 錯誤"
    );

    messages.push(
        "✓ AI UI ViewModel 正確"
    );

    const store =
        new AIUIStore();

    let observed = null;

    const unsubscribe =
        store.subscribe(
            state => {
                observed =
                    state;
            }
        );

    store.setState({
        ready:
            true
    });

    assert(
        observed.ready ===
            true &&
        store.summary.revision ===
            1,
        "AI UI Store 錯誤"
    );

    unsubscribe();

    messages.push(
        "✓ AI UI Store 正確"
    );

    const root =
        createFakeRoot();

    const renderer =
        new AIUIRenderer({
            root
        });

    renderer.render(
        model
    );

    assert(
        root.elements
            .get(
                "[data-ai-recommendation]"
            )
            .textContent ===
            "Banker" &&
        root.elements
            .get(
                "[data-ai-confidence]"
            )
            .textContent ===
            "82%",
        "AI UI Renderer 錯誤"
    );

    messages.push(
        "✓ AI UI Renderer 正確"
    );

    const binder =
        new AIUIEventBinder({
            root
        });

    let clicked = false;

    binder.bind({
        selector:
            "[data-ai-analyze]",
        handler:
            () => {
                clicked =
                    true;
            }
    });

    root.elements
        .get(
            "[data-ai-analyze]"
        )
        .listeners
        .get(
            "click"
        )();

    assert(
        clicked === true &&
        binder.summary
            .bindingCount === 1,
        "AI UI Event Binder 錯誤"
    );

    messages.push(
        "✓ AI UI Event Binder 正確"
    );

    let paused = false;
    const events = [];

    const uiBridge = {
        async analyze() {
            return {
                decision:
                    "proceed",
                pipeline: {
                    outputs: {
                        decision: {
                            bestBet:
                                "Banker",
                            confidence:
                                0.9
                        },
                        safety: {
                            safe:
                                true,
                            level:
                                "safe"
                        }
                    },
                    timeline: [
                        {
                            engineId:
                                "decision",
                            success:
                                true
                        },
                        {
                            engineId:
                                "safety",
                            success:
                                true
                        }
                    ]
                }
            };
        },
        getStatus() {
            return {
                state:
                    paused
                        ? "paused"
                        : "ready",
                booted:
                    true
            };
        },
        getGlobalState() {
            return {
                revision:
                    1,
                state: {
                    decision:
                        "proceed"
                }
            };
        },
        pause() {
            paused =
                true;
        },
        resume() {
            paused =
                false;
        },
        reset() {
            paused =
                false;
        }
    };

    const controller =
        new AIUIController({
            uiBridge,
            viewModel,
            store:
                new AIUIStore(),
            renderer:
                new AIUIRenderer({
                    root
                }),
            binder:
                new AIUIEventBinder({
                    root
                }),
            eventBus: {
                emit(type, payload) {
                    events.push({
                        type,
                        payload
                    });
                }
            }
        });

    const connected =
        controller.connect();

    assert(
        connected.systemOnline ===
            true &&
        controller.state ===
            AIUIState.READY,
        "AI UI Connect 錯誤"
    );

    messages.push(
        "✓ AI UI Connect 正確"
    );

    const result =
        await controller.analyze({
            context,
            steps: [
                {
                    engineId:
                        "decision",
                    method:
                        "analyze"
                }
            ]
        });

    assert(
        result.decision ===
            "proceed" &&
        controller.summary
            .analysisCount === 1 &&
        controller.state ===
            AIUIState.READY &&
        root.elements
            .get(
                "[data-ai-recommendation]"
            )
            .textContent ===
            "Banker",
        "AI UI Analyze 錯誤"
    );

    messages.push(
        "✓ Connect → Analyze → Render 正確"
    );

    controller.pause();

    const pausedResult =
        await controller.analyze({
            context
        });

    assert(
        controller.state ===
            AIUIState.PAUSED &&
        pausedResult ===
            null,
        "AI UI Pause 錯誤"
    );

    controller.resume();

    assert(
        controller.state ===
            AIUIState.READY &&
        controller.summary
            .paused === false,
        "AI UI Resume 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    const adapter =
        new AIUIRuntimeAdapter({
            controller
        });

    const adapterResult =
        await adapter.analyze({
            context
        });

    assert(
        adapterResult !==
            null &&
        adapter.summary
            .controller
            .analysisCount ===
            2,
        "AI UI Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        [
            AIUIEvent.CONNECTED,
            AIUIEvent.ANALYSIS_STARTED,
            AIUIEvent.ANALYSIS_COMPLETED,
            AIUIEvent.RENDERED,
            AIUIEvent.PAUSED,
            AIUIEvent.RESUMED
        ].every(
            type =>
                events.some(
                    event =>
                        event.type ===
                        type
                )
        ),
        "AI UI Events 錯誤"
    );

    messages.push(
        "✓ AI UI Events 正確"
    );

    controller.reset();

    assert(
        controller.state ===
            AIUIState.IDLE &&
        controller.summary
            .analysisCount === 0,
        "AI UI Reset 錯誤"
    );

    controller.destroy();

    assert(
        controller.state ===
            AIUIState.DESTROYED &&
        controller.summary
            .destroyed === true,
        "AI UI Destroy 錯誤"
    );

    messages.push(
        "✓ Summary、Reset 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

AI UI Integration V9.1 測試完成

AI UI State：通過
AI UI Context：通過
AI UI ViewModel：通過
AI UI Store：通過
AI UI Renderer：通過
AI UI Event Binder：通過
AI UI Controller：通過
Connect / Analyze / Render：通過
Pause／Resume：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
