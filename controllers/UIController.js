/**
 * Baccarat Analyzer V3.4.2
 * controllers/UIController.js
 *
 * Dashboard UI state：
 * - message / busy
 * - 快速／完整模式
 * - 手機分區
 * - 路單頁籤
 * - 燒牌選擇
 * - 快速輸入模式
 */

export const UI_CONTROLLER_VERSION = "3.4.2";

const STORAGE_KEY = "baccarat.dashboardMode";

export default class UIController {
    constructor({
        modeValues,
        defaultMode,
        defaultSection,
        defaultRoad = "beadRoad",
        quickInputMode
    } = {}) {
        this.modeValues = Array.isArray(modeValues)
            ? [...modeValues]
            : [];

        this.state = {
            busy: false,
            message: "",
            messageType: "",
            selectedRank: "A",
            selectedSuit: "S",
            mode: this.loadMode(defaultMode),
            activeRoad: defaultRoad,
            mobileSection: defaultSection,
            quickInputMode
        };
    }

    loadMode(defaultMode) {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);

            if (this.modeValues.includes(saved)) {
                return saved;
            }
        }
        catch {
            // localStorage unavailable
        }

        return defaultMode;
    }

    saveMode(mode) {
        try {
            localStorage.setItem(STORAGE_KEY, mode);
        }
        catch {
            // localStorage unavailable
        }
    }

    setBusy(value) {
        this.state.busy = Boolean(value);
        return this;
    }

    setMessage(message, type = "info") {
        this.state.message = String(message ?? "");
        this.state.messageType = type;
        return this;
    }

    clearMessage() {
        this.state.message = "";
        this.state.messageType = "";
        return this;
    }

    setMode(mode) {
        if (!this.modeValues.includes(mode)) {
            throw new Error(`Unknown dashboard mode: ${mode}`);
        }

        this.state.mode = mode;
        this.saveMode(mode);
        return this;
    }

    setMobileSection(section, allowedSections) {
        if (!allowedSections.includes(section)) {
            throw new Error(`Unknown dashboard section: ${section}`);
        }

        this.state.mobileSection = section;
        return this;
    }

    setRoad(road) {
        this.state.activeRoad = road || "beadRoad";
        return this;
    }

    setBurnRank(rank) {
        this.state.selectedRank = rank;
        return this;
    }

    setBurnSuit(suit) {
        this.state.selectedSuit = suit;
        return this;
    }

    get busy() {
        return this.state.busy;
    }

    get summary() {
        return {
            version: UI_CONTROLLER_VERSION,
            ...this.state
        };
    }
}
