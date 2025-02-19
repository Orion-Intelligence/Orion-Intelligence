const fs = require('fs');
const path = require('path');

const buildDir = path.join(__dirname, 'build');

const updateFiles = (dir, extensions, replacements) => {
    if (!fs.existsSync(dir)) return;

    fs.readdirSync(dir).forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            updateFiles(filePath, extensions, replacements);
        } else if (extensions.some(ext => file.endsWith(ext))) {
            let content = fs.readFileSync(filePath, 'utf8');
            let updatedContent = content;

            replacements.forEach(([pattern, replacement]) => {
                updatedContent = updatedContent.replace(pattern, replacement);
            });

            if (content !== updatedContent) {
                fs.writeFileSync(filePath, updatedContent, 'utf8');
                console.log(`Updated: ${filePath}`);
            }
        }
    });
};

console.log("Running post-build script...");
updateFiles(buildDir, ['.js'], [
    [/\/?assets\//g, 'build/assets/'],
    [/styles\.[a-f0-9]+\.css/g, '/build/styles.css']
]);
updateFiles(buildDir, ['.css'], [
    [/\/?assets\/fonts\//g, 'assets/fonts/']
]);
console.log("Post-build modifications completed.");
