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
            const sanitize = str => str.replace('−', '-').replace(/\p{Cf}/gu, '');

            const lookBackYears = 4;

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
                // -1 because we want to include the last reported value in the calculation
                const lookbackLimit = Math.max(0, lastReportedIdx - (lookBackYears - 1));
                console.log(lookbackLimit);
                for (let i = lookbackLimit; i <= lastReportedIdx; i++) {
                    const val = parse(reported[i]);
                    console.log(`val: ${val}, i: ${i}, reported[i]: ${reported[i]}`);
                    if (!isNaN(val) && val > 0) {
                        historicStartVal = val;
                        historicStartIdx = i;
                        break;
                    }
                }
                console.log(`historicStartVal: ${historicStartVal}, historicStartIdx: ${historicStartIdx}`);
                if (historicStartIdx !== undefined && historicStartVal !== 0) {
                    const years = (lastReportedIdx - historicStartIdx) + 1;
                    if (years > 0) {
                        const ratio = lastReportedVal / historicStartVal;
                        if (ratio > 0) {
                            historicCompoundGrowth = Number(Math.pow(ratio, 1 / years).toFixed(4));
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
                        avgCompoundGrowth = Number(Math.pow(ratio, 1 / years).toFixed(4));
                    }
                }
            }

            const historicStr = historicCompoundGrowth !== null ? `${((historicCompoundGrowth - 1) * 100).toFixed(2)}%` : 'N/A';
            const forecastStr = avgCompoundGrowth !== null ? `${((avgCompoundGrowth - 1) * 100).toFixed(2)}%` : 'N/A';

            if (historicCompoundGrowth !== null || avgCompoundGrowth !== null) {
                blockElement.querySelector('div[class^="shadedLayer"] span[class^="content-"]').textContent = `HISTORIC ${historicStr} / FORECAST ${forecastStr}`;
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

                if (ACTIONS[blockName]) {
                    try {
                        ACTIONS[blockName](element);
                    } catch (e) {
                        console.error(`[BlockDetector] Action error for "${blockName}":`, e);
                    }
                }
            });
        }
    }

    if (window.__blockDetectorActive) {
        return 'already_initialized';
    }

    window.__blockDetectorActive = true;
    setInterval(checkBlocks, INTERVAL_MS);

    return 'initialized';
})();
