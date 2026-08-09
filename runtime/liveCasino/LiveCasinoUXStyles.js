/**
 * Baccarat Analyzer V10.5.4
 * Path: runtime/liveCasino/LiveCasinoUXStyles.js
 * Purpose: Compact single-screen live casino UX styles.
 */
export const LIVE_CASINO_UX_STYLES_VERSION = "10.4.5";
export const AI_LIVE_DECISION_STYLES_VERSION = "10.5.0";
export const RESPONSIVE_LIVE_DECISION_UX_VERSION = "10.5.1";
export const AI_LIVE_DECISION_EVIDENCE_STYLES_VERSION = "10.5.2";
export const SIGNAL_TREND_MONITOR_STYLES_VERSION = "10.5.3";
export const EXACT_OPPORTUNITY_CONFIRMATION_STYLES_VERSION = "10.5.4";

export const LIVE_CASINO_UX_STYLE_ID =
    "baccarat-live-casino-v1044";

export const LIVE_CASINO_UX_CSS = `
[data-live-casino-v1044] {
    --player: #2f7cff;
    --player-soft: rgba(47,124,255,.16);
    --banker: #ef4444;
    --banker-soft: rgba(239,68,68,.16);
    --tie: #22c55e;
    --surface: rgba(0,0,0,.12);
    --line: rgba(255,255,255,.16);
}

[data-live-casino-v1044] .dashboardHeader {
    min-height: auto !important;
    padding-block: .5rem !important;
    gap: .6rem !important;
}

[data-live-casino-v1044] .dashboardHeaderActions {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: .35rem !important;
}

[data-live-casino-v1044] button[data-mode],
[data-live-casino-v1044] button[data-action="set-mode"],
[data-live-casino-v1044] .dashboardHeaderActions .button,
[data-live-casino-v1044] button[data-action="new-shoe"] {
    width: auto !important;
    min-height: 34px !important;
    padding: .35rem .75rem !important;
}

[data-live-casino-v1044] .button.full,
[data-live-casino-v1044] .v3RoundPanel .button {
    min-height: 38px !important;
    padding: .45rem .8rem !important;
}

[data-live-casino-v1044] .v3RoundActions {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: .4rem !important;
}

[data-live-casino-v1044] .v3RoundActions .button {
    width: auto !important;
    flex: 1 1 auto !important;
}


[data-live-casino-v1044] .v3RecommendationPanel {
    display: none !important;
}

[data-live-casino-v1044] .v1044Decision {
    position: static;
    z-index: 20;
    display: grid;
    grid-template-columns: minmax(220px,1.1fr) repeat(3,minmax(110px,.7fr)) minmax(180px,.9fr);
    gap: .45rem;
    align-items: stretch;
    padding: .55rem;
    margin: 0 0 .6rem;
    border: 1px solid var(--line);
    border-radius: 12px;
    background: rgba(3,54,31,.96);
    backdrop-filter: blur(8px);
    box-shadow: 0 8px 24px rgba(0,0,0,.18);
}

[data-live-casino-v1044] .v1044DecisionCard {
    padding: .55rem .65rem;
    border-radius: 9px;
    background: var(--surface);
}

[data-live-casino-v1044] .v1044DecisionMain strong {
    display: block;
    font-size: 1.25rem;
}

[data-live-casino-v105] .v105LiveDecision {
    grid-template-columns: minmax(340px,1.45fr) repeat(3,minmax(105px,.62fr)) minmax(180px,.82fr);
}

[data-live-casino-v105] .v105DecisionHeadline {
    display: flex;
    align-items: baseline;
    gap: .35rem;
}

[data-live-casino-v105] .v105DecisionHeadline strong {
    display: inline;
    font-size: 1.25rem !important;
}

[data-live-casino-v105] .v1054ConfirmationState {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: .18rem .45rem;
    margin: .2rem 0 .28rem;
    padding: .25rem .4rem;
    border: 1px solid rgba(96,165,250,.42);
    border-radius: 7px;
    color: #bfdbfe;
    background: rgba(59,130,246,.12);
    line-height: 1.3;
}

[data-live-casino-v105] .v1054ConfirmationState strong {
    display: inline !important;
    font-size: .8rem !important;
}

[data-live-casino-v105] .v1054ConfirmationState small {
    opacity: .86;
}

[data-live-casino-v105] [data-confirmation-state="confirming"] .v1054ConfirmationState {
    color: #fde68a;
    border-color: rgba(245,158,11,.5);
    background: rgba(245,158,11,.12);
}

[data-live-casino-v105] [data-confirmation-state="confirmed"] .v1054ConfirmationState {
    color: #bbf7d0;
    border-color: rgba(74,222,128,.5);
    background: rgba(34,197,94,.12);
}

[data-live-casino-v105] [data-confirmation-state="failed"] .v1054ConfirmationState {
    color: #fecaca;
    border-color: rgba(248,113,113,.5);
    background: rgba(239,68,68,.12);
}

[data-live-casino-v105] .v1054ResultReplacement {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: .2rem .45rem;
    margin-top: .22rem;
    padding: .24rem .38rem;
    border-radius: 7px;
    color: #e2e8f0;
    background: rgba(15,23,42,.28);
    font-size: .74rem;
    line-height: 1.35;
}

[data-live-casino-v105] .v1054ResultReplacement small {
    color: #86efac;
}

[data-live-casino-v105] [data-decision-provisional="true"] .v1044DecisionMain {
    border-left: 4px solid #60a5fa;
}

[data-live-casino-v105] .v105DecisionBadges {
    display: flex;
    flex-wrap: wrap;
    gap: .3rem .65rem;
    margin: .2rem 0;
}

[data-live-casino-v105] .v105DecisionBadges span {
    padding: .1rem .38rem;
    border: 1px solid rgba(255,255,255,.14);
    border-radius: 999px;
    background: rgba(0,0,0,.12);
    font-size: .8rem;
}

[data-live-casino-v105] .v105DecisionMeta {
    font-size: .82rem;
}

[data-live-casino-v105] .v105DecisionEvidence {
    margin-top: .18rem;
    font-size: .78rem;
    line-height: 1.35;
    opacity: .9;
}

[data-live-casino-v105] [data-decision-blocker],
[data-live-casino-v105] [data-decision-pass] {
    display: block;
    margin-top: .2rem;
    padding: .18rem .35rem;
    border-radius: 6px;
    line-height: 1.3;
}

[data-live-casino-v105] [data-decision-blocker] {
    color: #ffe08a;
    background: rgba(245,158,11,.12);
}

[data-live-casino-v105] [data-decision-pass] {
    color: #86efac;
    background: rgba(34,197,94,.12);
}

[data-live-casino-v105] [data-decision-reason] {
    display: block;
    margin-top: .18rem;
    line-height: 1.3;
}

[data-live-casino-v105] .v1053Opportunity {
    display: flex;
    flex-wrap: wrap;
    gap: .25rem .55rem;
    margin-top: .25rem;
    padding: .25rem .35rem;
    border: 1px solid rgba(255,255,255,.12);
    border-radius: 7px;
    background: rgba(0,0,0,.13);
    font-size: .76rem;
    line-height: 1.3;
}

[data-live-casino-v105] .v1053Opportunity span {
    white-space: nowrap;
}

[data-live-casino-v105] .v1053Opportunity[data-opportunity-state="actionable"] {
    color: #86efac;
    border-color: rgba(74,222,128,.45);
    background: rgba(34,197,94,.12);
}

[data-live-casino-v105] .v1053Opportunity[data-opportunity-state="positive-blocked"],
[data-live-casino-v105] .v1053Opportunity[data-opportunity-state="approaching"] {
    color: #fde68a;
    border-color: rgba(245,158,11,.42);
    background: rgba(245,158,11,.10);
}

[data-live-casino-v105] .v1053TrendSeries {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: .2rem .3rem;
    margin-top: .22rem;
    font-size: .7rem;
}

[data-live-casino-v105] .v1053TrendSeriesLabel {
    opacity: .76;
}

[data-live-casino-v105] .v1053TrendPoint {
    display: inline-flex;
    gap: .18rem;
    padding: .08rem .28rem;
    border-radius: 999px;
    color: #cbd5e1;
    background: rgba(148,163,184,.12);
}

[data-live-casino-v105] .v1053TrendPoint[data-trend-positive="true"] {
    color: #86efac;
    background: rgba(34,197,94,.14);
}

[data-live-casino-v105] .v1053TrendEmpty {
    opacity: .68;
}

[data-live-casino-v105] [data-decision-category="positive-ev"] .v1044DecisionMain {
    border-left: 4px solid #4ade80;
}

[data-live-casino-v105] [data-decision-category="risk-too-high"] .v1044DecisionMain,
[data-live-casino-v105] [data-decision-category="weak-signal"] .v1044DecisionMain {
    border-left: 4px solid #f59e0b;
}

[data-live-casino-v105] [data-decision-category="relative-best"] .v1044DecisionMain {
    border-left: 4px solid #60a5fa;
}

[data-live-casino-v105] [data-decision-category="no-edge"] .v1044DecisionMain,
[data-live-casino-v105] [data-decision-category="insufficient-data"] .v1044DecisionMain {
    border-left: 4px solid #94a3b8;
}

[data-live-casino-v105] .v105DecisionDock {
    position: fixed;
    left: 50%;
    bottom: max(.55rem, env(safe-area-inset-bottom));
    z-index: 80;
    display: grid;
    grid-template-columns: auto auto auto auto auto minmax(120px, 1fr);
    align-items: center;
    gap: .35rem .65rem;
    width: min(calc(100% - 1rem), 780px);
    box-sizing: border-box;
    min-width: 0;
    padding: .55rem .7rem;
    border: 1px solid rgba(255,255,255,.24);
    border-left: 5px solid #60a5fa;
    border-radius: 12px;
    color: #fff;
    background: rgba(2,42,25,.96);
    box-shadow: 0 10px 30px rgba(0,0,0,.42);
    backdrop-filter: blur(10px);
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transform: translate(-50%, calc(100% + 1rem));
    transition:
        opacity .16s ease,
        transform .16s ease,
        visibility .16s ease;
}

[data-live-casino-v105] .v105DecisionDock.v105DecisionDockVisible {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transform: translate(-50%, 0);
}

[data-live-casino-v105] .v105DecisionDock[data-decision-category="positive-ev"] {
    border-left-color: #4ade80;
}

[data-live-casino-v105] .v105DecisionDock[data-decision-provisional="true"] {
    border-left-color: #60a5fa;
}

[data-live-casino-v105] .v105DecisionDock[data-confirmation-state="confirming"] {
    border-left-color: #f59e0b;
}

[data-live-casino-v105] .v105DecisionDock[data-confirmation-state="failed"] {
    border-left-color: #ef4444;
}

[data-live-casino-v105] .v105DecisionDock[data-opportunity-state="approaching"],
[data-live-casino-v105] .v105DecisionDock[data-opportunity-state="positive-blocked"] {
    border-left-color: #f59e0b;
}

[data-live-casino-v105] .v105DecisionDock[data-opportunity-state="actionable"] {
    border-left-color: #4ade80;
}

[data-live-casino-v105] .v105DecisionDock[data-decision-category="risk-too-high"],
[data-live-casino-v105] .v105DecisionDock[data-decision-category="weak-signal"] {
    border-left-color: #f59e0b;
}

[data-live-casino-v105] .v105DecisionDock[data-decision-category="no-edge"],
[data-live-casino-v105] .v105DecisionDock[data-decision-category="insufficient-data"] {
    border-left-color: #94a3b8;
}

[data-live-casino-v105] .v105DecisionDockLabel {
    font-size: .72rem;
    opacity: .72;
}

[data-live-casino-v105] .v105DecisionDockPick {
    white-space: nowrap;
    color: #ffe06a;
}

[data-live-casino-v105] .v105DecisionDockAction,
[data-live-casino-v105] .v105DecisionDockConfidence,
[data-live-casino-v105] .v105DecisionDockAmount {
    white-space: nowrap;
    font-size: .8rem;
}

[data-live-casino-v105] .v105DecisionDockReason {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    opacity: .82;
}

[data-live-casino-v105] .v33InputZone,
[data-live-casino-v105] .v33InsightZone,
[data-live-casino-v105] .v33RoadZone,
[data-live-casino-v105] .v33HistoryZone {
    padding-bottom: calc(5.25rem + env(safe-area-inset-bottom)) !important;
    scroll-padding-bottom: calc(5.25rem + env(safe-area-inset-bottom));
}

[data-live-casino-v1044] .v1044Player {
    border-left: 4px solid var(--player);
    background: var(--player-soft);
}

[data-live-casino-v1044] .v1044Banker {
    border-left: 4px solid var(--banker);
    background: var(--banker-soft);
}

[data-live-casino-v1044] .v1044Tie {
    border-left: 4px solid var(--tie);
}

[data-live-casino-v1044] .v1044Player strong,
[data-live-casino-v1044] [data-side="player"],
[data-live-casino-v1044] .player {
    color: #8db8ff !important;
}

[data-live-casino-v1044] .v1044Banker strong,
[data-live-casino-v1044] [data-side="banker"],
[data-live-casino-v1044] .banker {
    color: #ff9a9a !important;
}

[data-live-casino-v1044] .v1044Meta {
    font-size: .78rem;
    opacity: .85;
}

[data-live-casino-v1044] .v1044RoadSection.v1044Collapsed {
    display: none !important;
}

[data-live-casino-v1044] .v1044UtilityBar {
    display: flex;
    gap: .4rem;
    margin: .4rem 0;
}

[data-live-casino-v1044] .v1044UtilityBar button {
    width: auto !important;
    min-height: 32px !important;
    padding: .3rem .7rem !important;
}

[data-live-casino-v1044] [data-ai-closed-loop-panel].v1044AIHidden {
    display: none !important;
}

[data-live-casino-v1044] .dashboardCard {
    margin-bottom: .55rem !important;
}

[data-live-casino-v1044] .v3PanelHeader {
    margin-bottom: .45rem !important;
}



[data-live-casino-v1044] .v1044Header {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    gap: .6rem !important;
    padding: .45rem .7rem !important;
}

[data-live-casino-v1044] .v1044Brand h1 {
    margin: .08rem 0 0 !important;
    font-size: clamp(1.35rem, 2.4vw, 2rem) !important;
    line-height: 1.05 !important;
}

[data-live-casino-v1044] .v1044HeaderActions {
    display: flex !important;
    align-items: center !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    gap: .45rem !important;
}

[data-live-casino-v1044] .v1044ControlRow,
[data-live-casino-v1044] .v1044ModeSwitch {
    display: inline-flex !important;
    align-items: center !important;
    flex-direction: row !important;
    flex-wrap: nowrap !important;
    gap: .3rem !important;
}

[data-live-casino-v1044] .v1044ControlRow button,
[data-live-casino-v1044] .v1044NewShoe {
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    width: auto !important;
    min-width: 0 !important;
    min-height: 34px !important;
    margin: 0 !important;
    padding: .35rem .72rem !important;
    flex: 0 0 auto !important;
}

[data-live-casino-v1044] .v1044StatusStrip {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    flex-wrap: wrap !important;
    gap: .45rem .8rem !important;
    padding: .45rem .65rem !important;
}

[data-live-casino-v1044] .v1044ShoeMeta,
[data-live-casino-v1044] .v1044NextAnalysis {
    display: flex !important;
    align-items: center !important;
    flex-wrap: wrap !important;
    gap: .35rem .65rem !important;
}

[data-live-casino-v1044] .v1044ShoeMeta .v3StatusItem {
    display: inline-flex !important;
    align-items: baseline !important;
    gap: .22rem !important;
    min-width: 0 !important;
}

[data-live-casino-v1044] .v1044ShoeMeta .v3StatusItem span,
[data-live-casino-v1044] .v1044NextLabel {
    font-size: .72rem !important;
    opacity: .78 !important;
}

[data-live-casino-v1044] .v1044ShoeMeta .v3StatusItem strong {
    font-size: .9rem !important;
}

[data-live-casino-v1044] .v1044NextAnalysis {
    padding-left: .7rem !important;
    border-left: 1px solid var(--line) !important;
}

[data-live-casino-v1044] .v1044NextItem {
    display: inline-flex !important;
    align-items: baseline !important;
    gap: .25rem !important;
}

[data-live-casino-v1044] .v1044NextItem small {
    font-size: .72rem !important;
}

[data-live-casino-v1044] .v1044ErrorMessage {
    padding: .4rem .65rem !important;
    margin: 0 0 .45rem !important;
}

[data-live-casino-v1044] .v1044UnifiedFullAnalysis > section {
    min-width: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    margin-bottom: 0 !important;
}

[data-live-casino-v1044] .v1044UnifiedFullAnalysis .v3DataGrid {
    display: grid !important;
    grid-template-columns: repeat(auto-fit, minmax(128px, 1fr)) !important;
    gap: .35rem !important;
    min-width: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
    overflow: visible !important;
}

[data-live-casino-v1044] .v1044FullMetric {
    min-height: 0 !important;
    min-width: 0 !important;
    padding: .35rem .45rem !important;
    overflow-wrap: anywhere !important;
}

[data-live-casino-v1044] .v1044Decision {
    padding: .38rem !important;
    gap: .3rem !important;
    margin-bottom: .4rem !important;
}

[data-live-casino-v1044] .v1044DecisionCard {
    padding: .38rem .5rem !important;
}

[data-live-casino-v1044] .v1044DecisionMain strong {
    font-size: 1.05rem !important;
}

[data-live-casino-v1044] .v3Message.success,
[data-live-casino-v1044] .v3Message.info {
    display: none !important;
}

@media (max-width: 900px) {
    [data-live-casino-v1044] .v1044Decision {
        grid-template-columns: repeat(3,1fr);
    }

    [data-live-casino-v1044] .v1044DecisionMain,
    [data-live-casino-v1044] .v1044DecisionAI {
        grid-column: 1 / -1;
    }

}

@media (max-width: 620px) {
    [data-live-casino-v105] .v105DecisionDock {
        grid-template-columns: auto minmax(0, 1fr) auto;
        gap: .2rem .45rem;
        padding: .45rem .55rem;
    }

    [data-live-casino-v105] .v105DecisionDockLabel,
    [data-live-casino-v105] .v105DecisionDockAmount {
        display: none;
    }

    [data-live-casino-v105] .v105DecisionDockPick {
        grid-column: 1 / 2;
    }

    [data-live-casino-v105] .v105DecisionDockAction {
        grid-column: 2 / 3;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    [data-live-casino-v105] .v105DecisionDockConfidence {
        grid-column: 3 / 4;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    [data-live-casino-v105] .v105DecisionDockReason {
        grid-column: 1 / -1;
    }

    [data-live-casino-v1044] .v1044UnifiedFullAnalysis .v3DataGrid {
        grid-template-columns: repeat(auto-fit, minmax(118px, 1fr)) !important;
    }

    [data-live-casino-v105] .v1053Opportunity {
        gap: .2rem .4rem;
    }

    [data-live-casino-v105] .v1053TrendSeries {
        overflow: hidden;
    }

    [data-live-casino-v105] .v1054ConfirmationState small {
        flex-basis: 100%;
    }

    [data-live-casino-v105] .v1054ResultReplacement b {
        display: none;
    }

    [data-live-casino-v105] .v1054ResultReplacement span,
    [data-live-casino-v105] .v1054ResultReplacement small {
        flex: 1 1 100%;
    }
}

[data-live-casino-v1043] .v1045RulesBadge {
    display: inline-flex;
    align-items: center;
    width: fit-content;
    margin-top: .2rem;
    padding: .18rem .5rem;
    border: 1px solid rgba(255, 213, 74, .45);
    border-radius: 999px;
    font-size: .76rem;
    font-weight: 700;
    color: #ffe58a;
    background: rgba(255, 213, 74, .09);
}
`;
