/**
 * Baccarat Analyzer V9.1
 * ui/ai/AIUIEventBinder.js
 */
export const AI_UI_EVENT_BINDER_VERSION = "9.1.0";

export default class AIUIEventBinder {
    constructor({
        root = null
    } = {}) {
        this.root =
            root ??
            (
                typeof document !==
                    "undefined"
                    ? document
                    : null
            );

        this.bindings =
            [];
    }

    bind({
        selector,
        event = "click",
        handler
    } = {}) {
        if (
            typeof handler !==
            "function"
        ) {
            throw new TypeError(
                "AIUIEventBinder handler must be a function."
            );
        }

        const element =
            this.root?.querySelector?.(
                selector
            ) ??
            null;

        if (!element) {
            return null;
        }

        element.addEventListener(
            event,
            handler
        );

        const binding = {
            element,
            event,
            handler
        };

        this.bindings.push(
            binding
        );

        return binding;
    }

    unbindAll() {
        for (const binding of this.bindings) {
            binding.element
                .removeEventListener(
                    binding.event,
                    binding.handler
                );
        }

        this.bindings = [];

        return this;
    }

    get summary() {
        return {
            version:
                AI_UI_EVENT_BINDER_VERSION,
            bindingCount:
                this.bindings.length
        };
    }
}
