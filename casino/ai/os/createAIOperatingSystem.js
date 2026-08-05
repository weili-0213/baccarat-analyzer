/**
 * Baccarat Analyzer V9.0
 * casino/ai/os/createAIOperatingSystem.js
 */
import AIOperatingSystem
    from "./AIOperatingSystem.js";

export const AI_OPERATING_SYSTEM_FACTORY_VERSION = "9.0.0";

export default function createAIOperatingSystem(options = {}) {
    return new AIOperatingSystem(
        options
    );
}
