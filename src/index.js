import { Builder } from 'selenium-webdriver';
import { writeFileSync } from 'fs';

export default {
    // Multiple browsers support
    isMultiBrowser: false,
    openedBrowsers: {},
    seleniumServer: null,

    // Required - must be implemented
    // Browser control
    async openBrowser (id, pageUrl, browserName) {
        var browser = await new Builder().forBrowser(browserName).usingServer(this.seleniumServer).build();

        browser.get(pageUrl);
        this.openedBrowsers[id] = browser;
    },

    async closeBrowser (id) {
        this.openedBrowsers[id].quit();
    },

    // Optional - implement methods you need, remove other methods
    // Initialization
    async init () {
        this.seleniumServer = process.env.SELENIUM_SERVER ? process.env.SELENIUM_SERVER : 'http://localhost:4444/wd/hub';
    },

    async dispose () {
        return;
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
