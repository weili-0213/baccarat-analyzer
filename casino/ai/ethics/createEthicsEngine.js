/**
 * Baccarat Analyzer V8.6
 * casino/ai/ethics/createEthicsEngine.js
 */

import EthicsEngine
    from "./EthicsEngine.js";


export const ETHICS_ENGINE_FACTORY_VERSION = "8.6.0";


export default function createEthicsEngine(options = {}) {
    return new EthicsEngine(
        options
    );
}
