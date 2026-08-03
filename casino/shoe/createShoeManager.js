/**
 * Baccarat Analyzer V6.3
 * casino/shoe/createShoeManager.js
 */

import ShoeManager
    from "./ShoeManager.js";


export const SHOE_MANAGER_FACTORY_VERSION = "6.3.0";


export default function createShoeManager(options = {}) {
    return new ShoeManager(
        options
    );
}
