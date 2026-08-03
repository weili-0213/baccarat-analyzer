/**
 * Baccarat Analyzer V5.3
 * tests/runtimeControllers.test.js
 */

import createRuntimeControllers, {
    RUNTIME_CONTROLLERS_VERSION
} from "../runtime/createRuntimeControllers.js";

import {
    RUNTIME_CONTROLLER_VERSION,
    RuntimeCommand
} from "../runtime/controllers/RuntimeController.js";

import {
    ROUND_CONTROLLER_VERSION,
    RoundInputStatus
} from "../runtime/controllers/RoundController.js";


function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}


function createRuntime() {
    return {
        status:
            "idle",

        rounds:
            [],

        analyses:
            [],

        bets:
            [],

        dashboardUpdates:
            0,

        async start() {
            this.status =
                "ready";

            return this.summary;
        },

        async reset() {
            this.status =
                "ready";

            this.rounds =
                [];

            return this.summary;
        },

        async startRound(input) {
            this.status =
                "round-active";

            this.currentRound =
                input;

            return input;
        },

        async completeRound(input) {
            this.status =
                "ready";

            const result = {
                winner:
                    input.winner ??
                    "Player",

                cards:
                    input.cards
            };

            this.rounds.push(
                result
            );

            return result;
        },

        async analyze(options) {
            const result = {
                shouldBet:
                    true,

                recommendedBet:
                    "player",

                options
            };

            this.analyses.push(
                result
            );

            return result;
        },

        async addBet(bet) {
            this.bets.push(bet);
            return bet;
        },

        async updateDashboard() {
            this.dashboardUpdates++;
            return this.dashboardUpdates;
        },

        pause() {
            this.status =
                "paused";
        },

        resume() {
            this.status =
                "ready";
        },

        async stop() {
            this.status =
                "stopped";

            return this.summary;
        },

        destroy() {
            this.status =
                "destroyed";
        },

        get summary() {
            return {
                status:
                    this.status,

                rounds:
                    this.rounds.length,

                analyses:
                    this.analyses.length,

                bets:
                    this.bets.length
            };
        }
    };
}


export default async function runtimeControllersTest() {
    const messages = [];

    assert(
        RUNTIME_CONTROLLERS_VERSION ===
            "5.3.0" &&
        RUNTIME_CONTROLLER_VERSION ===
            "5.3.0" &&
        ROUND_CONTROLLER_VERSION ===
            "5.2.0",
        "V5.3 Controller 版本錯誤"
    );

    messages.push(
        "✓ V5.3 Controller 與 V5.2 RoundController 版本正確"
    );

    const runtime =
        createRuntime();

    const stateChanges =
        [];

    const {
        runtimeController,
        roundController
    } =
        createRuntimeControllers({
            runtime,

            onStateChange:
                state => {
                    stateChanges.push(
                        state
                    );
                }
        });

    await runtimeController.execute(
        RuntimeCommand.START
    );

    assert(
        runtime.status ===
            "ready" &&
        runtimeController.summary
            .commandCount ===
            1,
        "RuntimeController start 錯誤"
    );

    messages.push(
        "✓ Runtime start command 正確"
    );

    roundController.addCard(
        "AS"
    );

    roundController.addCard(
        "KH"
    );

    roundController.addCard(
        "7D"
    );

    roundController.addCard(
        "2C"
    );

    assert(
        roundController.status ===
            RoundInputStatus.READY &&
        roundController.summary
            .cardCount ===
            4,
        "RoundController 輸入錯誤"
    );

    messages.push(
        "✓ Round Card Input 正確"
    );

    await runtimeController.execute(
        RuntimeCommand.START_ROUND,
        roundController
            .buildStartPayload()
    );

    const result =
        await runtimeController.execute(
            RuntimeCommand.COMPLETE_ROUND,
            {
                winner:
                    "Banker"
            }
        );

    assert(
        result.winner ===
            "Banker" &&
        result.cards.length ===
            4 &&
        runtime.rounds.length ===
            1 &&
        roundController.status ===
            RoundInputStatus.COMPLETED,
        "Round 完成流程錯誤"
    );

    messages.push(
        "✓ Start／Complete Round 正確"
    );

    await runtimeController.execute(
        RuntimeCommand.ANALYZE,
        {
            mode:
                "exact"
        }
    );

    await runtimeController.execute(
        RuntimeCommand.ADD_BET,
        {
            bet:
                "player",

            amount:
                100
        }
    );

    await runtimeController.execute(
        RuntimeCommand.REFRESH
    );

    assert(
        runtime.analyses.length ===
            1 &&
        runtime.bets.length ===
            1 &&
        runtime.dashboardUpdates ===
            1,
        "Analyze／Bet／Refresh command 錯誤"
    );

    messages.push(
        "✓ Analyze／Bet／Refresh 正確"
    );

    await runtimeController.execute(
        RuntimeCommand.PAUSE
    );

    assert(
        runtime.status ===
            "paused",
        "Pause command 錯誤"
    );

    await runtimeController.execute(
        RuntimeCommand.TOGGLE_PAUSE
    );

    assert(
        runtime.status ===
            "ready",
        "Toggle Pause command 錯誤"
    );

    messages.push(
        "✓ Pause／Resume command 正確"
    );

    roundController.reset();

    assert(
        roundController.status ===
            RoundInputStatus.EMPTY &&
        roundController.summary
            .remainingCards ===
            4,
        "Round reset 錯誤"
    );

    await runtimeController.execute(
        RuntimeCommand.NEW_SHOE
    );

    assert(
        runtime.status ===
            "ready" &&
        runtime.rounds.length ===
            0,
        "New Shoe command 錯誤"
    );

    messages.push(
        "✓ New Shoe command 正確"
    );

    await runtimeController.execute(
        RuntimeCommand.STOP
    );

    assert(
        runtime.status ===
            "stopped",
        "Stop command 錯誤"
    );

    assert(
        runtimeController.summary
            .version ===
            "5.3.0" &&
        runtimeController.summary
            .commandCount ===
            10 &&
        runtimeController.summary
            .lastError ===
            null &&
        stateChanges.length >
            0,
        "Controller summary 錯誤"
    );

    runtimeController.destroy();

    assert(
        runtime.status ===
            "destroyed",
        "Controller destroy 錯誤"
    );

    messages.push(
        "✓ Summary 與 Lifecycle 正確"
    );

    return `
${messages.join("\n")}

Runtime Controllers V5.3 測試完成

Runtime Commands：通過
Round Input：通過
Round Lifecycle：通過
Analysis Command：通過
Bet Command：通過
Dashboard Refresh：通過
Pause／Resume：通過
New Shoe：通過
Controller Lifecycle：通過
`;
}
