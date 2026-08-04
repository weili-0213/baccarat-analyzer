/**
 * Baccarat Analyzer V7.9
 * casino/ai/optimization/ParameterSpace.js
 */

export const PARAMETER_SPACE_VERSION = "7.9.0";

export default class ParameterSpace {
    constructor() {
        this.parameters = new Map();
    }

    define({
        name,
        current,
        min = null,
        max = null,
        step = null,
        values = null,
        metadata = {}
    } = {}) {
        if (
            typeof name !== "string" ||
            name.length === 0
        ) {
            throw new TypeError(
                "Parameter name is required."
            );
        }

        const definition = {
            name,
            current,
            min,
            max,
            step,
            values:
                Array.isArray(values)
                    ? [...values]
                    : null,
            metadata: { ...metadata }
        };

        this.parameters.set(
            name,
            definition
        );

        return definition;
    }

    get(name) {
        return this.parameters.get(name) ?? null;
    }

    current() {
        const output = {};

        for (const parameter of this.parameters.values()) {
            output[parameter.name] = parameter.current;
        }

        return output;
    }

    update(name, value) {
        const parameter = this.get(name);

        if (!parameter) {
            return false;
        }

        parameter.current = value;
        return true;
    }

    clear() {
        this.parameters.clear();
        return this;
    }

    get summary() {
        return {
            version: PARAMETER_SPACE_VERSION,
            count: this.parameters.size,
            current: this.current()
        };
    }
}
