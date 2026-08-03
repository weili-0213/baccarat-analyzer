/**
 * Baccarat Analyzer V5.4
 * runtime/scheduler/RuntimeTicker.js
 *
 * Timer abstraction for the Runtime Scheduler.
 */

export const RUNTIME_TICKER_VERSION = "5.4.0";

export const RuntimeTickerMode = Object.freeze({
    INTERVAL: "interval",
    FRAME: "frame",
    MANUAL: "manual"
});

export default class RuntimeTicker {
    constructor({
        mode = RuntimeTickerMode.INTERVAL,
        interval = 100,
        scheduler = globalThis,
        clock = () => Date.now(),
        onTick = null
    } = {}) {
        if (
            !Object.values(RuntimeTickerMode)
                .includes(mode)
        ) {
            throw new Error(
                `Unknown ticker mode: ${mode}`
            );
        }

        if (
            !Number.isFinite(interval) ||
            interval < 0
        ) {
            throw new RangeError(
                "Ticker interval must be zero or greater."
            );
        }

        this.mode = mode;
        this.interval = interval;
        this.scheduler = scheduler;
        this.clock = clock;
        this.onTick = onTick;

        this.running = false;
        this.paused = false;
        this.handle = null;
        this.tickCount = 0;
        this.startedAt = null;
        this.lastTickAt = null;
    }

    start() {
        if (this.running) {
            return this;
        }

        this.running = true;
        this.paused = false;
        this.startedAt = this.clock();

        this.scheduleNext();

        return this;
    }

    stop() {
        this.cancel();
        this.running = false;
        this.paused = false;

        return this;
    }

    pause() {
        if (!this.running) {
            return this;
        }

        this.cancel();
        this.paused = true;

        return this;
    }

    resume() {
        if (!this.running) {
            return this.start();
        }

        if (!this.paused) {
            return this;
        }

        this.paused = false;
        this.scheduleNext();

        return this;
    }

    setInterval(value) {
        if (
            !Number.isFinite(value) ||
            value < 0
        ) {
            throw new RangeError(
                "Ticker interval must be zero or greater."
            );
        }

        this.interval = value;

        if (
            this.running &&
            !this.paused
        ) {
            this.cancel();
            this.scheduleNext();
        }

        return this;
    }

    scheduleNext() {
        if (
            !this.running ||
            this.paused ||
            this.mode ===
                RuntimeTickerMode.MANUAL
        ) {
            return;
        }

        if (
            this.mode ===
                RuntimeTickerMode.FRAME &&
            typeof this.scheduler
                .requestAnimationFrame ===
                "function"
        ) {
            this.handle =
                this.scheduler
                    .requestAnimationFrame(
                        timestamp => {
                            this.handle = null;
                            this.tick(timestamp);
                            this.scheduleNext();
                        }
                    );

            return;
        }

        this.handle =
            this.scheduler.setTimeout(
                () => {
                    this.handle = null;
                    this.tick();
                    this.scheduleNext();
                },
                this.interval
            );
    }

    cancel() {
        if (this.handle === null) {
            return;
        }

        if (
            this.mode ===
                RuntimeTickerMode.FRAME &&
            typeof this.scheduler
                .cancelAnimationFrame ===
                "function"
        ) {
            this.scheduler
                .cancelAnimationFrame(
                    this.handle
                );
        }
        else {
            this.scheduler.clearTimeout(
                this.handle
            );
        }

        this.handle = null;
    }

    tick(timestamp = this.clock()) {
        if (
            this.paused ||
            !this.running
        ) {
            return null;
        }

        this.tickCount++;
        this.lastTickAt = timestamp;

        return this.onTick?.({
            timestamp,
            tickCount:
                this.tickCount,
            elapsed:
                timestamp -
                this.startedAt
        });
    }

    manualTick(timestamp = this.clock()) {
        if (!this.running) {
            this.running = true;
            this.startedAt =
                timestamp;
        }

        return this.tick(timestamp);
    }

    destroy() {
        this.stop();
        this.onTick = null;

        return this;
    }

    get summary() {
        return {
            version:
                RUNTIME_TICKER_VERSION,
            mode:
                this.mode,
            interval:
                this.interval,
            running:
                this.running,
            paused:
                this.paused,
            tickCount:
                this.tickCount,
            startedAt:
                this.startedAt,
            lastTickAt:
                this.lastTickAt
        };
    }
}
