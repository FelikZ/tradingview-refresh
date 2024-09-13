package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"os"
	"os/exec"
	"time"

	"github.com/gorilla/websocket"
)

const MAX_EXTENSION_PERIOD_DAYS time.Duration = 60

type Window struct {
	WebSocketDebuggerURL string `json:"webSocketDebuggerUrl"`
	WS                   *websocket.Conn
}

type AlertResponse struct {
	Status string   `json:"s"`
	ID     string   `json:"id"`
	Alerts *[]Alert `json:"r"`
}

type AlertResponseAfterUpdate struct {
	Status string `json:"s"`
	ID     string `json:"id"`
	Alerts *Alert `json:"r"`
}

type Alert struct {
	Symbol         string  `json:"symbol"`
	Resolution     string  `json:"resolution"`
	Expiration     string  `json:"expiration"`
	Message        string  `json:"message"`
	Name           *string `json:"name"`
	AlertID        int64   `json:"alert_id"`
	Active         bool    `json:"active"`
	AutoDeactivate bool    `json:"auto_deactivate"`
	CreateTime     string  `json:"create_time"`
	LastFireTime   *string `json:"last_fire_time"`
	SoundFile      string  `json:"sound_file"`
	SoundDuration  int     `json:"sound_duration"`
	Popup          bool    `json:"popup"`
	Email          bool    `json:"email"`
	SmsOverEmail   bool    `json:"sms_over_email"`
	MobilePush     bool    `json:"mobile_push"`
	WebHook        *string `json:"web_hook"`
	IgnoreWarnings bool    `json:"ignore_warnings"`
	Condition      struct {
		Type        string        `json:"type"`
		Frequency   string        `json:"frequency"`
		Series      []interface{} `json:"series"`
		AlertCondId string        `json:"alert_cond_id"`
	} `json:"condition"`
}

func main() {
	port := flag.Int("p", 0, "Debugging port")
	appPath := flag.String("app", "", "Path to Electron app")
	flag.Parse()

	if *port == 0 || *appPath == "" {
		flag.Usage()
		os.Exit(1)
	}

	// Launch Electron app
	cmd := exec.Command(*appPath, fmt.Sprintf("--remote-allow-origins=http://localhost:%d", *port), fmt.Sprintf("--remote-debugging-port=%d", *port))
	//cmd.Stdout = os.Stdout
	//cmd.Stderr = os.Stderr
	err := cmd.Start()

	// args := []string{*appPath, fmt.Sprintf("--remote-allow-origins=http://localhost:%d", *port), fmt.Sprintf("--remote-debugging-port=%d", *port)}
	// attr := &os.ProcAttr{
	// 	Files: []*os.File{os.Stdin, os.Stdout, os.Stderr},
	// 	Sys:   &syscall.SysProcAttr{},
	// }
	// process, err := os.StartProcess(*appPath, args, attr)
	// if err != nil {
	// 	fmt.Printf("Error starting process: %v\n", err)
	// 	return
	// }
	// fmt.Printf("Started process with PID: %d\n", process.Pid)
	// process.Release() // Detach from the process

	if err != nil {
		log.Fatalf("Failed to start Electron app: %v", err)
	}

	// Wait for the app to start
	time.Sleep(7 * time.Second)

	// Get WebSocket URL
	windows, err := getWindows(*port)
	if err != nil {
		log.Fatalf("Failed to get windows: %v", err)
	}

	if len(windows) == 0 {
		log.Fatal("No windows found")
	}

	// Connect to WebSocket
	window := windows[0]
	c, _, err := websocket.DefaultDialer.Dial(window.WebSocketDebuggerURL, nil)
	if err != nil {
		log.Fatalf("Failed to connect to WebSocket: %v", err)
	}
	defer c.Close()

	window.WS = c

	// Get and filter alerts
	filteredAlerts, err := getAndFilterAlerts(window)
	if err != nil {
		log.Fatalf("Failed to get and filter alerts: %v", err)
	}

	if len(filteredAlerts) < 1 {
		fmt.Println("No alerts needs to be extended.")
	} else {
		refreshAlerts(window, filteredAlerts)
	}

	// Kill the Electron process
	//cmd.Process.Kill()
	// process.Kill()
}

func getWindows(port int) ([]Window, error) {
	url := fmt.Sprintf("http://localhost:%d/json/list?t=%d", port, time.Now().Unix())
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var windows []Window
	err = json.NewDecoder(resp.Body).Decode(&windows)
	if err != nil {
		return nil, err
	}

	return windows, nil
}

func evalJSRaw(window Window, expression string) (map[string]interface{}, error) {
	data := map[string]interface{}{
		"id":     1,
		"method": "Runtime.evaluate",
		"params": map[string]interface{}{
			"contextId":                            1,
			"expression":                           expression,
			"doNotPauseOnExceptionsAndMuteConsole": false,
			"generatePreview":                      false,
			"includeCommandLineAPI":                true,
			"objectGroup":                          "console",
			"returnByValue":                        true,
			"userGesture":                          true,
		},
	}

	err := window.WS.WriteJSON(data)
	if err != nil {
		return nil, err
	}

	var response map[string]interface{}
	err = window.WS.ReadJSON(&response)
	if err != nil {
		return nil, err
	}

	return response, nil
}

