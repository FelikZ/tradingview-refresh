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

            const parse = str => parseFloat(str);

            let lastReportedVal, lastReportedIdx;
            for (let i = reported.length - 1; i >= 0; i--) {
                const val = parse(reported[i]);
                console.log(reported[i], val, parseFloat(reported[i]));
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

            if (avgCompoundGrowth !== null) {
                blockElement.querySelector('div[class^="shadedLayer"] span[class^="content-"]').textContent = `ANNUAL FORECAST ${((avgCompoundGrowth - 1) * 100).toFixed(2)}%`
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
