/**
 * Baccarat Analyzer V9.1
 * ui/ai/createAIUIIntegration.js
 */
import AIUIController
    from "./AIUIController.js";

import AIUIStore
    from "./AIUIStore.js";

import AIUIViewModel
    from "./AIUIViewModel.js";

import AIUIRenderer
    from "./AIUIRenderer.js";

import AIUIEventBinder
    from "./AIUIEventBinder.js";


export const AI_UI_INTEGRATION_FACTORY_VERSION = "9.1.0";


export default function createAIUIIntegration({
    uiBridge,
    root = null,
    selectors = {},
    eventBus = null
} = {}) {
    const store =
        new AIUIStore();

    const viewModel =
        new AIUIViewModel();

    const renderer =
        new AIUIRenderer({
            root,
            selectors
        });

    const binder =
        new AIUIEventBinder({
            root
        });

    return new AIUIController({
        uiBridge,
        store,
        viewModel,
        renderer,
        binder,
        eventBus
    });
}
