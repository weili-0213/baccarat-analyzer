/**
 * Baccarat Analyzer V4.1
 * tests/sessionStore.test.js
 */

import SessionStore, {
    SESSION_STORE_VERSION,
    SessionStatus
} from "../analysis/SessionStore.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


export default function sessionStoreTest() {
    const messages = [];

    assert(
        SESSION_STORE_VERSION ===
            "4.1.0",
        "SessionStore 版本錯誤"
    );

    const storage =
        SessionStore.memoryAdapter();

    let tick = 0;

    const clock = () =>
        `2026-08-03T00:00:${String(
            tick++
        ).padStart(2, "0")}.000Z`;

    const store =
        new SessionStore({
            storage,
            storageKey:
                "session-store-test",
            autoSave:
                true,
            clock,
            idFactory:
                () => "session-test-1"
        });

    assert(
        store.summary.status ===
            SessionStatus.IDLE &&
        store.roundCount === 0,
        "初始狀態錯誤"
    );

    messages.push(
        "✓ V4.1 建立與初始狀態正確"
    );

    const events = [];

    const unsubscribe =
        store.subscribe(
            event => {
                events.push(
                    event.type
                );
            }
        );

    const started =
        store.start({
            shoeNumber:
                7,
            metadata: {
                casino:
                    "test"
            }
        });

    assert(
        started.id ===
            "session-test-1" &&
        started.status ===
            SessionStatus.ACTIVE &&
        store.isActive ===
            true,
        "start() 錯誤"
    );

    messages.push(
        "✓ start() 正確"
    );

    const round =
        store.addRound({
            winner:
                "Player",
            playerScore:
                8,
            bankerScore:
                4
        });

    const analysis =
        store.addAnalysis({
            method:
                "provided",
            shouldBet:
                true,
            recommendedBet:
                "player"
        });

    const bet =
        store.addBet({
            bet:
                "player",
            amount:
                100,
            profit:
                100
        });

    assert(
        round.sessionIndex === 0 &&
        analysis.generatedAfterRound === 1 &&
        bet.round === 1,
        "Record 自動欄位錯誤"
    );

    assert(
        store.roundCount === 1 &&
        store.analysisCount === 1 &&
        store.betCount === 1,
        "Record 計數錯誤"
    );

    messages.push(
        "✓ Round、Analysis、Bet 收集正確"
    );

    store.updateMetadata({
        table:
            "A1"
    });

    assert(
        store.snapshot
            .metadata
            .casino ===
            "test" &&
        store.snapshot
            .metadata
            .table ===
            "A1",
        "metadata 合併錯誤"
    );

    messages.push(
        "✓ Metadata 更新正確"
    );

    const exported =
        store.export();

    exported.rounds[0].winner =
        "Banker";

    assert(
        store.snapshot
            .rounds[0]
            .winner ===
            "Player",
        "export() 必須回傳深拷貝"
    );

    messages.push(
        "✓ Snapshot 與 Export 深拷貝正確"
    );

    const removedBet =
        store.removeLastBet();

    assert(
        removedBet.bet ===
            "player" &&
        store.betCount === 0,
        "removeLastBet() 錯誤"
    );

    store.addBet({
        bet:
            "player",
        amount:
            100,
        profit:
            100
    });

    messages.push(
        "✓ Remove last record 正確"
    );

    const ended =
        store.end({
            metadata: {
                completed:
                    true
            }
        });

    assert(
        ended.status ===
            SessionStatus.ENDED &&
        ended.endedAt !==
            null &&
        ended.metadata.completed ===
            true,
        "end() 錯誤"
    );

    assert(
        store.summary.rounds === 1 &&
        store.summary.analyses === 1 &&
        store.summary.bets === 1,
        "summary 計數錯誤"
    );

    messages.push(
        "✓ end() 與 summary 正確"
    );

    const restored =
        new SessionStore({
            storage,
            storageKey:
                "session-store-test",
            autoSave:
                false,
            clock
        });

    const loaded =
        restored.load();

    assert(
        loaded.id ===
            "session-test-1" &&
        loaded.status ===
            SessionStatus.ENDED &&
        loaded.rounds.length === 1 &&
        loaded.analyses.length === 1 &&
        loaded.bets.length === 1,
        "load() 錯誤"
    );

    messages.push(
        "✓ Save／Load 正確"
    );

    restored.reset();

    assert(
        restored.summary.status ===
            SessionStatus.IDLE &&
        restored.roundCount === 0 &&
        restored.analysisCount === 0 &&
        restored.betCount === 0,
        "reset() 錯誤"
    );

    messages.push(
        "✓ reset() 正確"
    );

    restored.start({
        id:
            "session-import-source"
    });

    restored.addRound({
        winner:
            "Tie"
    });

    const imported =
        new SessionStore({
            autoSave:
                false,
            clock
        });

    imported.import(
        restored.export(),
        {
            save:
                false
        }
    );

    assert(
        imported.snapshot.id ===
            "session-import-source" &&
        imported.roundCount === 1 &&
        imported.snapshot
            .rounds[0]
            .winner ===
            "Tie",
        "import() 錯誤"
    );

    messages.push(
        "✓ Import 正確"
    );

    imported.clearRecords({
        rounds:
            true,
        analyses:
            false,
        bets:
            false
    });

    assert(
        imported.roundCount === 0,
        "clearRecords() 錯誤"
    );

    messages.push(
        "✓ clearRecords() 正確"
    );

    unsubscribe();

    assert(
        events.includes("start") &&
        events.includes("round:add") &&
        events.includes("analysis:add") &&
        events.includes("bet:add") &&
        events.includes("end"),
        "事件通知不完整"
    );

    messages.push(
        "✓ Subscribe／Events 正確"
    );

    return `
${messages.join("\n")}

Session Store V4.1 測試完成

Lifecycle：通過
Round Collection：通過
Analysis Collection：通過
Bet Collection：通過
Persistence：通過
Import／Export：通過
Events：通過
`;
}
