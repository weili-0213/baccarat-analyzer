/**
 * Baccarat Analyzer V6.6
 * tests/dashboardEngine.test.js
 */

import DashboardEngine, {
    DASHBOARD_ENGINE_VERSION,
    DashboardEvent
} from "../casino/dashboard/DashboardEngine.js";

import {
    DASHBOARD_STATE_VERSION,
    DashboardState
} from "../casino/dashboard/DashboardState.js";

import DashboardHistory, {
    DASHBOARD_HISTORY_VERSION
} from "../casino/dashboard/DashboardHistory.js";

import DashboardViewModelBuilder, {
    DASHBOARD_VIEW_MODEL_VERSION
} from "../casino/dashboard/DashboardViewModelBuilder.js";

import DashboardEngineRuntimeAdapter, {
    DASHBOARD_ENGINE_RUNTIME_ADAPTER_VERSION
} from "../runtime/adapters/DashboardEngineRuntimeAdapter.js";

import {
    DASHBOARD_ENGINE_FACTORY_VERSION
} from "../casino/dashboard/createDashboardEngine.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createPanel() {
    return {
        mounted: 0,
        updates: [],
        cleared: 0,
        destroyed: 0,

        mount() {
            this.mounted++;
        },

        update(value) {
            this.updates.push(
                value
            );
        },

        clear() {
            this.cleared++;
        },

        destroy() {
            this.destroyed++;
        }
    };
}


