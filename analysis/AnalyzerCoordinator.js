/**
 * Baccarat Analyzer V3.7
 * analysis/AnalyzerCoordinator.js
 *
 * Analyzer 與 PipelineManager 之間的協調層。
 *
 * 職責：
 * - 保存／更新分析 context
 * - 建立 initialState
 * - 執行 PipelineManager
 * - 回傳 ResultPipeline 產生的 analysisResult
 * - 保存最後一次 Pipeline 執行資訊
 *
 * 不負責：
 * - Probability
 * - EV
 * - Kelly
 * - Risk
 * - Confidence
 * - Ranking
 * - Recommendation
 */

export const ANALYZER_COORDINATOR_VERSION = "3.7.0";

function isObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function now() {
    return (
        globalThis.performance
            ?.now?.() ??
        Date.now()
    );
}

export default class AnalyzerCoordinator {
    constructor({
        pipelineManager,
        context = {},
        mode = null
    } = {}) {
        if (
            !pipelineManager ||
            typeof pipelineManager.run !== "function"
        ) {
            throw new Error(
                "AnalyzerCoordinator requires a PipelineManager."
            );
        }

        if (!isObject(context)) {
            throw new TypeError(
                "AnalyzerCoordinator context must be an object."
            );
        }

        this.pipelineManager =
            pipelineManager;

        this.context = {
            ...context
        };

        this.mode =
            mode;

        this.lastResult =
            null;

        this.lastPipelineResult =
            null;

        this.lastError =
            null;

        this.runCount =
            0;
    }

    setContext(context = {}) {
        if (!isObject(context)) {
            throw new TypeError(
                "AnalyzerCoordinator context must be an object."
            );
        }

        this.context = {
            ...context
        };

        return this;
    }

    updateContext(context = {}) {
        if (!isObject(context)) {
            throw new TypeError(
                "AnalyzerCoordinator context update must be an object."
            );
        }

        this.context = {
            ...this.context,
            ...context
        };

        return this;
    }

    setMode(mode) {
        if (
            mode !== null &&
            typeof mode !== "string"
        ) {
            throw new TypeError(
                "AnalyzerCoordinator mode must be a string or null."
            );
        }

        this.mode = mode;

        return this;
    }

    validateContext(context) {
        if (!isObject(context)) {
            throw new TypeError(
                "Analysis context must be an object."
            );
        }

        if (!context.shoe) {
            throw new Error(
                "AnalyzerCoordinator requires context.shoe."
            );
        }
    }

