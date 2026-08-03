/**
 * Baccarat Analyzer V4.1
 * analysis/SessionStore.js
 *
 * Session data collector and persistence layer.
 *
 * Stores:
 * - rounds
 * - analyses
 * - bets
 * - session metadata
 *
 * Supports:
 * - in-memory operation
 * - optional localStorage-compatible adapter
 * - start / end / reset lifecycle
 * - import / export
 * - subscriptions
 */

export const SESSION_STORE_VERSION = "4.1.0";

export const SessionStatus = Object.freeze({
    IDLE: "idle",
    ACTIVE: "active",
    ENDED: "ended"
});

function isObject(value) {
    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function cloneValue(value) {
    if (value === undefined) {
        return undefined;
    }

    if (value === null) {
        return null;
    }

    if (typeof structuredClone === "function") {
        try {
            return structuredClone(value);
        }
        catch {
            // Fall through to JSON cloning.
        }
    }

    if (typeof value.toJSON === "function") {
        return cloneValue(value.toJSON());
    }

    return JSON.parse(
        JSON.stringify(value)
    );
}

function createId() {
    const random =
        Math.random()
            .toString(36)
            .slice(2, 10);

    return `session-${Date.now()}-${random}`;
}

function createMemoryAdapter() {
    const memory = new Map();

    return {
        getItem(key) {
            return memory.has(key)
                ? memory.get(key)
                : null;
        },

        setItem(key, value) {
            memory.set(
                key,
                String(value)
            );
        },

        removeItem(key) {
            memory.delete(key);
        }
    };
}

function normalizeStorage(storage) {
    if (!storage) {
        return null;
    }

    for (const method of [
        "getItem",
        "setItem",
        "removeItem"
    ]) {
        if (typeof storage[method] !== "function") {
            throw new TypeError(
                `storage requires ${method}().`
            );
        }
    }

    return storage;
}

function normalizeRecord(value, label) {
    if (!isObject(value)) {
        throw new TypeError(
            `${label} must be an object.`
        );
    }

    return cloneValue(value);
}

export default class SessionStore {
    constructor({
        storage = null,
        storageKey = "baccarat-analyzer-session-v4",
        autoSave = true,
        clock = () => new Date().toISOString(),
        idFactory = createId
    } = {}) {
        if (
            typeof storageKey !== "string" ||
            storageKey.trim().length === 0
        ) {
            throw new TypeError(
                "storageKey must be a non-empty string."
            );
        }

        if (typeof clock !== "function") {
            throw new TypeError(
                "clock must be a function."
            );
        }

        if (typeof idFactory !== "function") {
            throw new TypeError(
                "idFactory must be a function."
            );
        }

        this.storage =
            normalizeStorage(storage);

        this.storageKey =
            storageKey;

        this.autoSave =
            Boolean(autoSave);

        this.clock =
            clock;

        this.idFactory =
            idFactory;

        this.listeners =
            new Set();

        this.saveCount =
            0;

        this.loadCount =
            0;

        this.session =
            this.createEmptySession();
    }

    static memoryAdapter() {
        return createMemoryAdapter();
    }

    createEmptySession() {
        return {
            version:
                SESSION_STORE_VERSION,

            id:
                null,

            status:
                SessionStatus.IDLE,

            startedAt:
                null,

            endedAt:
                null,

            shoeNumber:
                null,

            rounds:
                [],

            analyses:
                [],

            bets:
                [],

            metadata:
                {},

            createdAt:
                this.clock(),

            updatedAt:
                this.clock()
        };
    }

    start({
        id = this.idFactory(),
        shoeNumber = null,
        metadata = {},
        startedAt = this.clock(),
        replace = false
    } = {}) {
        if (
            this.session.status ===
                SessionStatus.ACTIVE &&
            !replace
        ) {
            throw new Error(
                "A session is already active."
            );
        }

        if (!isObject(metadata)) {
            throw new TypeError(
                "metadata must be an object."
            );
        }

        this.session = {
            version:
                SESSION_STORE_VERSION,

            id,

            status:
                SessionStatus.ACTIVE,

            startedAt,

            endedAt:
                null,

            shoeNumber,

            rounds:
                [],

            analyses:
                [],

            bets:
                [],

            metadata:
                cloneValue(metadata),

            createdAt:
                this.clock(),

            updatedAt:
                this.clock()
        };

        this.commit("start");

        return this.snapshot;
    }

    end({
        endedAt = this.clock(),
        metadata = null
    } = {}) {
        this.assertActive();

        if (
            metadata !== null &&
            !isObject(metadata)
        ) {
            throw new TypeError(
                "metadata must be an object or null."
            );
        }

        if (metadata) {
            this.session.metadata = {
                ...this.session.metadata,
                ...cloneValue(metadata)
            };
        }

        this.session.status =
            SessionStatus.ENDED;

        this.session.endedAt =
            endedAt;

        this.touch();

        this.commit("end");

        return this.snapshot;
    }

    reset({
        preserveMetadata = false
    } = {}) {
        const metadata =
            preserveMetadata
                ? cloneValue(
                    this.session.metadata
                )
                : {};

        this.session =
            this.createEmptySession();

        this.session.metadata =
            metadata;

        this.commit("reset");

        return this.snapshot;
    }

    assertActive() {
        if (
            this.session.status !==
            SessionStatus.ACTIVE
        ) {
            throw new Error(
                "Session is not active."
            );
        }
    }

    touch() {
        this.session.updatedAt =
            this.clock();
    }

    addRound(round) {
        this.assertActive();

        const record =
            normalizeRecord(
                round,
                "round"
            );

        record.sessionIndex =
            this.session.rounds.length;

        record.recordedAt =
            record.recordedAt ??
            this.clock();

        this.session.rounds.push(
            record
        );

        this.touch();
        this.commit("round:add", record);

        return cloneValue(record);
    }

    addAnalysis(analysis) {
        this.assertActive();

        const record =
            normalizeRecord(
                analysis,
                "analysis"
            );

        record.sessionIndex =
            this.session.analyses.length;

        record.generatedAfterRound =
            record.generatedAfterRound ??
            this.session.rounds.length;

        record.recordedAt =
            record.recordedAt ??
            this.clock();

        this.session.analyses.push(
            record
        );

        this.touch();
        this.commit(
            "analysis:add",
            record
        );

        return cloneValue(record);
    }

    addBet(bet) {
        this.assertActive();

        const record =
            normalizeRecord(
                bet,
                "bet"
            );

        record.sessionIndex =
            this.session.bets.length;

        record.round =
            record.round ??
            record.roundNumber ??
            this.session.rounds.length;

        record.amount =
            Number.isFinite(
                record.amount
            )
                ? record.amount
                : 0;

        record.profit =
            Number.isFinite(
                record.profit
            )
                ? record.profit
                : 0;

        record.recordedAt =
            record.recordedAt ??
            this.clock();

        this.session.bets.push(
            record
        );

        this.touch();
        this.commit("bet:add", record);

        return cloneValue(record);
    }

    updateMetadata(metadata = {}) {
        if (!isObject(metadata)) {
            throw new TypeError(
                "metadata must be an object."
            );
        }

        this.session.metadata = {
            ...this.session.metadata,
            ...cloneValue(metadata)
        };

        this.touch();
        this.commit("metadata:update");

        return cloneValue(
            this.session.metadata
        );
    }

    removeLastRound() {
        this.assertActive();

        const removed =
            this.session.rounds.pop() ??
            null;

        if (removed) {
            this.touch();
            this.commit(
                "round:remove",
                removed
            );
        }

        return cloneValue(removed);
    }

    removeLastAnalysis() {
        this.assertActive();

        const removed =
            this.session.analyses.pop() ??
            null;

        if (removed) {
            this.touch();
            this.commit(
                "analysis:remove",
                removed
            );
        }

        return cloneValue(removed);
    }

    removeLastBet() {
        this.assertActive();

        const removed =
            this.session.bets.pop() ??
            null;

        if (removed) {
            this.touch();
            this.commit(
                "bet:remove",
                removed
            );
        }

        return cloneValue(removed);
    }

    clearRecords({
        rounds = true,
        analyses = true,
        bets = true
    } = {}) {
        if (rounds) {
            this.session.rounds = [];
        }

        if (analyses) {
            this.session.analyses = [];
        }

        if (bets) {
            this.session.bets = [];
        }

        this.touch();
        this.commit("records:clear");

        return this.snapshot;
    }

    export() {
        return this.snapshot;
    }

    import(data, {
        save = true
    } = {}) {
        if (!isObject(data)) {
            throw new TypeError(
                "Imported session must be an object."
            );
        }

        const status =
            Object.values(SessionStatus)
                .includes(data.status)
                ? data.status
                : SessionStatus.IDLE;

        this.session = {
            version:
                SESSION_STORE_VERSION,

            id:
                data.id ?? null,

            status,

            startedAt:
                data.startedAt ?? null,

            endedAt:
                data.endedAt ?? null,

            shoeNumber:
                data.shoeNumber ?? null,

            rounds:
                Array.isArray(data.rounds)
                    ? cloneValue(data.rounds)
                    : [],

            analyses:
                Array.isArray(data.analyses)
                    ? cloneValue(data.analyses)
                    : [],

            bets:
                Array.isArray(data.bets)
                    ? cloneValue(data.bets)
                    : [],

            metadata:
                isObject(data.metadata)
                    ? cloneValue(
                        data.metadata
                    )
                    : {},

            createdAt:
                data.createdAt ??
                this.clock(),

            updatedAt:
                data.updatedAt ??
                this.clock()
        };

        if (save) {
            this.save();
        }

        this.emit("import");

        return this.snapshot;
    }

    save() {
        if (!this.storage) {
            return false;
        }

        this.storage.setItem(
            this.storageKey,
            JSON.stringify(
                this.session
            )
        );

        this.saveCount++;

        this.emit("save");

        return true;
    }

    load() {
        if (!this.storage) {
            return null;
        }

        const raw =
            this.storage.getItem(
                this.storageKey
            );

        if (!raw) {
            return null;
        }

        let parsed;

        try {
            parsed =
                JSON.parse(raw);
        }
        catch (error) {
            throw new Error(
                `Session storage contains invalid JSON: ${error.message}`
            );
        }

        this.loadCount++;

        return this.import(
            parsed,
            {
                save: false
            }
        );
    }

    removeSaved() {
        if (!this.storage) {
            return false;
        }

        this.storage.removeItem(
            this.storageKey
        );

        this.emit("storage:remove");

        return true;
    }

    commit(type, payload = null) {
        if (this.autoSave) {
            this.save();
        }

        this.emit(
            type,
            payload
        );
    }

    subscribe(listener) {
        if (typeof listener !== "function") {
            throw new TypeError(
                "listener must be a function."
            );
        }

        this.listeners.add(
            listener
        );

        return () => {
            this.listeners.delete(
                listener
            );
        };
    }

    emit(type, payload = null) {
        const event = {
            type,
            payload:
                cloneValue(payload),
            session:
                this.snapshot,
            timestamp:
                this.clock()
        };

        for (const listener of this.listeners) {
            listener(event);
        }
    }

    get snapshot() {
        return cloneValue(
            this.session
        );
    }

    get isActive() {
        return (
            this.session.status ===
            SessionStatus.ACTIVE
        );
    }

    get isEnded() {
        return (
            this.session.status ===
            SessionStatus.ENDED
        );
    }

    get roundCount() {
        return this.session.rounds.length;
    }

    get analysisCount() {
        return this.session.analyses.length;
    }

    get betCount() {
        return this.session.bets.length;
    }

    get summary() {
        return {
            version:
                SESSION_STORE_VERSION,

            id:
                this.session.id,

            status:
                this.session.status,

            active:
                this.isActive,

            ended:
                this.isEnded,

            rounds:
                this.roundCount,

            analyses:
                this.analysisCount,

            bets:
                this.betCount,

            startedAt:
                this.session.startedAt,

            endedAt:
                this.session.endedAt,

            shoeNumber:
                this.session.shoeNumber,

            saveCount:
                this.saveCount,

            loadCount:
                this.loadCount,

            hasStorage:
                Boolean(
                    this.storage
                )
        };
    }
}
