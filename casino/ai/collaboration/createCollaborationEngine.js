/**
 * Baccarat Analyzer V7.6
 * casino/ai/collaboration/createCollaborationEngine.js
 */

import CollaborationEngine
    from "./CollaborationEngine.js";


export const COLLABORATION_ENGINE_FACTORY_VERSION = "7.6.0";


export default function createCollaborationEngine(options = {}) {
    return new CollaborationEngine(
        options
    );
}
