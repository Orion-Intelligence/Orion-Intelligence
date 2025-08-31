"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTestApp = createTestApp;
function createWorkspace(runner) {
    return runner.runExternalSchematic('@schematics/angular', 'workspace', {
        name: 'workspace',
        version: '10.0.0',
        newProjectRoot: 'projects',
    });
}
/**
 * Creates a sample workspace with two applications: 'app' (default) and 'second-app'
 */
async function createTestApp(runner) {
    let tree = await createWorkspace(runner);
    tree = await runner.runExternalSchematic('@schematics/angular', 'application', { name: 'app', standalone: true }, tree);
    return runner.runExternalSchematic('@schematics/angular', 'application', { name: 'second-app', standalone: true }, tree);
}
//# sourceMappingURL=testing.js.map