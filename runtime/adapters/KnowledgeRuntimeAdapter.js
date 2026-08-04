/**
 * Baccarat Analyzer V7.2
 * runtime/adapters/KnowledgeRuntimeAdapter.js
 */

export const KNOWLEDGE_RUNTIME_ADAPTER_VERSION = "7.2.0";

export default class KnowledgeRuntimeAdapter {
    constructor({
        knowledge
    } = {}) {
        if (
            !knowledge ||
            typeof knowledge.infer !==
                "function"
        ) {
            throw new TypeError(
                "KnowledgeRuntimeAdapter requires a KnowledgeEngine-compatible object."
            );
        }

        this.knowledge =
            knowledge;
    }

    addKnowledge(input = {}) {
        return this.knowledge
            .addKnowledge(
                input
            );
    }

    ingestExperience(
        experience = {}
    ) {
        return this.knowledge
            .ingestExperience(
                experience
            );
    }

    infer(context = {}) {
        return this.knowledge
            .infer(
                context
            );
    }

    pause() {
        return this.knowledge.pause();
    }

    resume() {
        return this.knowledge.resume();
    }

    reset() {
        return this.knowledge.reset();
    }

    destroy() {
        return this.knowledge.destroy();
    }

    get summary() {
        return {
            version:
                KNOWLEDGE_RUNTIME_ADAPTER_VERSION,

            knowledge:
                this.knowledge.summary
        };
    }
}
