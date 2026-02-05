(function refreshAlerts() {
	const xhr = new XMLHttpRequest();
	xhr.open("POST", "https://pricealerts.tradingview.com/modify_restart_alert", false);
	xhr.withCredentials = true;
	xhr.setRequestHeader("Content-Type", "text/plain;charset=UTF-8")

	let body = "{\"payload\":%s}"

	try {
		xhr.send(body);

		if (xhr.status >= 200 && xhr.status < 300) {
			return xhr.responseText;
		} else {
			return null;
		}
	} catch (error) {
		return null;
	}
})();
