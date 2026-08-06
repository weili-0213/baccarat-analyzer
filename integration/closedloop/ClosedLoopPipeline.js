/**
 * Baccarat Analyzer V10.0
 * Path: integration/closedloop/ClosedLoopPipeline.js
 * Purpose: Registers, orders and executes closed-loop intelligence stages.
 */
export const CLOSED_LOOP_PIPELINE_VERSION = "10.0.0";

export default class ClosedLoopPipeline {
    constructor({
        stages = []
    } = {}) {
        this.stages = [];

        for (const stage of stages) {
            this.register(stage);
        }
    }

    register(stage) {
        if (!stage?.stageId) {
            throw new TypeError(
                "ClosedLoopPipeline stage requires stageId."
            );
        }

        if (!stage.gateway || typeof stage.gateway.run !== "function") {
            throw new TypeError(
                `ClosedLoopPipeline ${stage.stageId} requires gateway.run().`
            );
        }

        this.stages.push({
            stageId: stage.stageId,
            state: stage.state,
            outputKey: stage.outputKey,
            gateway: stage.gateway,
            input:
                typeof stage.input === "function"
                    ? stage.input
                    : ({ context }) => ({
                        context
                    }),
            shouldRun:
                typeof stage.shouldRun === "function"
                    ? stage.shouldRun
                    : () => true,
            order:
                Number.isFinite(stage.order)
                    ? stage.order
                    : this.stages.length
        });

        this.stages.sort(
            (a, b) =>
                a.order - b.order
        );

        return this;
    }

    list() {
        return this.stages.map(
            stage => ({
                stageId: stage.stageId,
                state: stage.state,
                outputKey: stage.outputKey,
                order: stage.order
            })
        );
    }

    get summary() {
        return {
            version: CLOSED_LOOP_PIPELINE_VERSION,
            count: this.stages.length,
            stages: this.list()
        };
    }
}
