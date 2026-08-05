/**
 * Baccarat Analyzer V8.5
 * casino/ai/alignment/createValueAlignmentEngine.js
 */

import ValueAlignmentEngine
    from "./ValueAlignmentEngine.js";


export const VALUE_ALIGNMENT_ENGINE_FACTORY_VERSION = "8.5.0";


export default function createValueAlignmentEngine(options = {}) {
    return new ValueAlignmentEngine(
        options
    );
}
