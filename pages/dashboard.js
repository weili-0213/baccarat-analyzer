/**
 * Baccarat Analyzer
 * Dashboard
 */

import Game from "../engine/game.js";
import {
    createRoadmap
} from "../components/Roadmap.js";

export default class Dashboard {

    constructor(root) {

        if (!(root instanceof HTMLElement)) {
            throw new Error("Dashboard root required");
        }

        this.root = root;

        this.game = new Game();

        this.roadmap = null;

        this.render();

    }

    render() {

        this.root.innerHTML = `
<div class="dashboard">

    <div class="dashboard-toolbar">

        <button id="play">
            發一局
        </button>

        <button id="reset">
            新牌靴
        </button>

    </div>

    <div class="dashboard-status">

        <div>
            <strong>剩餘牌數：</strong>
            <span id="remaining">416</span>
        </div>

        <div>
            <strong>已完成局數：</strong>
            <span id="rounds">0</span>
        </div>

        <div>
            <strong>最後結果：</strong>
            <span id="winner">-</span>
        </div>

    </div>

    <div id="roadmap"></div>

</div>
`;

        this.roadmap = createRoadmap(

            this.root.querySelector("#roadmap"),

            this.game

        );

        this.bindEvents();

        this.update();

    }

    bindEvents() {

        this.root
            .querySelector("#play")
            .addEventListener(
                "click",
                () => this.play()
            );

        this.root
            .querySelector("#reset")
            .addEventListener(
                "click",
                () => this.reset()
            );

    }

    play() {

        const result =
            this.game.play();

        this.update(result);

    }

    reset() {

        this.game =
            new Game();

        this.roadmap.setSource(
            this.game
        );

        this.update();

    }

    update(result = null) {

        this.root.querySelector(
            "#remaining"
        ).textContent =
            this.game.shoe.remaining;

        this.root.querySelector(
            "#rounds"
        ).textContent =
            this.game.history.count;

        this.root.querySelector(
            "#winner"
        ).textContent =
            result
            ?
            result.winner
            :
            "-";

        this.roadmap.update();

    }

    destroy() {

        this.roadmap.destroy();

        this.root.innerHTML = "";

    }

}
對應的 HTML

在 pages/dashboard.js 使用時，只需要：

<div id="app"></div>

然後：

import Dashboard from "./pages/dashboard.js";

new Dashboard(
    document.getElementById("app")
);
