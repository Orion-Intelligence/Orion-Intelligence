import { defineConfig } from "cypress";
import registerCodeCoverageTasks from "@cypress/code-coverage/task";

const isCi =
    process.env["CI"] === "true" ||
    process.env["GITHUB_ACTIONS"] === "true" ||
    process.env["GITLAB_CI"] === "true";

export default defineConfig({
    allowCypressEnv: false,
    video: false,
    numTestsKeptInMemory: 0,
    watchForFileChanges: false,
    experimentalMemoryManagement: true,
    experimentalFastVisibility: true,
    retries: 0,
    env: {
        coverage: isCi,
        language: "en",
        codeCoverage: {
            enabled: isCi,
        },
        pgp: false,
        ADMIN_USERNAME: "admin_test_username",
        ADMIN_PASSWORD: "Zq9M#rX@e7W^B0T+f(ysG!kJc1d2mC&N%hAUEP)6Y4n$R8VbHS",
        ADMIN_USERNAME_FOR_LIVE: "demo0001",
        ADMIN_PASSWORD_FOR_LIVE: "1qaz!QAZ",
        TEST_USERS: {
            testing1: { username: "testing1", email: "a@hotmail.com", password: "1qaz!QAZ", role: "Member", licenses: ["Free"] },
            testing2: { username: "testing2", email: "b@hotmail.com", password: "1qaz!QAZ", role: "Analyst", licenses: ["Free", "OSINT Basic"] },
            testing3: { username: "testing3", email: "c@hotmail.com", password: "1qaz!QAZ", role: "Member", licenses: ["Free", "OSINT Advanced"] },
            testing4: { username: "testing4", email: "d@gmail.com", password: "1qaz!QAZ", role: "Member", licenses: ["Free", "Pentester"] },
            testing5: { username: "testing5", email: "e@hotmail.com", password: "1qaz!QAZ", role: "Demo", licenses: ["Free"] },
        },
        DEFAULT_TEST_USER_KEY: "testing5",
        RESET_PASSWORD_EMAIL: "d@hotmail.com",
        NEW_PASSWORD: "NewSecurePass@2026",
        TENANT_ACCOUNT: {
            username: "test_for_tenants",
            email: "testing1@orionintelligence.org",
            password: "1qaz!QAZ",
        },
        TENANT_SUB_USER: {
            username: "tenant_user_1",
            email: "tenant1@gmail.com",
            password: "1qaz!QAZ",
        },
        TEST_DATA: {
            stealer_ioc_email: "nora.keen@samplemail.test",
            stealer_upgrade_name: "Avery Stone",
            stealer_upgrade_email: "avery.stone@samplemail.test",
            cti_social_username: "orion_demo_actor",
            filter_email: "filters.runner@samplemail.test",
            consolidated_ioc_email: "mila.frost@samplemail.test",
            consolidated_advanced_email: "kai.rivera@samplemail.test",
            consolidated_domain_query: "inbox.test",
            scans_email_breach: "elena.pierce@samplemail.test",
            scans_social_username: "atlasnode",
            scans_wanted_name: "Mason Hale",
            support_email: "support.agent@samplemail.test",
        },
        field_types: [
            "Single-line text input",
            "Multi-line text input",
            "Selection box",
            "Multiple choice input",
            "Checkbox",
            "Attachment",
            "Terms of service",
            "Date",
            "Date range",
            "Voice",
            "Group of questions",
        ],
        takeScreenshots: false,
    },
    expose: {
        coverage: isCi,
        TEST_DATA: {
            stealer_ioc_email: "nora.keen@samplemail.test",
            stealer_upgrade_name: "Avery Stone",
            stealer_upgrade_email: "avery.stone@samplemail.test",
            cti_social_username: "orion_demo_actor",
            filter_email: "filters.runner@samplemail.test",
            consolidated_ioc_email: "mila.frost@samplemail.test",
            consolidated_advanced_email: "kai.rivera@samplemail.test",
            consolidated_domain_query: "inbox.test",
            scans_email_breach: "elena.pierce@samplemail.test",
            scans_social_username: "atlasnode",
            scans_wanted_name: "Mason Hale",
            support_email: "support.agent@samplemail.test",
        },
    },
    e2e: {
        specPattern: "cypress/e2e/**/*.{cy,spec}.{ts,js}",
        supportFile: "cypress/support/e2e.ts",
        screenshotsFolder: "../docs/screenshots",
        testIsolation: true,
        setupNodeEvents(on, config) {
            if (isCi) {
                registerCodeCoverageTasks(on, config);
            }
            on("before:browser:launch", (browser, launchOptions) => {
                if (browser.family === "chromium") {
                    launchOptions.args.push("--start-maximized");
                    launchOptions.args.push("--window-size=1920,1080");
                    launchOptions.args.push("--force-device-scale-factor=1");
                }
                return launchOptions;
            });
            on("task", {
                log(_) {
                    return null;
                },
                table(_) {
                    return null;
                },
            });
            return config;
        },
        baseUrl: "http://127.0.0.1:4200",
        viewportWidth: 1920,
        viewportHeight: 1080,
        defaultCommandTimeout: 30000,
        requestTimeout: 8000,
        responseTimeout: 15000,
        pageLoadTimeout: 30000,
        waitForAnimations: true,
        animationDistanceThreshold: 5,
        screenshotOnRunFailure: false,
    },
    component: {
        devServer: {
            framework: "angular",
            bundler: "webpack",
        },
        specPattern: "cypress/**/*.cy.ts",
    },
});
