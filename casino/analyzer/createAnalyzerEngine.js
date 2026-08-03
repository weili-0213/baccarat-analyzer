/**
 * Baccarat Analyzer V6.5
 * casino/analyzer/createAnalyzerEngine.js
 */

import AnalyzerEngine
    from "./AnalyzerEngine.js";


export const ANALYZER_ENGINE_FACTORY_VERSION = "6.5.0";


export default function createAnalyzerEngine(options = {}) {
    return new AnalyzerEngine(
        options
    );
}
