/**
 * Baccarat Analyzer V10.4.4
 * Path: runtime/liveCasino/LiveCasinoUXStyles.js
 * Purpose: Compact single-screen live casino UX styles.
 */
export const LIVE_CASINO_UX_STYLES_VERSION = "10.4.4";

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
    position: sticky;
    top: 0;
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
    margin-bottom: 0 !important;
}

[data-live-casino-v1044] .v1044UnifiedFullAnalysis .v3DataGrid {
    display: grid !important;
    grid-template-columns: repeat(4, minmax(105px, 1fr)) !important;
    gap: .35rem !important;
}

[data-live-casino-v1044] .v1044FullMetric {
    min-height: 0 !important;
    padding: .35rem .45rem !important;
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
        position: static;
        grid-template-columns: repeat(3,1fr);
    }

    [data-live-casino-v1044] .v1044DecisionMain,
    [data-live-casino-v1044] .v1044DecisionAI {
        grid-column: 1 / -1;
    }
}
`;
