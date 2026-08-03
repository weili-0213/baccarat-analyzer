/**
 * Baccarat Analyzer V4.6
 * tests/liveDashboard.test.js
 */

import LiveDashboardController, {
    LIVE_DASHBOARD_VERSION,
    LiveDashboardStatus
} from "../dashboard/LiveDashboardController.js";

import LiveStatusPanel, {
    LIVE_STATUS_PANEL_VERSION
} from "../components/LiveStatusPanel.js";

import SessionStore
    from "../analysis/SessionStore.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createScheduler() {
    let nextId = 1;
    const tasks = new Map();

    return {
        setTimeout(callback) {
            const id = nextId++;
            tasks.set(id, callback);
            return id;
        },

        clearTimeout(id) {
            tasks.delete(id);
        },

        flush() {
            const entries =
                [...tasks.entries()];

            tasks.clear();

            for (const [, callback] of entries) {
                callback();
            }
        },

        get size() {
            return tasks.size;
        }
    };
}


export default function liveDashboardTest() {
    const messages = [];

    assert(
        LIVE_DASHBOARD_VERSION === "4.6.0" &&
        LIVE_STATUS_PANEL_VERSION === "4.6.0",
        "V4.6 版本錯誤"
    );

    messages.push(
        "✓ V4.6 版本正確"
    );

    const scheduler =
        createScheduler();

    let clockValue = 1000;

    const store =
        new SessionStore({
            autoSave: false,
            clock:
                () =>
                    new Date(
                        clockValue++
                    ).toISOString(),
            idFactory:
                () =>
                    "live-session"
        });

    store.start();

    const refreshes = [];

    const controller =
        new LiveDashboardController({
            sessionStore:
                store,

            refreshInterval:
                250,

            immediate:
                false,

            scheduler,

            clock:
                () =>
                    clockValue++,

            onRefresh:
                (session, metadata) => {
                    refreshes.push({
                        rounds:
                            session.rounds.length,
                        reasons:
                            metadata.reasons
                    });

                    return session.rounds.length;
                }
        });

    controller.start();

    assert(
        controller.status ===
            LiveDashboardStatus.RUNNING &&
        controller.isRunning ===
            true,
        "start() 錯誤"
    );

    messages.push(
        "✓ start() 正確"
    );

    store.addRound({
        winner: "Player"
    });

    store.addAnalysis({
        shouldBet: false
    });

    store.addBet({
        bet: "player",
        amount: 100,
        profit: 100
    });

    assert(
        scheduler.size === 1 &&
        refreshes.length === 0 &&
        controller.summary
            .coalescedCount === 2,
        "Refresh coalescing 錯誤"
    );

    scheduler.flush();

    assert(
        refreshes.length === 1 &&
        refreshes[0].rounds === 1 &&
        refreshes[0].reasons.includes(
            "round:add"
        ) &&
        refreshes[0].reasons.includes(
            "analysis:add"
        ) &&
        refreshes[0].reasons.includes(
            "bet:add"
        ),
        "Coalesced refresh 輸出錯誤"
    );

    messages.push(
        "✓ Store Events 與 Coalescing 正確"
    );

    controller.pause();

    store.addRound({
        winner: "Banker"
    });

    assert(
        controller.isPaused === true &&
        refreshes.length === 1 &&
        scheduler.size === 0 &&
        controller.summary.pending === true,
        "pause() 錯誤"
    );

    controller.resume();

    assert(
        scheduler.size === 1 &&
        controller.isRunning === true,
        "resume() 錯誤"
    );

    scheduler.flush();

    assert(
        refreshes.length === 2 &&
        refreshes[1].rounds === 2,
        "Resume refresh 錯誤"
    );

    messages.push(
        "✓ Pause／Resume 正確"
    );

    controller.setRefreshInterval(0);

    store.addRound({
        winner: "Tie"
    });

    assert(
        refreshes.length === 3 &&
        refreshes[2].rounds === 3,
        "Immediate refresh 錯誤"
    );

    messages.push(
        "✓ Refresh Interval 正確"
    );

    const manual =
        controller.refreshNow();

    assert(
        manual === 3 &&
        refreshes.length === 4,
        "refreshNow() 錯誤"
    );

    messages.push(
        "✓ Manual Refresh 正確"
    );

    const panel =
        new LiveStatusPanel();

    const html =
        panel.template(
            controller.summary
        );

    assert(
        html.includes(
            "即時更新中"
        ) &&
        html.includes(
            "立即刷新"
        ) &&
        html.includes(
            "暫停"
        ),
        "Live Status DOM 錯誤"
    );

    messages.push(
        "✓ Live Status DOM 正確"
    );

    assert(
        controller.summary.version === "4.6.0" &&
        controller.summary.refreshCount === 4 &&
        controller.summary.eventCount >= 4 &&
        controller.summary.lastError === null,
        "Live summary 錯誤"
    );

    controller.destroy();

    assert(
        controller.status ===
            LiveDashboardStatus.DESTROYED &&
        controller.summary.pending === false,
        "destroy() 錯誤"
    );

    messages.push(
        "✓ summary 與 destroy() 正確"
    );

    return `
${messages.join("\n")}

Dashboard Live Mode V4.6 測試完成

Lifecycle：通過
Store Events：通過
Refresh Coalescing：通過
Pause／Resume：通過
Refresh Interval：通過
Manual Refresh：通過
Live Status：通過
`;
}
