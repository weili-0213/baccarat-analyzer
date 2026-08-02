/**
 * Baccarat Analyzer V3.4.3
 * renderers/HistoryRenderer.js
 */

export const HISTORY_RENDERER_VERSION =
    "3.4.3";


function winnerLabel(winner) {

    return winner ===
        "Player"
        ? "閒"
        : winner ===
            "Banker"
            ? "莊"
            : winner ===
                "Tie"
                ? "和"
                : "—";

}


export default class HistoryRenderer {

    constructor({

        limit = 20

    } = {}) {

        this.limit =
            limit;

    }


    render(game) {

        const rounds =
            typeof game.history
                ?.lastRounds ===
                "function"
                ? game.history
                    .lastRounds(
                        this.limit
                    )
                : [];


        return `

            <section class="dashboardCard v3HistoryPanel">

                <header class="v3PanelHeader">

                    <div>

                        <small>
                            HISTORY
                        </small>

                        <h2>
                            最近牌局
                        </h2>

                    </div>

                </header>


                ${rounds.length
                    ? `
                        <div class="v3HistoryRoad">

                            ${rounds
                                .map(
                                    result => `

                                        <span class="${String(
                                            result.winner ??
                                            ""
                                        ).toLowerCase()}">
                                            ${winnerLabel(
                                                result.winner
                                            )}
                                        </span>

                                    `
                                )
                                .join(
                                    ""
                                )}

                        </div>
                    `
                    : `
                        <p class="v3Empty">
                            尚無牌局紀錄。
                        </p>
                    `}

            </section>

        `;

    }


    get summary() {

        return {

            version:
                HISTORY_RENDERER_VERSION,

            limit:
                this.limit

        };

    }

}
