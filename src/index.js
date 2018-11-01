import { Builder } from 'selenium-webdriver';
import { writeFileSync } from 'fs';

export default {
    // Multiple browsers support
    isMultiBrowser:    false,
    openedBrowsers:    {},
    seleniumServer:    null,
    heartbeatHandler:  {},
    heartbeatInterval: Number(process.env.SELENIUM_HEARTBEAT) || 10e3,

    /**
     * Open the browser with the given parameters
     * @param {number} id id of the opened browser
     * @param {string} pageUrl url to navigate to after creating browser
     * @param {string} browserName browser string in format 'browserName[@version][:platform]'
     */
    async openBrowser (id, pageUrl, browserName) {
        if (!browserName)
            throw new Error('Unsupported browser!');

        const browserNameString = browserName.match(/([^@:]+)/);
        let version = browserName.match(/@([^:]+)/);
        let platform = browserName.match(/:(.+)/);

        version = version ? version[1] : undefined; // eslint-disable-line no-undefined
        platform = platform ? platform[1] : undefined; // eslint-disable-line no-undefined
        const browser = await new Builder().forBrowser(browserNameString[1], version, platform).usingServer(this.seleniumServer).build();

        browser.get(pageUrl);
        this.openedBrowsers[id] = browser;
        this.startHeartbeat(id, browser);
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

        await writeFileSync(screenshotPath, screenshot, 'base64');
    }
};
