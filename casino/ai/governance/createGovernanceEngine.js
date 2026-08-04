/**
 * Baccarat Analyzer V7.7
 * casino/ai/governance/createGovernanceEngine.js
 */

import GovernanceEngine
    from "./GovernanceEngine.js";


export const GOVERNANCE_ENGINE_FACTORY_VERSION = "7.7.0";


export default function createGovernanceEngine(options = {}) {
    return new GovernanceEngine(
        options
    );
}
