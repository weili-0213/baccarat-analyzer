/**
 * Baccarat Analyzer V3.7.1
 * analysis/analyzer.js
 *
 * Analyzer Facade
 *
 * 對外維持舊版 Analyzer API，內部正式委派給：
 *
 * Analyzer
 *      ↓
 * AnalyzerCoordinator
 *      ↓
 * PipelineManager
 *      ↓
 * Legacy Core Compatibility Pipeline
 *
 * 此階段先確保所有 Game、Worker、Dashboard 與既有測試保持相容。
 * 下一階段可逐步用獨立 Pipelines 取代 Compatibility Pipeline，
 * 不需要再修改 Analyzer 的公開 API。
 */

import AnalyzerLegacyCore, {
    ANALYZER_ARCHITECTURE_VERSION,
    AnalysisMode,
    BET_CONFIG,
    MAIN_RECOMMENDATION_BETS,
    SIDE_BETS
} from "./AnalyzerLegacyCore.js";

import AnalyzerCoordinator
    from "./AnalyzerCoordinator.js";

import PipelineManager
    from "./pipeline/PipelineManager.js";


/**
 * Legacy public API version.
 *
 * IMPORTANT:
 * Existing tests and integrations explicitly depend on ANALYZER_VERSION 3.7.1.
 * Do not alias this to the No Commission release number.
 */
export const ANALYZER_VERSION =
    "3.7.1";


/**
 * No Commission EV rules release.
 */
export const ANALYZER_NO_COMMISSION_VERSION =
    "10.4.5";


/**
 * This compatibility hotfix release.
 */
export const ANALYZER_COMPATIBILITY_VERSION =
    "10.4.5.1";


export {
    ANALYZER_ARCHITECTURE_VERSION,
    AnalysisMode,
    BET_CONFIG,
    MAIN_RECOMMENDATION_BETS,
    SIDE_BETS
};


function isObject(value) {

    return (
        value !== null &&
        typeof value ===
            "object" &&
        !Array.isArray(value)
    );

}


export default class Analyzer {

    constructor(context = {}) {

        if (!isObject(context)) {

            throw new TypeError(
                "Analyzer context must be an object."
            );

        }


        this.core =
            new AnalyzerLegacyCore(
                context
            );


        this.pipelineManager =
            this.createPipelineManager();


        this.coordinator =
            new AnalyzerCoordinator({

                pipelineManager:
                    this.pipelineManager,

                context:
                    this.core.context,

                mode:
                    this.core.options.mode

            });

    }


    /**
     * V3.7.1 相容橋接 Pipeline。
     *
     * Pipeline 本身只負責呼叫已驗證的 Core，
     * 並把輸出放入 analysisResult / finalResult。
     */
    createPipelineManager() {

        return new PipelineManager({

            pipelines: [

                {

                    name:
                        "legacy-analysis-core",

                    priority:
                        10,

                    metadata: {

                        version:
                            ANALYZER_VERSION,

                        type:
                            "compatibility"

                    },

                    run:
                        async ({
                            state
                        }) => {

                            this.core
                                .setContext(
                                    state.context
                                );


                            const result =
                                await this.core
                                    .analyze(
                                        state.runOptions
                                    );


                            return {

                                analysisResult:
                                    result,

                                finalResult:
                                    result

                            };

                        }

                }

            ]

        });

    }


    setContext(context = {}) {

        this.core
            .setContext(
                context
            );


        this.coordinator
            .setContext(
                this.core.context
            )
            .setMode(
                this.core.options.mode
            );


        return this;

    }


    updateGameContext(options = {}) {

        this.core
            .updateGameContext(
                options
            );


        this.coordinator
            .setContext(
                this.core.context
            );


        return this;

    }


    validateOptions() {

        return this.core
            .validateOptions();

    }


    validateContext() {

        return this.core
            .validateContext();

    }


    /**
     * 保留舊版工具 API。
     * 外部模組若仍有直接呼叫，不會因 Facade 化而失效。
     */
    validateProbabilityValue(
        value,
        name
    ) {

        return this.core
            .validateProbabilityValue(
                value,
                name
            );

    }


