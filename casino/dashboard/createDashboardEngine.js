/**
 * Baccarat Analyzer V6.6
 * casino/dashboard/createDashboardEngine.js
 */

import DashboardEngine
    from "./DashboardEngine.js";


export const DASHBOARD_ENGINE_FACTORY_VERSION = "6.6.0";


export default function createDashboardEngine(options = {}) {
    return new DashboardEngine(
        options
    );
}
