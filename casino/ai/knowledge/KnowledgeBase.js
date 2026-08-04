/**
 * Baccarat Analyzer V7.2
 * casino/ai/knowledge/KnowledgeBase.js
 */

import KnowledgeRecord
    from "./KnowledgeRecord.js";


export const KNOWLEDGE_BASE_VERSION = "7.2.0";


export default class KnowledgeBase {
    constructor({
        limit = 5000
    } = {}) {
        if (
            !Number.isInteger(limit) ||
            limit < 1
        ) {
            throw new RangeError(
                "KnowledgeBase limit must be positive."
            );
        }

        this.limit =
            limit;

        this.records =
            new Map();
    }

    add(record) {
        if (
            !(record instanceof KnowledgeRecord)
        ) {
            record =
                new KnowledgeRecord(
                    record
                );
        }

        this.records.set(
            record.knowledgeId,
            record
        );

        this.enforceLimit();

        return record;
    }

    upsert(record) {
        const existing =
            this.get(
                record.knowledgeId
            );

        if (!existing) {
            return this.add(
                record
            );
        }

        existing.update(
            record
        );

        return existing;
    }

    get(knowledgeId) {
        return (
            this.records.get(
                knowledgeId
            ) ??
            null
        );
    }

    findByKey(key) {
        return [
            ...this.records.values()
        ].filter(
            record =>
                record.key === key
        );
    }

    findByType(type) {
        return [
            ...this.records.values()
        ].filter(
            record =>
                record.type === type
        );
    }

    search(query) {
        const normalized =
            String(query ?? "")
                .trim()
                .toLowerCase();

        if (!normalized) {
            return [];
        }

        return [
            ...this.records.values()
        ].filter(
            record =>
                record.key
                    .toLowerCase()
                    .includes(
                        normalized
                    ) ||
                record.tags.some(
                    tag =>
                        String(tag)
                            .toLowerCase()
                            .includes(
                                normalized
                            )
                )
        );
    }

    remove(knowledgeId) {
        return this.records.delete(
            knowledgeId
        );
    }

    clear() {
        this.records.clear();

        return this;
    }

    enforceLimit() {
        while (
            this.records.size >
            this.limit
        ) {
            const oldestKey =
                this.records.keys()
                    .next()
                    .value;

            this.records.delete(
                oldestKey
            );
        }
    }

    get summary() {
        const byType = {};

        for (
            const record of
            this.records.values()
        ) {
            byType[record.type] =
                (
                    byType[record.type] ??
                    0
                ) + 1;
        }

        return {
            version:
                KNOWLEDGE_BASE_VERSION,

            limit:
                this.limit,

            count:
                this.records.size,

            byType
        };
    }
}
