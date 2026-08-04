/**
 * Baccarat Analyzer V7.8
 * casino/ai/assurance/CheckRegistry.js
 */

export const CHECK_REGISTRY_VERSION = "7.8.0";

export default class CheckRegistry {
    constructor() {
        this.checks = new Map();
    }

    register(check) {
        if (!check?.checkId) {
            throw new TypeError(
                "CheckRegistry requires checkId."
            );
        }

        this.checks.set(
            check.checkId,
            check
        );

        return check;
    }

    get(checkId) {
        return this.checks.get(checkId) ?? null;
    }

    all() {
        return [...this.checks.values()];
    }

    enable(checkId) {
        const check = this.get(checkId);

        if (!check) {
            return false;
        }

        check.enabled = true;
        return true;
    }

    disable(checkId) {
        const check = this.get(checkId);

        if (!check) {
            return false;
        }

        check.enabled = false;
        return true;
    }

    unregister(checkId) {
        return this.checks.delete(checkId);
    }

    clear() {
        this.checks.clear();
        return this;
    }

    get summary() {
        return {
            version: CHECK_REGISTRY_VERSION,
            count: this.checks.size,
            enabledCount: [...this.checks.values()]
                .filter(check => check.enabled)
                .length
        };
    }
}
