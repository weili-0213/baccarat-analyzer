/**
 * Baccarat Analyzer V10.4.5
 * Path: config/noCommissionBaccarat.js
 * Purpose: Canonical No Commission Baccarat / Banker-6-half-pay ruleset.
 *
 * Rules:
 * - Player win: 1:1
 * - Banker win except Banker 6: 1:1
 * - Banker wins with 6: 0.5:1
 * - Tie pushes Player / Banker main bets
 * - Tie side bet: 8:1
 */
export const NO_COMMISSION_BACCARAT_VERSION = "10.4.5";

export const BaccaratVariant = Object.freeze({
    NO_COMMISSION_BANKER_6_HALF:
        "no-commission-banker-6-half"
});

export const NO_COMMISSION_BACCARAT_RULES =
    Object.freeze({
        id:
            BaccaratVariant
                .NO_COMMISSION_BANKER_6_HALF,

        label:
            "免佣百家樂（莊6半賠）",

        playerNetOdds:
            1,

        bankerNormalNetOdds:
            1,

        bankerSixNetOdds:
            0.5,

        tieNetOdds:
            8,

        playerPairNetOdds:
            11,

        bankerPairNetOdds:
            11,

        super6NetOdds:
            12,

        mainBetTiePush:
            true
    });

export const NO_COMMISSION_PAYOUT =
    Object.freeze({
        player:
            NO_COMMISSION_BACCARAT_RULES
                .playerNetOdds,

        bankerNormal:
            NO_COMMISSION_BACCARAT_RULES
                .bankerNormalNetOdds,

        bankerSix:
            NO_COMMISSION_BACCARAT_RULES
                .bankerSixNetOdds,

        tie:
            NO_COMMISSION_BACCARAT_RULES
                .tieNetOdds,

        playerPair:
            NO_COMMISSION_BACCARAT_RULES
                .playerPairNetOdds,

        bankerPair:
            NO_COMMISSION_BACCARAT_RULES
                .bankerPairNetOdds,

        super6:
            NO_COMMISSION_BACCARAT_RULES
                .super6NetOdds
    });

export default NO_COMMISSION_BACCARAT_RULES;
