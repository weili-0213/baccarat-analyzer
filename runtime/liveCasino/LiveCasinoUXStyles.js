/**
 * Baccarat Analyzer V10.4.3
 * Path: runtime/liveCasino/LiveCasinoUXStyles.js
 * Purpose: Compact single-screen live casino UX styles.
 */
export const LIVE_CASINO_UX_STYLES_VERSION = "10.4.3";

export const LIVE_CASINO_UX_STYLE_ID =
    "baccarat-live-casino-v1043";

export const LIVE_CASINO_UX_CSS = `
[data-live-casino-v1043] {
    --player: #2f7cff;
    --player-soft: rgba(47,124,255,.16);
    --banker: #ef4444;
    --banker-soft: rgba(239,68,68,.16);
    --tie: #22c55e;
    --surface: rgba(0,0,0,.12);
    --line: rgba(255,255,255,.16);
}

[data-live-casino-v1043] .dashboardHeader {
    min-height: auto !important;
    padding-block: .5rem !important;
    gap: .6rem !important;
}

[data-live-casino-v1043] .dashboardHeaderActions {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: .35rem !important;
}

[data-live-casino-v1043] button[data-mode],
[data-live-casino-v1043] button[data-action="set-mode"],
[data-live-casino-v1043] .dashboardHeaderActions .button,
[data-live-casino-v1043] button[data-action="new-shoe"] {
    width: auto !important;
    min-height: 34px !important;
    padding: .35rem .75rem !important;
}

[data-live-casino-v1043] .button.full,
[data-live-casino-v1043] .v3RoundPanel .button {
    min-height: 38px !important;
    padding: .45rem .8rem !important;
}

[data-live-casino-v1043] .v3RoundActions {
    display: flex !important;
    flex-wrap: wrap !important;
    gap: .4rem !important;
}

[data-live-casino-v1043] .v3RoundActions .button {
    width: auto !important;
    flex: 1 1 auto !important;
}


[data-live-casino-v1043] .v3RecommendationPanel {
    display: none !important;
}

[data-live-casino-v1043] .v1043Decision {
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

[data-live-casino-v1043] .v1043DecisionCard {
    padding: .55rem .65rem;
    border-radius: 9px;
    background: var(--surface);
}

[data-live-casino-v1043] .v1043DecisionMain strong {
    display: block;
    font-size: 1.25rem;
}

[data-live-casino-v1043] .v1043Player {
    border-left: 4px solid var(--player);
    background: var(--player-soft);
}

[data-live-casino-v1043] .v1043Banker {
    border-left: 4px solid var(--banker);
    background: var(--banker-soft);
}

[data-live-casino-v1043] .v1043Tie {
    border-left: 4px solid var(--tie);
}

[data-live-casino-v1043] .v1043Player strong,
[data-live-casino-v1043] [data-side="player"],
[data-live-casino-v1043] .player {
    color: #8db8ff !important;
}

[data-live-casino-v1043] .v1043Banker strong,
[data-live-casino-v1043] [data-side="banker"],
[data-live-casino-v1043] .banker {
    color: #ff9a9a !important;
}

[data-live-casino-v1043] .v1043Meta {
    font-size: .78rem;
    opacity: .85;
}

[data-live-casino-v1043] .v1043RoadSection.v1043Collapsed {
    display: none !important;
}

[data-live-casino-v1043] .v1043UtilityBar {
    display: flex;
    gap: .4rem;
    margin: .4rem 0;
}

[data-live-casino-v1043] .v1043UtilityBar button {
    width: auto !important;
    min-height: 32px !important;
    padding: .3rem .7rem !important;
}

[data-live-casino-v1043] [data-ai-closed-loop-panel].v1043AIHidden {
    display: none !important;
}

[data-live-casino-v1043] .dashboardCard {
    margin-bottom: .55rem !important;
}

[data-live-casino-v1043] .v3PanelHeader {
    margin-bottom: .45rem !important;
}

@media (max-width: 900px) {
    [data-live-casino-v1043] .v1043Decision {
        position: static;
        grid-template-columns: repeat(3,1fr);
    }

    [data-live-casino-v1043] .v1043DecisionMain,
    [data-live-casino-v1043] .v1043DecisionAI {
        grid-column: 1 / -1;
    }
}
`;
