/**
 * Baccarat Analyzer
 * -----------------------------------------
 *
 * 莊家第三張補牌規則
 */

export function bankerThirdCardRule(
    bankerValue,
    playerThirdCard
) {

    if (
        !Number.isInteger(bankerValue) ||
        bankerValue < 0 ||
        bankerValue > 9
    ) {
        throw new RangeError(
            "Banker value must be an integer between 0 and 9."
        );
    }

    if (!playerThirdCard) {
        throw new Error(
            "Player third card is required."
        );
    }

    const rank =
        playerThirdCard.rank;

    if (bankerValue <= 2) {
        return true;
    }

    if (bankerValue === 3) {
        return rank !== "8";
    }

    if (bankerValue === 4) {
        return [
            "2",
            "3",
            "4",
            "5",
            "6",
            "7"
        ].includes(rank);
    }

    if (bankerValue === 5) {
        return [
            "4",
            "5",
            "6",
            "7"
        ].includes(rank);
    }

    if (bankerValue === 6) {
        return [
            "6",
            "7"
        ].includes(rank);
    }

    return false;

}
