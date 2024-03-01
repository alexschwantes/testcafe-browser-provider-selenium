# testcafe-browser-provider-selenium
[![Build Status](https://travis-ci.org/alexschwantes/testcafe-browser-provider-selenium.svg)](https://travis-ci.org/alexschwantes/testcafe-browser-provider-selenium)

This is the **Selenium** browser provider plugin for [TestCafe](http://devexpress.github.io/testcafe).

## Install

```
npm install testcafe-browser-provider-selenium
```

## Prerequisites

A Selenium Server up and running, either as standalone or in a grid. Check out the Selenium's [Docker images](https://github.com/SeleniumHQ/docker-selenium) for an easy way to get started with setting up a grid.

## Usage

If you run tests from the command line, use the browser alias when specifying browsers. The '-c 2' parameter will split the tests up and run them across two browsers concurrently. Omit this if it is not needed.

```
testcafe -c 2 selenium:chrome 'path/to/test/file.js'
```

When you use API, pass the alias to the `browsers()` method:

```js
testCafe
    .createRunner()
    .src('path/to/test/file.js')
    .browsers('selenium:chrome')
    .concurrency(2)
    .run();
```

### Supported browsers
The following browser name alias' are supported
* chrome
* firefox
* safari
* ie
* edge

### Specifying the Browser Version and Platform
The browser version and platform can be specified along with the browser name alias in the format:
```
selenium:browserName[@version][:platform]
```

for example:
* selenium:chrome
* selenium:chrome@83.0
* selenium:chrome@83.0:linux

### Customize Capabilities
Tests can be run as above without any need for additional customisation. However a configuration file (default is capabilities.json) can be used to pass custom args to a browser or to run a test using Chrome's mobile device emulation.

The format for the first level object is `browserAlias[#profile][@version][:platform]`.

for example:
```json
{
    "chrome@83": {
        "goog:chromeOptions": {
            "args": [
                "headless",
                "--use-fake-ui-for-media-stream",
                "--use-fake-device-for-media-stream",
                "--allow-http-screen-capture",
                "--disable-web-security"
            ]
        }
    },
    "chrome#iphoneX": {
        "goog:chromeOptions": {
            "mobileEmulation": {
                "deviceName": "iPhone X"
            }
        }
    },
    "chrome#customMobile": {
        "goog:chromeOptions": {
            "mobileEmulation": {
                "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.77 Safari/537.36",
                "deviceMetrics": {
                    "width": 360,
                    "height": 640,
                    "pixelRatio": 3.0
                }
            }
        }
    }
}
```
The configuration for `chrome#iphonex` uses Chrome's built in presets for the device by setting the deviceName to "iPhone X". The list of presets is likely to change so check [Google Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools/device-mode) for what is currently available.

You can always set a custom user agent and device metrics as shown in `chrome#customMobile`.


### Running the Test
Run tests on any availble Firefox browser
```
testcafe selenium:firefox test.js
```

Run tests on any available Firefox browser on Windows
```
testcafe selenium:firefox:windows test.js
```

Run tests on Chrome version 83 with custom args defined in capabilities.json.
(Note that capabilities.json is not required for this command to work, if it has not been defined the tests will attempte to run on Chrome version 83 in the selenium grid with default Chrome args)
```
testcafe selenium:chrome@83 test.js
```

Run tests with Chrome iPhone X emulation as configured in capabilities.json
```
testcafe selenium:chrome#iphonex test.js
```

Run tests with custom Chrome emulation as configured in capabilities.json
```
testcafe selenium:chrome#customMobile test.js
```

### Enable Video Recording
Follow the testcafe [instructions](https://devexpress.github.io/testcafe/documentation/guides/advanced-guides/screenshots-and-videos.html#record-videos), by adding `@ffmpeg-installer/ffmpeg` to you project dependencies.

Run the test using testcafe's standard video options eg.

```
testcafe selenium:chrome tests/test.js --video reports/screen-captures
```

## Configuration
Use the following optional environment variable to set additional configuration options:

* `SELENIUM_SERVER` - (optional) The url to the selenium server. If not set the default 'http://localhost:4444/wd/hub' will be used.
* `SELENIUM_HEARTBEAT` - (optional) Adjust or disable the selenium heartbeat. Default is 10,000 milliseconds, set to <= 0 to disable.
* `SELENIUM_CAPABILITIES` - (optional) Path to capabilities file. Default is capabilities.json.
* `SELENIUM_MAX_TRIES` - (optional) Max tries of opening browser. Default is 1.
* `SELENIUM_RETRY_INTERVAL` - (optional) Interval between retries of opening browser. Default is 5,000 milliseconds.
* `SELENIUM_PROXY` - (optional) Sets the URL of the proxy to use for the WebDriver's HTTP connections.
* `SELENIUM_RESIZE_OFFSET_HEIGHT` - (optional) add this offset to the height of the screen when resizing the window.

## Notes

### Screenshots

If you experience problems, where [`t.takeScreenshot`](https://testcafe.io/documentation/402675/reference/test-api/testcontroller/takescreenshot) produces screenshots, that dont have exactly the height as set using `t.resizeWindow` you might want to check the `SELENIUM_RESIZE_OFFSET_HEIGHT` enviornment variable.

### Resize

[`t.resizeWindow`](https://testcafe.io/documentation/402691/reference/test-api/testcontroller/resizewindow) used to directly use Seleniums [`Window.setRect()`](https://www.selenium.dev/documentation/webdriver/interactions/windows/#set-window-size) method, which worked fine for headless mode, but not when used in windowed mode.
This should be fixed now.

## Author
Alex Schwantes
