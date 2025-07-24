// const fs = require('fs');
// const path = require('path');
//
// const distDir = path.join(__dirname, 'dist');
// const buildDir = path.join(__dirname, 'build');
//
// const removeDir = (dir) => {
//     if (fs.existsSync(dir)) {
//         fs.rmSync(dir, { recursive: true, force: true });
//     }
// };
//
// const renameWithRetry = (src, dest, attempts = 5) => {
//     try {
//         fs.renameSync(src, dest);
//     } catch (err) {
//         if (err.code === 'EPERM' && attempts > 0) {
//             setTimeout(() => renameWithRetry(src, dest, attempts - 1), 500);
//         } else {
//             console.error(`Error renaming ${src} to ${dest}:`, err);
//         }
//     }
// };
//
// removeDir(buildDir);
//
// if (fs.existsSync(distDir)) {
//     renameWithRetry(distDir, buildDir);
// }
