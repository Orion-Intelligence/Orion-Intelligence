import { defineConfig } from "cypress";
import registerCodeCoverageTasks from "@cypress/code-coverage/task";

export default defineConfig({
  env: {
    coverage: true,
    language: "en",
    codeCoverage: {
      enabled: true,
    },
    pgp: false,
    ADMIN_USERNAME:"admin_test_username",
    ADMIN_PASSWORD:"Zq9M#rX@e7W^B0T+f(ysG!kJc1d2mC&N%hAUEP)6Y4n$R8VbHS",
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
    takeScreenshots: true,
  },

  e2e: {
    specPattern: "cypress/e2e/**/*.{cy,spec}.{ts,js}",
    supportFile: "cypress/support/e2e.ts",

    setupNodeEvents(on, config) {
      registerCodeCoverageTasks(on, config);

      on("before:browser:launch", (browser, launchOptions) => {
        if (browser.family === "chromium") {
          launchOptions.args.push("--window-size=1920,1080");
          launchOptions.args.push("--force-device-scale-factor=1");
        }
        return launchOptions;
      });

      on("task", {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        },
      });

      return config;
    },
    baseUrl: "http://127.0.0.1:4200",
    viewportWidth: 1280,
    viewportHeight: 720,
  },

  defaultCommandTimeout: 20000,

  component: {
    devServer: {
      framework: "angular",
      bundler: "webpack",
    },
    specPattern: "cypress/**/*.cy.ts",
  },
});
