/**
 * Baccarat Analyzer V3.4.3
 * renderers/RoadmapRenderer.js
 */

export const ROADMAP_RENDERER_VERSION =
    "3.4.3";


const ROAD_LABELS =
    Object.freeze({

        beadRoad:
            "珠盤路",

        bigRoad:
            "大路",

        bigEyeRoad:
            "大眼仔",

        smallRoad:
            "小路",

        cockroachRoad:
            "曱甴路"

    });


export default class RoadmapRenderer {

    render({

        game,
        activeRoad

    }) {

        const roads =
            game.roadmapViewModel
                ?.roads ??
            game.roadMatrices ??
            {};

        const matrix =
            roads[
                activeRoad
            ] ??
            [];


        return `

            <section class="dashboardCard v3RoadmapPanel">

                <div class="v3RoadTabs">

                    ${Object.entries(
                        ROAD_LABELS
                    )
                        .map(
                            (
                                [
                                    key,
                                    label
                                ]
                            ) => `

                                <button
                                    type="button"
                                    class="${key ===
                                    activeRoad
                                        ? "active"
                                        : ""}"
                                    data-action="select-road"
                                    data-road="${key}"
                                >
                                    ${label}
                                </button>

                            `
                        )
                        .join(
                            ""
                        )}

                </div>


                <div class="v3RoadViewport">

                    ${this.renderMatrix(
                        matrix
                    )}

                </div>

            </section>

        `;

    }


    renderMatrix(matrix) {

        if (
            !Array.isArray(
                matrix
            ) ||
            matrix.length ===
                0
        ) {

            return `

                <p class="v3Empty">
                    尚無路單資料。
                </p>

            `;

        }


        const rows =
            matrix.length;

        const columns =
            Math.max(
                0,
                ...matrix.map(
                    row =>
                        Array.isArray(
                            row
                        )
                            ? row.length
                            : 0
                )
            );

        const cells =
            [];


        for (
            let column = 0;
            column < columns;
            column++
        ) {

            for (
                let row = 0;
                row < rows;
                row++
            ) {

                const cell =
                    matrix[row]
                        ?.[column] ??
                    null;

                const winner =
                    String(
                        cell?.winner ??
                        cell?.result ??
                        cell?.value ??
                        ""
                    )
                        .toLowerCase();

                const className =
                    winner.includes(
                        "player"
                    )
                        ? "player"
                        : winner.includes(
                            "banker"
                        )
                            ? "banker"
                            : winner.includes(
                                "tie"
                            )
                                ? "tie"
                                : cell
                                    ? "derived"
                                    : "empty";


                cells.push(
                    `<span class="${className}"></span>`
                );

            }

        }


        return `

            <div
                class="v3RoadMatrix"
                style="--road-rows:${rows};--road-columns:${columns}"
            >
                ${cells.join("")}
            </div>

        `;

    }


    get summary() {

        return {

            version:
                ROADMAP_RENDERER_VERSION,

            roads:
                Object.keys(
                    ROAD_LABELS
                ).length

        };

    }

}