    createInitialState(
        context,
        runOptions = {}
    ) {
        if (!isObject(runOptions)) {
            throw new TypeError(
                "Analyzer runOptions must be an object."
            );
        }

        const shoe =
            context.shoe;

        const historyCount =
            context.history?.count ??
            context.historyCount ??
            context.roundCount ??
            0;

        const roundCount =
            context.roundCount ??
            historyCount;

        const physicalRemaining =
            context.physicalRemaining ??
            shoe.physicalRemaining ??
            shoe.remaining ??
            null;

        const observableRemaining =
            context.observableRemaining ??
            shoe.observableRemaining ??
            physicalRemaining;

        const unknownBurnedCount =
            context.unknownBurnedCount ??
            shoe.unknownBurnedCount ??
            context.burn?.hiddenCount ??
            0;

        return {
            context,
            shoe,
            history:
                context.history ??
                null,
            historyCount,
            roundCount,
            generatedAfterRound:
                roundCount,
            cards:
                context.cards ??
                shoe.peek?.() ??
                [],
            observableCards:
                context.observableCards ??
                context.cards ??
                shoe.peek?.() ??
                [],
            physicalRemaining,
            remainingCards:
                physicalRemaining,
            observableRemaining,
            unknownBurnedCount,
            unknownCards:
                unknownBurnedCount,
            shoeSummary:
                context.shoeSummary ??
                shoe.summary ??
                null,
            burn:
                context.burn ??
                null,
            historyItems:
                context.historyItems ??
                context.history
                    ?.getAll?.() ??
                [],
            roadmap:
                context.roadmap ??
                null,
            roadmapAnalyzer:
                context.roadmapAnalyzer ??
                null,
            lastResult:
                context.lastResult ??
                context.history?.last ??
                null,
            payouts:
                context.payouts ??
                {},
            bankroll:
                runOptions.bankroll ??
                context.bankroll ??
                context.analyzerOptions
                    ?.bankroll ??
                10000,
            fraction:
                runOptions.fraction ??
                context.fraction ??
                context.analyzerOptions
                    ?.fraction ??
                0.25,
            minBet:
                runOptions.minBet ??
                context.minBet ??
                context.analyzerOptions
                    ?.minBet ??
                100,
            maxBet:
                runOptions.maxBet ??
                context.maxBet ??
                context.analyzerOptions
                    ?.maxBet ??
                10000,
            maxBankrollRatio:
                runOptions.maxBankrollRatio ??
                context.maxBankrollRatio ??
                context.analyzerOptions
                    ?.maxBankrollRatio ??
                1,
            mode:
                runOptions.mode ??
                this.mode ??
                context.analyzerOptions
                    ?.mode ??
                null,
            runOptions: {
                ...runOptions,
                mode:
                    runOptions.mode ??
                    this.mode ??
                    context.analyzerOptions
                        ?.mode ??
                    null,
                monteCarloOptions: {
                    ...(
                        context.monteCarloOptions ??
                        context.analyzerOptions
                            ?.monteCarlo ??
                        {}
                    ),
                    ...(
                        runOptions.monteCarloOptions ??
                        {}
                    )
                },
                exactOptions: {
                    ...(
                        context.exactOptions ??
                        context.analyzerOptions
                            ?.exact ??
                        {}
                    ),
                    ...(
                        runOptions.exactOptions ??
                        {}
                    )
                },
                recommendationOptions: {
                    ...(
                        context.recommendationOptions ??
                        {}
                    ),
                    ...(
                        runOptions.recommendationOptions ??
                        {}
                    )
                }
            }
        };
    }

    async analyze(
        runOptions = {}
    ) {
        return this.analyzeContext(
            this.context,
            runOptions
        );
    }

    async analyzeContext(
        context,
        runOptions = {}
    ) {
        this.validateContext(
            context
        );

        const startedAt =
            now();

        const initialState =
            this.createInitialState(
                context,
                runOptions
            );

        this.runCount++;
        this.lastError = null;

        try {
            const pipelineResult =
                await this.pipelineManager
                    .run(
                        initialState,
                        {
                            signal:
                                runOptions.signal ??
                                null,
                            onBeforeStep:
                                runOptions.onBeforeStep ??
                                null,
                            onAfterStep:
                                runOptions.onAfterStep ??
                                null,
                            onError:
                                runOptions.onPipelineError ??
                                null
                        }
                    );

            const result =
                pipelineResult.state
                    .analysisResult ??
                pipelineResult.state
                    .finalResult;

            if (!isObject(result)) {
                throw new Error(
                    "Pipeline execution did not produce analysisResult."
                );
            }

            result.durationMs =
                now() -
                startedAt;

            result.analyzedAt =
                new Date()
                    .toISOString();

            result.pipeline = {
                version:
                    pipelineResult.version ??
                    null,
                completed:
                    pipelineResult.completed,
                failed:
                    pipelineResult.failed,
                execution:
                    pipelineResult.execution
            };

            this.context = {
                ...context
            };

            this.lastPipelineResult =
                pipelineResult;

            this.lastResult =
                result;

            return result;
        }
        catch (error) {
            this.lastError =
                error;

            throw error;
        }
    }

    run(
        context,
        runOptions = {}
    ) {
        return this.analyzeContext(
            context,
            runOptions
        );
    }

    clear() {
        this.lastResult = null;
        this.lastPipelineResult = null;
        this.lastError = null;

        return this;
    }

    get summary() {
        return {
            version:
                ANALYZER_COORDINATOR_VERSION,
            mode:
                this.mode,
            runCount:
                this.runCount,
            hasContext:
                Boolean(
                    this.context?.shoe
                ),
            hasResult:
                Boolean(
                    this.lastResult
                ),
            pipelineCount:
                this.pipelineManager
                    .size ??
                null,
            lastMethod:
                this.lastResult
                    ?.method ??
                null,
            lastDurationMs:
                this.lastResult
                    ?.durationMs ??
                null,
            lastError:
                this.lastError
                    ?.message ??
                null
        };
    }
}