func parseJSResult(response map[string]interface{}) (string, error) {
	result, ok := response["result"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("unexpected response format: %v", response)
	}

	// The 'result' field directly contains the value we want
	resultValue, ok := result["result"].(map[string]interface{})
	if !ok {
		return "", fmt.Errorf("result field not found or not an object")
	}

	value, ok := resultValue["value"].(string)
	if !ok {
		return "", fmt.Errorf("value field not found or not a string")
	}

	return value, nil
}

func getAndFilterAlerts(window Window) ([]Alert, error) {
	// jsCode := `
	// 	fetch("https://pricealerts.tradingview.com/list_alerts", {"credentials": "include"})
	// 		.then(response => response.json())
	// 		.catch(error => ({error: error.toString()}))
	// `
	jsCode := `
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
	`

	rawResult, err := evalJSRaw(window, jsCode)
	if err != nil {
		return nil, fmt.Errorf("failed to execute JavaScript: %v", err)
	}

	// Check if there's an error in the response
	result, ok := rawResult["result"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected result format: %v", rawResult)
	}

	// Check if the actual alert response is inside "result"
	alertResponseJSON, ok := result["result"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected result format: %v", result)
	}

	//fmt.Printf("%#v", alertResponseJSON)

	// Extract the JSON string from the map
	jsonString, ok := alertResponseJSON["value"].(string)
	if !ok {
		return nil, fmt.Errorf("unexpected result format: %v", jsonString)
	}

	// fmt.Printf("%v", jsonString)

	// Unmarshal into your AlertResponse struct
	var alertResp AlertResponse
	err = json.Unmarshal([]byte(jsonString), &alertResp)
	if err != nil {
		return nil, fmt.Errorf("failed to unmarshal alert response: %v", err)
	}

	// Filter alerts by expiration time
	now := time.Now()
	// Get the start of today in the local time zone
	startOfToday := time.Date(
		now.Year(), now.Month(), now.Day(),
		0, 0, 0, 0,
		time.Local, // Location parameter for the time zone
	)

	// Get the end of today (just before the start of the next day)
	endOfToday := startOfToday.Add(24 * time.Hour).Add(-time.Nanosecond)

	maxDate := startOfToday.Add((MAX_EXTENSION_PERIOD_DAYS - 1) * 24 * time.Hour).Add(-time.Nanosecond)

	var filteredAlerts []Alert
	for _, alert := range *alertResp.Alerts {
		expirationTime, err := time.Parse(time.RFC3339, alert.Expiration)
		if err != nil {
			log.Printf("Warning: Could not parse expiration time for alert %d: %v", alert.AlertID, err)
			continue
		}

		creationTime, err := time.Parse(time.RFC3339, alert.CreateTime)
		if err != nil {
			log.Printf("Warning: Could not parse create time for alert %d: %v", alert.AlertID, err)
			continue
		}

		// skip sameday alerts
		if expirationTime.After(startOfToday) && expirationTime.Before(endOfToday) && creationTime.After(startOfToday) && creationTime.Before(endOfToday) {
			continue
		}

		// skip alerts that are already maxed out
		if expirationTime.After(maxDate) {
			continue
		}

		// skip alerts that suppose to trigger ONLY once AND have being triggered before
		if alert.Condition.Frequency == "on_first_fire" && alert.AutoDeactivate && alert.LastFireTime != nil {
			continue
		}

		filteredAlerts = append(filteredAlerts, alert)
	}

	return filteredAlerts, nil
}

func refreshAlerts(window Window, alerts []Alert) error {
	jsCodeTpl := `
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
	`

	now := time.Now()
	startOfToday := time.Date(
		now.Year(), now.Month(), now.Day(),
		0, 0, 0, 0,
		time.Local,
	)
	maxDate := startOfToday.Add(MAX_EXTENSION_PERIOD_DAYS * 24 * time.Hour).Add(-time.Nanosecond)

	for _, alert := range alerts {
		alert.Expiration = maxDate.Format(time.RFC3339)
		alert.Active = true

		jsonAlert, err := json.Marshal(alert)
		if err != nil {
			log.Printf("Error marshalling data to JSON: %v\n\n", err)
			continue
		}

		jsonAlertStr := template.JSEscapeString(string(jsonAlert))

		jsCode := fmt.Sprintf(jsCodeTpl, jsonAlertStr)

		// fmt.Printf("%s\n", jsCode)

		rawResult, err := evalJSRaw(window, jsCode)
		if err != nil {
			log.Printf("failed to execute JavaScript: %v\n\n", err)
			continue
		}

		// fmt.Printf("%#v", rawResult)

		// Extract the nested value
		result := rawResult["result"].(map[string]interface{})
		innerResult := result["result"].(map[string]interface{})
		value := innerResult["value"].(string)

		var alertResp AlertResponseAfterUpdate
		err = json.Unmarshal([]byte(value), &alertResp)
		if err != nil {
			log.Printf("Error unmarshalling alert response: %v", err)
			continue
		}

		alertStatus := fmt.Sprintf("\033[31m%s\033[0m", alertResp.Status)
		if alertResp.Status == "ok" {
			alertStatus = fmt.Sprintf("\033[32m%s\033[0m", alertResp.Status)
		}
		fmt.Printf("%s: %s\n", alertStatus, alert.Symbol)
	}
	return nil
}
