import { defineConfig } from "cypress";
import registerCodeCoverageTasks from "@cypress/code-coverage/task";

const isCi =
    process.env["CI"] === "true" ||
    process.env["GITHUB_ACTIONS"] === "true" ||
    process.env["GITLAB_CI"] === "true";

export default defineConfig({
    env: {
        coverage: isCi,
        language: "en",
        codeCoverage: {
            enabled: isCi,
        },
        pgp: false,
        ADMIN_USERNAME: "admin_test_username",
        ADMIN_PASSWORD: "Zq9M#rX@e7W^B0T+f(ysG!kJc1d2mC&N%hAUEP)6Y4n$R8VbHS",
        TEST_USERS: {
            testing1: { username: "testing1", email: "a@hotmail.com", password: "1qaz!QAZ", role: "Member", licenses: ["Free"] },
            testing2: { username: "testing2", email: "b@hotmail.com", password: "1qaz!QAZ", role: "Analyst", licenses: ["Free", "OSINT Basic"] },
            testing3: { username: "testing3", email: "c@hotmail.com", password: "1qaz!QAZ", role: "Member", licenses: ["Free", "OSINT Advanced"] },
            testing4: { username: "testing4", email: "d@gmail.com", password: "1qaz!QAZ", role: "Member", licenses: ["Free", "Pentester"] },
            testing5: { username: "testing5", email: "e@hotmail.com", password: "1qaz!QAZ", role: "Demo", licenses: ["Free"] },
        },
        DEFAULT_TEST_USER_KEY: "testing5",
        RESET_PASSWORD_EMAIL: "d@gmail.com",
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
    e2e: {
        specPattern: "cypress/e2e/**/*.{cy,spec}.{ts,js}",
        supportFile: "cypress/support/e2e.ts",
        testIsolation: true,
        setupNodeEvents(on, config) {
            if (isCi) {
                registerCodeCoverageTasks(on, config);
            }
            on("before:browser:launch", (browser, launchOptions) => {
                if (browser.family === "chromium") {
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
        viewportWidth: 1366,
        viewportHeight: 1200,
        defaultCommandTimeout: 15000,
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
