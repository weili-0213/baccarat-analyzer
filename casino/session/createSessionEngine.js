/**
 * Baccarat Analyzer V6.4
 * casino/session/createSessionEngine.js
 */

import SessionEngine
    from "./SessionEngine.js";


export const SESSION_ENGINE_FACTORY_VERSION = "6.4.0";


export default function createSessionEngine(options = {}) {
    return new SessionEngine(
        options
    );
}