export default async function dashboardEngineTest() {
    const messages = [];

    assert(
        DASHBOARD_ENGINE_VERSION ===
            "6.6.0" &&
        DASHBOARD_STATE_VERSION ===
            "6.6.0" &&
        DASHBOARD_HISTORY_VERSION ===
            "6.6.0" &&
        DASHBOARD_VIEW_MODEL_VERSION ===
            "6.6.0" &&
        DASHBOARD_ENGINE_RUNTIME_ADAPTER_VERSION ===
            "6.6.0" &&
        DASHBOARD_ENGINE_FACTORY_VERSION ===
            "6.6.0",
        "V6.6 Dashboard Engine 版本錯誤"
    );

    messages.push(
        "✓ V6.6 Dashboard Engine 版本正確"
    );

    let now = 100;

    const events = [];

    const renderer =
        createPanel();

    const statisticsPanel =
        createPanel();

    const roadmapPanel =
        createPanel();

    const recommendationPanel =
        createPanel();

    const livePanel =
        createPanel();

    const reportPanel =
        createPanel();

    const dashboard =
        new DashboardEngine({
            renderer,
            statisticsPanel,
            roadmapPanel,
            recommendationPanel,
            livePanel,
            reportPanel,

            builder:
                new DashboardViewModelBuilder(),

            history:
                new DashboardHistory({
                    limit:
                        10
                }),

            eventBus: {
                emit(type, payload) {
                    events.push({
                        type,
                        payload
                    });
                }
            },

            clock:
                () => now++
        });

    assert(
        dashboard.state ===
            DashboardState.IDLE,
        "Dashboard initial state 錯誤"
    );

    await dashboard.mount(
        "#dashboard"
    );

    assert(
        dashboard.state ===
            DashboardState.READY &&
        dashboard.summary.mounted ===
            true &&
        renderer.mounted === 1 &&
        statisticsPanel.mounted ===
            1 &&
        roadmapPanel.mounted === 1 &&
        recommendationPanel.mounted ===
            1 &&
        livePanel.mounted === 1 &&
        reportPanel.mounted === 1,
        "Dashboard mount 錯誤"
    );

    messages.push(
        "✓ Dashboard Mount 正確"
    );

    const analysis = {
        analysisId:
            "analysis-1",

        mode:
            "round",

        probability: {
            Player: 0.44,
            Banker: 0.46,
            Tie: 0.10
        },

        ev: {
            Player: -0.01,
            Banker: 0.005,
            Tie: 0.005
        },

        kelly: {
            Banker: 0.01
        },

        confidence: {
            overall: 0.82
        },

        ranking: [
            {
                bet:
                    "Banker"
            }
        ],

        recommendation: {
            action:
                "bet",

            bestBet:
                "Banker"
        }
    };

    const viewModel =
        await dashboard
            .updateFromAnalysis({
                analysis,

                session: {
                    sessionId:
                        "session-1",
                    state:
                        "active",
                    roundCount:
                        8,
                    duration:
                        120
                },

                shoe: {
                    shoeNumber:
                        2,
                    roundNumber:
                        8,
                    remainingCards:
                        356,
                    cutReached:
                        false,
                    needsNewShoe:
                        false
                },

                round: {
                    roundId:
                        "shoe-2-round-8",
                    roundNumber:
                        8,
                    winner:
                        "Banker",
                    playerValue:
                        4,
                    bankerValue:
                        7
                },

                statistics: {
                    roundCount:
                        8,
                    profit:
                        95
                },

                roadmap: {
                    bigRoad: [
                        "B",
                        "P"
                    ]
                }
            });

    assert(
        viewModel.session.id ===
            "session-1" &&
        viewModel.shoe
            .remainingCards === 356 &&
        viewModel.round.winner ===
            "Banker" &&
        viewModel.analysis.ev
            .Banker === 0.005 &&
        viewModel.recommendation
            .bestBet === "Banker" &&
        viewModel.statistics
            .roundCount === 8 &&
        viewModel.roadmap.bigRoad
            .length === 2,
        "Dashboard ViewModel 錯誤"
    );

    messages.push(
        "✓ Dashboard ViewModel 與 Update 正確"
    );

    assert(
        renderer.updates.length ===
            1 &&
        statisticsPanel.updates
            .length === 1 &&
        roadmapPanel.updates
            .length === 1 &&
        recommendationPanel.updates
            .length === 1 &&
        livePanel.updates.length ===
            1 &&
        reportPanel.updates.length ===
            1,
        "Dashboard Panels Update 錯誤"
    );

    messages.push(
        "✓ Statistics、Roadmap、Recommendation、Live、Report 更新正確"
    );

    dashboard.pause();

    const pausedResult =
        await dashboard.update({
            statistics: {
                roundCount:
                    99
            }
        });

    assert(
        dashboard.state ===
            DashboardState.PAUSED &&
        dashboard.summary.paused ===
            true &&
        pausedResult ===
            viewModel &&
        dashboard.summary
            .updateCount === 1,
        "Dashboard pause 錯誤"
    );

    dashboard.resume();

    await dashboard.update({
        statistics: {
            roundCount:
                9
        }
    });

    assert(
        dashboard.state ===
            DashboardState.READY &&
        dashboard.summary.paused ===
            false &&
        dashboard.summary
            .updateCount === 2 &&
        dashboard.summary.history
            .count === 2,
        "Dashboard resume 或 History 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 與 History 正確"
    );

    const adapter =
        new DashboardEngineRuntimeAdapter({
            dashboard
        });

    await adapter.update({
        statistics: {
            roundCount:
                10
        }
    });

    assert(
        adapter.summary.dashboard
            .updateCount === 3 &&
        adapter.summary.dashboard
            .hasViewModel === true,
        "Dashboard Runtime Adapter 錯誤"
    );

    messages.push(
        "✓ Runtime Adapter 正確"
    );

    assert(
        events.some(
            event =>
                event.type ===
                DashboardEvent.MOUNTED
        ) &&
        events.some(
            event =>
                event.type ===
                DashboardEvent.STATISTICS_UPDATED
        ) &&
        events.some(
            event =>
                event.type ===
                DashboardEvent.ROADMAP_UPDATED
        ) &&
        events.some(
            event =>
                event.type ===
                DashboardEvent.RECOMMENDATION_UPDATED
        ) &&
        events.some(
            event =>
                event.type ===
                DashboardEvent.UPDATED
        ),
        "Dashboard Events 錯誤"
    );

    messages.push(
        "✓ Dashboard Events 正確"
    );

    assert(
        dashboard.summary.version ===
            "6.6.0" &&
        dashboard.summary.lastError ===
            null,
        "Dashboard summary 錯誤"
    );

    await dashboard.destroy();

    assert(
        dashboard.state ===
            DashboardState.DESTROYED &&
        dashboard.summary.destroyed ===
            true &&
        dashboard.summary.mounted ===
            false &&
        dashboard.summary.history
            .count === 0 &&
        renderer.destroyed === 1 &&
        statisticsPanel.destroyed ===
            1 &&
        roadmapPanel.destroyed ===
            1 &&
        recommendationPanel.destroyed ===
            1 &&
        livePanel.destroyed === 1 &&
        reportPanel.destroyed ===
            1,
        "Dashboard destroy 錯誤"
    );

    messages.push(
        "✓ Summary 與 Destroy 正確"
    );

    return `
${messages.join("\n")}

Dashboard Engine V6.6 測試完成

Mount：通過
ViewModel：通過
Dashboard Update：通過
Statistics Refresh：通過
Roadmap Refresh：通過
Recommendation Refresh：通過
Live Refresh：通過
Report Refresh：通過
Pause／Resume：通過
History：通過
Runtime Adapter：通過
Events：通過
Lifecycle：通過
`;
}
