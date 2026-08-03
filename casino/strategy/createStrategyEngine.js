/**
 * Baccarat Analyzer V6.9
 * casino/strategy/createStrategyEngine.js
 */

import StrategyEngine
    from "./StrategyEngine.js";


export const STRATEGY_ENGINE_FACTORY_VERSION = "6.9.0";


export default function createStrategyEngine(options = {}) {
    return new StrategyEngine(
        options
    );
}
