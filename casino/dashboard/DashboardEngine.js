/**
 * Baccarat Analyzer V6.6
 * casino/dashboard/DashboardEngine.js
 *
 * Coordinates dashboard view models and panel updates.
 */

import {
    DashboardState
} from "./DashboardState.js";

import DashboardHistory
    from "./DashboardHistory.js";

import DashboardViewModelBuilder
    from "./DashboardViewModelBuilder.js";


export const DASHBOARD_ENGINE_VERSION = "6.6.0";

export const DashboardEvent = Object.freeze({
    STATE_CHANGE: "dashboard-engine:state-change",
    MOUNTED: "dashboard-engine:mounted",
    UPDATE_STARTED: "dashboard-engine:update-started",
    STATISTICS_UPDATED: "dashboard-engine:statistics-updated",
    ROADMAP_UPDATED: "dashboard-engine:roadmap-updated",
    RECOMMENDATION_UPDATED: "dashboard-engine:recommendation-updated",
    LIVE_UPDATED: "dashboard-engine:live-updated",
    UPDATED: "dashboard-engine:updated",
    PAUSED: "dashboard-engine:paused",
    RESUMED: "dashboard-engine:resumed",
    ERROR: "dashboard-engine:error",
    DESTROYED: "dashboard-engine:destroyed"
});


function isFunction(value) {
    return typeof value === "function";
}


export default class DashboardEngine {
    constructor({
        renderer = null,
        statisticsPanel = null,
        roadmapPanel = null,
        recommendationPanel = null,
        livePanel = null,
        reportPanel = null,
        builder = null,
        history = null,
        eventBus = null,
        clock = () => Date.now()
    } = {}) {
        const optionalComponents = {
            renderer,
            statisticsPanel,
            roadmapPanel,
            recommendationPanel,
            livePanel,
            reportPanel
        };

        for (
            const [name, component] of
            Object.entries(
                optionalComponents
            )
        ) {
            if (
                component !== null &&
                typeof component !== "object"
            ) {
                throw new TypeError(
                    `${name} must be an object or null.`
                );
            }
        }

        if (
            eventBus !== null &&
            !isFunction(eventBus.emit)
        ) {
            throw new TypeError(
                "eventBus requires emit()."
            );
        }

        if (!isFunction(clock)) {
            throw new TypeError(
                "clock must be a function."
            );
        }

        this.renderer = renderer;
        this.statisticsPanel =
            statisticsPanel;
        this.roadmapPanel =
            roadmapPanel;
        this.recommendationPanel =
            recommendationPanel;
        this.livePanel =
            livePanel;
        this.reportPanel =
            reportPanel;

        this.builder =
            builder ??
            new DashboardViewModelBuilder();

        this.history =
            history ??
            new DashboardHistory();

        this.eventBus = eventBus;
        this.clock = clock;

        this.state =
            DashboardState.IDLE;

        this.previousState = null;
        this.mounted = false;
        this.paused = false;
        this.updateCount = 0;
        this.lastUpdatedAt = null;
        this.lastViewModel = null;
        this.lastError = null;
        this.destroyed = false;
    }

    emit(type, payload = null) {
        return this.eventBus
            ?.emit(
                type,
                payload,
                {
                    source:
                        "dashboard-engine"
                }
            ) ??
            null;
    }

