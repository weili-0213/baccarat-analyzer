/**
 * Baccarat Analyzer V6.8
 * casino/bet/createBetEngine.js
 */

import BetEngine
    from "./BetEngine.js";


export const BET_ENGINE_FACTORY_VERSION = "6.8.0";


export default function createBetEngine(options = {}) {
    return new BetEngine(
        options
    );
}
