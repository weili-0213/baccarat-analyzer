/**
 * Baccarat Analyzer V6.0
 * casino/createCasinoEngine.js
 */

import CasinoEngine
    from "./CasinoEngine.js";


export const CASINO_ENGINE_FACTORY_VERSION = "6.0.0";


export default function createCasinoEngine(options = {}) {
    return new CasinoEngine(
        options
    );
}
