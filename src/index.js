import { Builder } from 'selenium-webdriver';
import { Options as ChromeOptions } from 'selenium-webdriver/chrome';
import { Options as FirefoxOptions } from 'selenium-webdriver/firefox';
import { Options as SafariOptions } from 'selenium-webdriver/safari';
import { Options as EdgeOptions } from 'selenium-webdriver/edge';
import { Options as IeOptions } from 'selenium-webdriver/ie';
import { writeFileSync, readFileSync, existsSync } from 'fs';

const createBrowserOptions = {
    chrome:  (builder, caps) => builder.setChromeOptions(new ChromeOptions(caps)),
    firefox: (builder, caps) => builder.setFirefoxOptions(new FirefoxOptions(caps)),
    safari:  (builder, caps) => builder.setSafariOptions(new SafariOptions(caps)),
    edge:    (builder, caps) => builder.setEdgeOptions(new EdgeOptions(caps)),
    ie:      (builder, caps) => builder.setIeOptions(new IeOptions(caps)),
};

function _findMatch (string, re) {
    const match = string.match(re);

    return match ? match[1].trim() : '';
}

export default {
    // Multiple browsers support
    isMultiBrowser:    false,
    openedBrowsers:    {},
    seleniumServer:    null,
    heartbeatHandler:  {},
    heartbeatInterval: Number(process.env.SELENIUM_HEARTBEAT) || 10e3,
    capabilities:      process.env.SELENIUM_CAPABILITIES || 'capabilities.json',

    /**
     * Open the browser with the given parameters
     * @param {number} id id of the opened browser
     * @param {string} pageUrl url to navigate to after creating browser
     * @param {string} browserName browser string in format 'browserName[@version][:platform]'
     */
    async openBrowser (id, pageUrl, browserName) {
        if (!browserName)
            throw new Error('Browser not specified!');

        const browserProfile = _findMatch(browserName, /([^@:]+)/);
        const browser = _findMatch(browserProfile, /([^#]+)/);
        const version = _findMatch(browserName, /@([^:]+)/);
        const platform = _findMatch(browserName, /:(.+)/);

        const builder = new Builder().forBrowser(browser, version, platform).usingServer(this.seleniumServer);
        const browserOptions = createBrowserOptions[browser];

        if (browserOptions && existsSync(this.capabilities)) {
            const caps = JSON.parse(readFileSync(this.capabilities))[browserProfile];

            if (caps)
                browserOptions(builder, caps);
        }

        const webDriver = await builder.build();

        await webDriver.get(pageUrl);
        this.openedBrowsers[id] = webDriver;

        if (this.heartbeatInterval > 0)
            this.startHeartbeat(id, webDriver);
    },

    sleep (time) {
        return new Promise(function (resolve) {
            setTimeout(function () {
                resolve();
            }, time);
        });
    },

    async startHeartbeat (id, browser) {
        this.heartbeatHandler[id] = true;
        while (this.heartbeatHandler[id]) {
            try {
                // send a command to hub to keep session
                await browser.getTitle();
            }
            catch (error) {
                // ignore error
            }
            await this.sleep(this.heartbeatInterval);
        }
    },

    stopHeartbeat (id) {
        this.heartbeatHandler[id] = false;
    },

    async closeBrowser (id) {
        if (this.heartbeatInterval > 0)
            this.stopHeartbeat(id);
        await this.openedBrowsers[id].quit();
    },

    // Optional - implement methods you need, remove other methods
    // Initialization
    async init () {
        this.seleniumServer = process.env.SELENIUM_SERVER ? process.env.SELENIUM_SERVER : 'http://localhost:4444/wd/hub';
    },

    async dispose () {
        // ensure every session is closed on process exit
        for (const id in this.openedBrowsers) {
            if (this.heartbeatInterval > 0)
                this.stopHeartbeat(id);
            try {
                await this.openedBrowsers[id].quit();
            }
            catch (error) {
                // browser has already been closed
            }
        }
    },

    // Optional methods for multi-browser support
    async getBrowserList () {
        throw new Error('Not implemented!');
    },

    async isValidBrowserName (/* browserName */) {
        return true;
    },

    // Extra methods
    async canResizeWindowToDimensions (/* browserId, width, height */) {
        return true;
    },

    async resizeWindow (id, width, height /*, currentWidth, currentHeight*/) {
        // this sets the browser size, not the size of the visible screen so output may vary. setSize doesn't appear to be a function of webdriverjs
        await this.openedBrowsers[id].manage().window().setRect({ width: width, height: height });
    },

    async maximizeWindow (id) {
        // May need to install a window manager like fluxbox if this doesn't work for Chrome. https://github.com/SeleniumHQ/docker-selenium/issues/559
        // or the workaround will be to set capabilities to start maximized.
        await this.openedBrowsers[id].manage().window().maximize();
    },

    async takeScreenshot (id, screenshotPath /*, pageWidth, pageHeight*/) {
        const screenshot = await this.openedBrowsers[id].takeScreenshot(screenshotPath);

        writeFileSync(screenshotPath, screenshot, 'base64');
    },

    async getVideoFrameData (id) {
        const screenshot = await this.openedBrowsers[id].takeScreenshot();

        return await Buffer.from(screenshot, 'base64');
    },

    async isLocalBrowser () {
        return false;
    }
};
