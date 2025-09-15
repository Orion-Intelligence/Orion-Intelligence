"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = ngAddSetupProject;
const schematics_1 = require("@angular-devkit/schematics");
const add_ng2_charts_provider_1 = require("./steps/add-ng2-charts-provider");
/**
 * Sets up a project with all required to run ng-bootstrap.
 * This is run after 'package.json' was patched and all dependencies installed
 */
function ngAddSetupProject(options) {
    return (0, schematics_1.chain)([(0, add_ng2_charts_provider_1.addChartsProviderToMain)(options)]);
}
//# sourceMappingURL=setup-project.js.map