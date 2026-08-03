/**
 * Baccarat Analyzer V6.2
 * casino/round/createRoundEngine.js
 */

import RoundEngine
    from "./RoundEngine.js";


export const ROUND_ENGINE_FACTORY_VERSION = "6.2.0";


export default function createRoundEngine(options = {}) {
    return new RoundEngine(
        options
    );
}
