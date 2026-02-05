(function initBlockDetector() {
    const BLOCKS = {
        "FinYear": 'button#FY',
        "ForecastMath": 'div[class^="chart-"] > div[class^="wrap-"]'
    };

    const ACTIONS = {
        "FinYear": function (blockElement) {
            document.querySelectorAll('#FY').forEach(el => el.click());
        },
        "ForecastMath": function (blockElement) {
            const sanitize = str => str.replace(/\p{Cf}/gu, '').replace('−', '-');

            let reported = [...blockElement
                .parentElement
                .nextSibling
                .querySelectorAll('div[data-name="Reported"] div[class^="values-"] div[class^="value"]')]
                .map(e => sanitize(e.textContent));

            let estimates = [...blockElement
                .parentElement
                .nextSibling
                .querySelectorAll('div[data-name="Estimate"] div[class^="values-"] div[class^="value"]')]
                .map(e => sanitize(e.textContent));

            console.log(reported, estimates);

            const parse = str => {
                const trimmed = str.trim();
                const match = trimmed.match(/^(-?[\d.,]+)\s*([KMBT])?$/i);
                if (!match) return NaN;

                const numericPart = parseFloat(match[1].replace(',', ''));
                const suffix = (match[2] || '').toUpperCase();

                const multipliers = { 'K': 1e3, 'M': 1e6, 'B': 1e9, 'T': 1e12 };
                return numericPart * (multipliers[suffix] || 1);
            };

            let lastReportedVal, lastReportedIdx;
            for (let i = reported.length - 1; i >= 0; i--) {
                const val = parse(reported[i]);
                if (!isNaN(val)) {
                    lastReportedVal = val;
                    lastReportedIdx = i;
                    break;
                }
            }

            let lastEstimateVal, lastEstimateIdx;
            for (let i = estimates.length - 1; i >= 0; i--) {
                const val = parse(estimates[i]);
                if (!isNaN(val)) {
                    lastEstimateVal = val;
                    lastEstimateIdx = i;
                    break;
                }
            }

            let historicCompoundGrowth = null;
            if (lastReportedIdx !== undefined && lastReportedIdx > 0) {
                let historicStartVal, historicStartIdx;
                const lookbackLimit = Math.max(0, lastReportedIdx - 4);
                for (let i = lookbackLimit; i < lastReportedIdx; i++) {
                    const val = parse(reported[i]);
                    if (!isNaN(val)) {
                        historicStartVal = val;
                        historicStartIdx = i;
                        break;
                    }
                }
                if (historicStartIdx !== undefined && historicStartVal !== 0) {
                    const years = lastReportedIdx - historicStartIdx;
                    if (years > 0) {
                        const ratio = lastReportedVal / historicStartVal;
                        if (ratio > 0) {
                            historicCompoundGrowth = Number(Math.pow(ratio, 1 / years).toFixed(3));
                        }
                    }
                }
            }

            let avgCompoundGrowth = null;
            if (lastReportedIdx !== undefined && lastEstimateIdx !== undefined) {
                const years = lastEstimateIdx - lastReportedIdx;
                if (years > 0 && lastReportedVal !== 0) {
                    const ratio = lastEstimateVal / lastReportedVal;
                    if (ratio > 0) {
                        avgCompoundGrowth = Number(Math.pow(ratio, 1 / years).toFixed(3));
                    }
                }
            }

            const historicStr = historicCompoundGrowth !== null ? `${((historicCompoundGrowth - 1) * 100).toFixed(2)}%` : 'N/A';
            const forecastStr = avgCompoundGrowth !== null ? `${((avgCompoundGrowth - 1) * 100).toFixed(2)}%` : 'N/A';

            if (historicCompoundGrowth !== null || avgCompoundGrowth !== null) {
                blockElement.querySelector('div[class^="shadedLayer"] span[class^="content-"]').textContent = `Annual HISTORIC ${historicStr} / FORECAST ${forecastStr}`;
            }
        }
    };

    const INTERVAL_MS = 500;

    function checkBlocks() {
        for (const [blockName, selector] of Object.entries(BLOCKS)) {
            const elements = document.querySelectorAll(selector);

            elements.forEach(element => {
                if (element.getAttribute('twr_block') === '1') {
                    return;
                }

                element.setAttribute('twr_block', '1');
                console.log(`[BlockDetector] Block "${blockName}" detected`);

                if (ACTIONS[blockName]) {
                    try {
                        ACTIONS[blockName](element);
                        console.log(`[BlockDetector] Action for "${blockName}" executed`);
                    } catch (e) {
                        console.error(`[BlockDetector] Action error for "${blockName}":`, e);
                    }
                }
            });
        }
    }

    if (window.__blockDetectorActive) {
        console.log('[BlockDetector] Already running, skipping init');
        return 'already_initialized';
    }

    window.__blockDetectorActive = true;
    setInterval(checkBlocks, INTERVAL_MS);
    console.log('[BlockDetector] Initialized with blocks:', Object.keys(BLOCKS));

    return 'initialized';
})();
