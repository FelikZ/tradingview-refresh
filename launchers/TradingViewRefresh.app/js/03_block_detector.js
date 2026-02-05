(function initBlockDetector() {
    const BLOCKS = {
        "FinYear": 'button#FY'
    };

    const ACTIONS = {
        "FinYear": function () {
            document.querySelectorAll('#FY').forEach(el => el.click());
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
                        ACTIONS[blockName]();
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