    extractProbability(source) {

        return this.core
            .extractProbability(
                source
            );

    }


    normalizeProbability(source) {

        return this.core
            .normalizeProbability(
                source
            );

    }


    runMonteCarlo(options = {}) {

        return this.core
            .runMonteCarlo(
                options
            );

    }


    runExact(options = {}) {

        return this.core
            .runExact(
                options
            );

    }


    resolveAnalysis(options = {}) {

        return this.core
            .resolveAnalysis(
                options
            );

    }


    getEV(probability) {

        return this.core
            .getEV(
                probability
            );

    }


    getEVStatus() {

        return this.core
            .getEVStatus();

    }


    buildBetInput(probability) {

        return this.core
            .buildBetInput(
                probability
            );

    }


    buildKellyOptions(options = {}) {

        return this.core
            .buildKellyOptions(
                options
            );

    }


    getKelly(
        probability,
        options = {}
    ) {

        return this.core
            .getKelly(
                probability,
                options
            );

    }


    getRisk(probability) {

        return this.core
            .getRisk(
                probability
            );

    }


    getSampleSize(monteCarlo) {

        return this.core
            .getSampleSize(
                monteCarlo
            );

    }


    getConfidence(options) {

        return this.core
            .getConfidence(
                options
            );

    }


    buildRankingInput(options) {

        return this.core
            .buildRankingInput(
                options
            );

    }


    buildSideBetAnalysis(options) {

        return this.core
            .buildSideBetAnalysis(
                options
            );

    }


    getRanking(rankingInput) {

        return this.core
            .getRanking(
                rankingInput
            );

    }


    getBestFromRanking(ranking) {

        return this.core
            .getBestFromRanking(
                ranking
            );

    }


    getRecommendation(ranking) {

        return this.core
            .getRecommendation(
                ranking
            );

    }


    /**
     * 正式 Facade 入口。
     */
    async analyze(runOptions = {}) {

        return this.coordinator
            .analyze(
                runOptions
            );

    }


    async analyzeContext(
        context = {},
        runOptions = {}
    ) {

        if (!isObject(context)) {

            throw new TypeError(
                "Analyzer context must be an object."
            );

        }


        if (!context.shoe) {

            throw new Error(
                "Analyzer context requires a Shoe."
            );

        }


        this.setContext(
            context
        );


        return this.coordinator
            .analyzeContext(
                this.core.context,
                runOptions
            );

    }


    async run(
        context = {},
        runOptions = {}
    ) {

        return this.analyzeContext(
            context,
            runOptions
        );

    }


    setMode(mode) {

        this.core
            .setMode(
                mode
            );


        this.coordinator
            .setMode(
                mode
            );


        return this;

    }


    setRankingStrategy(strategy) {

        this.core
            .setRankingStrategy(
                strategy
            );


        return this;

    }


    getOptions() {

        return this.core
            .getOptions();

    }


    clear() {

        this.coordinator
            .clear();


        return this;

    }


    destroy() {

        this.clear();

        this.pipelineManager
            .clear();


        return this;

    }


    /**
     * 舊版公開屬性相容。
     */
    get context() {

        return this.core.context;

    }


    get options() {

        return this.core.options;

    }


    get monteCarlo() {

        return this.core.monteCarlo;

    }


    get exact() {

        return this.core.exact;

    }


    get ev() {

        return this.core.ev;

    }


    get kelly() {

        return this.core.kelly;

    }


    get risk() {

        return this.core.risk;

    }


    get confidence() {

        return this.core.confidence;

    }


    get ranking() {

        return this.core.ranking;

    }


    get recommendation() {

        return this.core.recommendation;

    }


    get summary() {

        return {

            ...this.core.summary,

            version:
                ANALYZER_VERSION,

            noCommissionVersion:
                ANALYZER_NO_COMMISSION_VERSION,

            compatibilityVersion:
                ANALYZER_COMPATIBILITY_VERSION,

            architectureVersion:
                ANALYZER_ARCHITECTURE_VERSION,

            facade:
                true,

            coordinator:
                this.coordinator
                    .summary,

            pipeline:
                this.pipelineManager
                    .summary

        };

    }

}
