export function cardSVG(card) {

    const suit = card.slice(-1);
    const rank = card.slice(0, -1);

    const isRed = suit === "♥" || suit === "♦";

    return `
    <div class="card">
        <svg class="playing-card" viewBox="0 0 180 250">

            <rect
                x="3"
                y="3"
                width="174"
                height="244"
                rx="12"
                fill="white"
                stroke="#222"
                stroke-width="3"/>

            <!-- 左上 -->
            <text
                x="18"
                y="32"
                font-size="24"
                font-weight="bold"
                fill="${isRed ? "#d40000" : "#111"}">
                ${rank}
            </text>

            <text
                x="18"
                y="58"
                font-size="22"
                fill="${isRed ? "#d40000" : "#111"}">
                ${suit}
            </text>

            <!-- 中央 -->
            <text
                x="90"
                y="140"
                text-anchor="middle"
                font-size="72"
                fill="${isRed ? "#d40000" : "#111"}">
                ${suit}
            </text>

            <!-- 右下 -->
            <g transform="translate(162 220) rotate(180)">
                <text
                    font-size="24"
                    font-weight="bold"
                    fill="${isRed ? "#d40000" : "#111"}">
                    ${rank}
                </text>

                <text
                    y="26"
                    font-size="22"
                    fill="${isRed ? "#d40000" : "#111"}">
                    ${suit}
                </text>
            </g>

        </svg>
    </div>
    `;
}
