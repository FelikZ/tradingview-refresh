(function fetchAlertsSync() {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", "https://pricealerts.tradingview.com/list_alerts", false);
    xhr.withCredentials = true;

    try {
        xhr.send();

        if (xhr.status >= 200 && xhr.status < 300) {
            return xhr.responseText;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
})();
