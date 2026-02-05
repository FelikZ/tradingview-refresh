(function initBlockDetector() {
    const BLOCKS = {
        "forecast": 'span[class^="chartTitle-"]'
    };

    const ACTIONS = {
        "forecast": function () {
            document.querySelectorAll('#FY').forEach(el => el.click());
        }
    };

    const activeBlocks = new Set();
    const INTERVAL_MS = 500;

    function checkBlocks() {
        for (const [blockName, selector] of Object.entries(BLOCKS)) {
            const elements = document.querySelectorAll(selector);
            const isPresent = elements.length > 0;

            if (isPresent && !activeBlocks.has(blockName)) {
                activeBlocks.add(blockName);
                console.log(`[BlockDetector] Block "${blockName}" detected`);

                if (ACTIONS[blockName]) {
                    try {
                        ACTIONS[blockName]();
                        console.log(`[BlockDetector] Action for "${blockName}" executed`);
                    } catch (e) {
                        console.error(`[BlockDetector] Action error for "${blockName}":`, e);
                    }
                }
            } else if (!isPresent && activeBlocks.has(blockName)) {
                activeBlocks.delete(blockName);
                console.log(`[BlockDetector] Block "${blockName}" gone`);
            }
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
