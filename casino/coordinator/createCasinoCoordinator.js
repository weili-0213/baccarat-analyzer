/**
 * Baccarat Analyzer V6.7
 * casino/coordinator/createCasinoCoordinator.js
 */

import CasinoCoordinator
    from "./CasinoCoordinator.js";


export const CASINO_COORDINATOR_FACTORY_VERSION = "6.7.0";


export default function createCasinoCoordinator(options = {}) {
    return new CasinoCoordinator(
        options
    );
}
