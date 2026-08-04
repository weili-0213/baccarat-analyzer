/**
 * Baccarat Analyzer V7.7
 * runtime/adapters/GovernanceRuntimeAdapter.js
 */

export const GOVERNANCE_RUNTIME_ADAPTER_VERSION = "7.7.0";

export default class GovernanceRuntimeAdapter {
    constructor({
        governance
    } = {}) {
        if (
            !governance ||
            typeof governance.review !==
                "function"
        ) {
            throw new TypeError(
                "GovernanceRuntimeAdapter requires a GovernanceEngine-compatible object."
            );
        }

        this.governance =
            governance;
    }

    review(input = {}) {
        return this.governance.review(
            input
        );
    }

    registerPolicy(config) {
        return this.governance
            .registerPolicy(
                config
            );
    }

    grant(subject, permission) {
        this.governance.grant(
            subject,
            permission
        );

        return this;
    }

    revoke(subject, permission) {
        return this.governance.revoke(
            subject,
            permission
        );
    }

    pause() {
        return this.governance.pause();
    }

    resume() {
        return this.governance.resume();
    }

    reset() {
        return this.governance.reset();
    }

    destroy() {
        return this.governance.destroy();
    }

    get summary() {
        return {
            version:
                GOVERNANCE_RUNTIME_ADAPTER_VERSION,

            governance:
                this.governance.summary
        };
    }
}
