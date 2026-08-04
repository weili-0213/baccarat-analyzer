/**
 * Baccarat Analyzer V7.7
 * casino/ai/governance/PermissionManager.js
 */

export const PERMISSION_MANAGER_VERSION = "7.7.0";

export default class PermissionManager {
    constructor() {
        this.grants = new Map();
    }

    grant(subject, permission) {
        const set =
            this.grants.get(subject) ??
            new Set();

        set.add(permission);
        this.grants.set(subject, set);

        return this;
    }

    revoke(subject, permission) {
        const set =
            this.grants.get(subject);

        if (!set) {
            return false;
        }

        const removed =
            set.delete(permission);

        if (set.size === 0) {
            this.grants.delete(subject);
        }

        return removed;
    }

    has(subject, permission) {
        return Boolean(
            this.grants.get(subject)
                ?.has(permission)
        );
    }

    list(subject) {
        return [
            ...(this.grants.get(subject) ?? [])
        ];
    }

    clear() {
        this.grants.clear();
        return this;
    }

    get summary() {
        return {
            version: PERMISSION_MANAGER_VERSION,
            subjectCount: this.grants.size,
            grantCount: [...this.grants.values()]
                .reduce(
                    (sum, set) =>
                        sum + set.size,
                    0
                )
        };
    }
}
