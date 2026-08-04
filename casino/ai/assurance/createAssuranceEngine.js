/**
 * Baccarat Analyzer V7.8
 * casino/ai/assurance/createAssuranceEngine.js
 */

import AssuranceEngine
    from "./AssuranceEngine.js";


export const ASSURANCE_ENGINE_FACTORY_VERSION = "7.8.0";


export default function createAssuranceEngine(options = {}) {
    return new AssuranceEngine(
        options
    );
}
