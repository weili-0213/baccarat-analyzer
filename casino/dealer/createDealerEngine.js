/**
 * Baccarat Analyzer V6.1
 * casino/dealer/createDealerEngine.js
 */

import DealerEngine
    from "./DealerEngine.js";


export const DEALER_ENGINE_FACTORY_VERSION = "6.1.0";


export default function createDealerEngine(options = {}) {
    return new DealerEngine(
        options
    );
}
