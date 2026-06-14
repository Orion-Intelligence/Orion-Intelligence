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
        DEMO_USERNAME: "demo",
        DEMO_PASSWORD: "T@YdycoDuU9U6N6f2B7N8GsxpG3AkkSaOrlX8WBOwJgke3UNYCjgd3owwObGdPrsw",
        TEST_USERS: {
            testing1: { username: "testing1", email: "a@hotmail.com", password: "1qaz!QAZ", role: "Member", licenses: ["Free"] },
            testing2: { username: "testing2", email: "b@hotmail.com", password: "1qaz!QAZ", role: "Analyst", licenses: ["Free", "OSINT Basic"] },
            testing3: { username: "testing3", email: "c@hotmail.com", password: "1qaz!QAZ", role: "Member", licenses: ["Free", "OSINT Advanced"] },
            testing4: { username: "testing4", email: "d@gmail.com", password: "1qaz!QAZ", role: "Member", licenses: ["Free", "Pentester"] },
            testing5: { username: 'testing5', email: 'e@hotmail.com', password: '1qaz!QAZ', role: 'Demo', licenses: ['Free']},
            testing6: { username: "testing6", email: "feeder1@samplemail.test", password: "1qaz!QAZ", role: "Member", licenses: ["Feeder"] },
            testing7: { username: "testing7", email: "feeder2@samplemail.test", password: "1qaz!QAZ", role: "Analyst", licenses: ["Feeder"] },
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
        defaultCommandTimeout: 60000,
        requestTimeout: 60000,
        responseTimeout: 60000,
        pageLoadTimeout: 60000,
        execTimeout: 60000,
        taskTimeout: 60000,
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
