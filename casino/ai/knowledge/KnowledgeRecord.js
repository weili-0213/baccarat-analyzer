/**
 * Baccarat Analyzer V7.2
 * casino/ai/knowledge/KnowledgeRecord.js
 */

export const KNOWLEDGE_RECORD_VERSION = "7.2.0";

export default class KnowledgeRecord {
    constructor({
        knowledgeId,
        type,
        key,
        value = null,
        confidence = 0,
        weight = 1,
        source = "unknown",
        tags = [],
        metadata = {},
        createdAt = null,
        updatedAt = null
    } = {}) {
        if (
            typeof knowledgeId !== "string" ||
            knowledgeId.length === 0
        ) {
            throw new TypeError(
                "KnowledgeRecord knowledgeId is required."
            );
        }

        if (
            typeof type !== "string" ||
            type.length === 0
        ) {
            throw new TypeError(
                "KnowledgeRecord type is required."
            );
        }

        if (
            typeof key !== "string" ||
            key.length === 0
        ) {
            throw new TypeError(
                "KnowledgeRecord key is required."
            );
        }

        this.version =
            KNOWLEDGE_RECORD_VERSION;

        this.knowledgeId =
            knowledgeId;

        this.type =
            type;

        this.key =
            key;

        this.value =
            value;

        this.confidence =
            Number.isFinite(confidence)
                ? confidence
                : 0;

        this.weight =
            Number.isFinite(weight)
                ? weight
                : 1;

        this.source =
            source;

        this.tags = [
            ...tags
        ];

        this.metadata = {
            ...metadata
        };

        this.createdAt =
            createdAt;

        this.updatedAt =
            updatedAt ??
            createdAt;
    }

    update({
        value = this.value,
        confidence = this.confidence,
        weight = this.weight,
        tags = this.tags,
        metadata = this.metadata,
        updatedAt = this.updatedAt
    } = {}) {
        this.value =
            value;

        this.confidence =
            Number.isFinite(confidence)
                ? confidence
                : this.confidence;

        this.weight =
            Number.isFinite(weight)
                ? weight
                : this.weight;

        this.tags = [
            ...tags
        ];

        this.metadata = {
            ...metadata
        };

        this.updatedAt =
            updatedAt;

        return this;
    }

    toJSON() {
        return {
            version:
                this.version,

            knowledgeId:
                this.knowledgeId,

            type:
                this.type,

            key:
                this.key,

            value:
                this.value,

            confidence:
                this.confidence,

            weight:
                this.weight,

            source:
                this.source,

            tags: [
                ...this.tags
            ],

            metadata: {
                ...this.metadata
            },

            createdAt:
                this.createdAt,

            updatedAt:
                this.updatedAt
        };
    }
}