    setState(state) {
        if (
            !Object.values(
                DashboardState
            ).includes(state)
        ) {
            throw new Error(
                `Unknown DashboardState: ${state}`
            );
        }

        const previous =
            this.state;

        this.previousState =
            previous;
        this.state =
            state;

        this.emit(
            DashboardEvent.STATE_CHANGE,
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
                "DashboardEngine has been destroyed."
            );
        }
    }

    async mount(target = null) {
        this.assertNotDestroyed();

        if (this.mounted) {
            return this.summary;
        }

        this.setState(
            DashboardState.MOUNTING
        );

        try {
            await this.renderer
                ?.mount
                ?.(
                    target
                );

            await this.statisticsPanel
                ?.mount
                ?.(
                    target
                );

            await this.roadmapPanel
                ?.mount
                ?.(
                    target
                );

            await this.recommendationPanel
                ?.mount
                ?.(
                    target
                );

            await this.livePanel
                ?.mount
                ?.(
                    target
                );

            await this.reportPanel
                ?.mount
                ?.(
                    target
                );

            this.mounted = true;

            this.setState(
                DashboardState.READY
            );

            this.emit(
                DashboardEvent.MOUNTED,
                this.summary
            );

            return this.summary;
        }
        catch (error) {
            return this.handleError(
                error,
                "mount"
            );
        }
    }

    async update(input = {}) {
        this.assertNotDestroyed();

        if (this.paused) {
            return this.lastViewModel;
        }

        if (!this.mounted) {
            await this.mount();
        }

        this.setState(
            DashboardState.UPDATING
        );

        this.emit(
            DashboardEvent.UPDATE_STARTED,
            input
        );

        try {
            const viewModel =
                this.builder.build(
                    input
                );

            await this.renderer
                ?.update
                ?.(
                    viewModel
                );

            if (viewModel.statistics) {
                await this.statisticsPanel
                    ?.update
                    ?.(
                        viewModel.statistics
                    );

                this.emit(
                    DashboardEvent.STATISTICS_UPDATED,
                    viewModel.statistics
                );
            }

            if (viewModel.roadmap) {
                await this.roadmapPanel
                    ?.update
                    ?.(
                        viewModel.roadmap
                    );

                this.emit(
                    DashboardEvent.ROADMAP_UPDATED,
                    viewModel.roadmap
                );
            }

            if (viewModel.recommendation) {
                await this.recommendationPanel
                    ?.update
                    ?.(
                        viewModel.recommendation
                    );

                this.emit(
                    DashboardEvent.RECOMMENDATION_UPDATED,
                    viewModel.recommendation
                );
            }

            await this.livePanel
                ?.update
                ?.(
                    viewModel
                );

            this.emit(
                DashboardEvent.LIVE_UPDATED,
                viewModel
            );

            await this.reportPanel
                ?.update
                ?.(
                    viewModel
                );

            this.updateCount++;

            this.lastUpdatedAt =
                this.clock();

            this.lastViewModel =
                viewModel;

            this.history.add({
                index:
                    this.updateCount,

                timestamp:
                    this.lastUpdatedAt,

                viewModel
            });

            this.setState(
                DashboardState.READY
            );

            this.emit(
                DashboardEvent.UPDATED,
                {
                    viewModel,
                    summary:
                        this.summary
                }
            );

            return viewModel;
        }
        catch (error) {
            return this.handleError(
                error,
                "update"
            );
        }
    }

    updateFromAnalysis({
        analysis,
        session = null,
        shoe = null,
        round = null,
        statistics = null,
        roadmap = null,
        metadata = {}
    } = {}) {
        return this.update({
            analysis,
            session,
            shoe,
            round,
            statistics,
            roadmap,
            recommendation:
                analysis
                    ?.recommendation ??
                null,
            metadata
        });
    }

    pause() {
        this.assertNotDestroyed();

        this.paused = true;

        this.setState(
            DashboardState.PAUSED
        );

        this.emit(
            DashboardEvent.PAUSED,
            this.summary
        );

        return this.summary;
    }

    resume() {
        this.assertNotDestroyed();

        this.paused = false;

        this.setState(
            DashboardState.READY
        );

        this.emit(
            DashboardEvent.RESUMED,
            this.summary
        );

        return this.summary;
    }

    clear() {
        this.lastViewModel = null;
        this.lastUpdatedAt = null;
        this.updateCount = 0;
        this.history.clear();

        this.renderer
            ?.clear
            ?.();

        this.statisticsPanel
            ?.clear
            ?.();

        this.roadmapPanel
            ?.clear
            ?.();

        this.recommendationPanel
            ?.clear
            ?.();

        this.livePanel
            ?.clear
            ?.();

        this.reportPanel
            ?.clear
            ?.();

        return this;
    }

    handleError(error, phase) {
        this.lastError =
            error;

        this.setState(
            DashboardState.ERROR
        );

        this.emit(
            DashboardEvent.ERROR,
            {
                phase,
                message:
                    error?.message ??
                    String(error)
            }
        );

        throw error;
    }

    async destroy() {
        if (this.destroyed) {
            return this;
        }

        await this.renderer
            ?.destroy
            ?.();

        await this.statisticsPanel
            ?.destroy
            ?.();

        await this.roadmapPanel
            ?.destroy
            ?.();

        await this.recommendationPanel
            ?.destroy
            ?.();

        await this.livePanel
            ?.destroy
            ?.();

        await this.reportPanel
            ?.destroy
            ?.();

        this.clear();

        this.mounted = false;
        this.destroyed = true;

        this.setState(
            DashboardState.DESTROYED
        );

        this.emit(
            DashboardEvent.DESTROYED,
            null
        );

        return this;
    }

    get summary() {
        return {
            version:
                DASHBOARD_ENGINE_VERSION,

            state:
                this.state,

            previousState:
                this.previousState,

            destroyed:
                this.destroyed,

            mounted:
                this.mounted,

            paused:
                this.paused,

            updateCount:
                this.updateCount,

            lastUpdatedAt:
                this.lastUpdatedAt,

            hasViewModel:
                Boolean(
                    this.lastViewModel
                ),

            lastError:
                this.lastError
                    ?.message ??
                null,

            history:
                this.history.summary,

            builder:
                this.builder.summary
        };
    }
}
