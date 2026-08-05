/**
 * Baccarat Analyzer V9.0
 * casino/ai/os/SystemHealthMonitor.js
 */
export const SYSTEM_HEALTH_MONITOR_VERSION = "9.0.0";

export default class SystemHealthMonitor {
    check(registry) {
        const engines = registry.all().map(record => {
            const summary =
                record.adapter?.summary ??
                record.engine?.summary ??
                {};

            const destroyed =
                summary.destroyed === true ||
                summary[
                    Object.keys(summary)[0]
                ]?.destroyed === true;

            return {
                engineId: record.engineId,
                required: record.required,
                available:
                    Boolean(
                        record.adapter ??
                        record.engine
                    ),
                destroyed,
                healthy:
                    Boolean(
                        record.adapter ??
                        record.engine
                    ) &&
                    !destroyed
            };
        });

        const missingRequired =
            engines.filter(
                engine =>
                    engine.required &&
                    !engine.healthy
            );

        return {
            healthy:
                missingRequired.length === 0,
            engines,
            missingRequired:
                missingRequired.map(
                    engine =>
                        engine.engineId
                )
        };
    }

    get summary() {
        return {
            version: SYSTEM_HEALTH_MONITOR_VERSION
        };
    }
}
