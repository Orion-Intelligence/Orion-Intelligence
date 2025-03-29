const CompressionPlugin = require('compression-webpack-plugin');
const JavaScriptObfuscator = require('webpack-obfuscator');

module.exports = {
  plugins: [
    new CompressionPlugin({
      filename: '[path][base].gz',
      algorithm: 'gzip',
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),

    new JavaScriptObfuscator({
      rotateStringArray: true,
      compact: true,
      controlFlowFlattening: false,
      controlFlowFlatteningThreshold: 0.75,
      deadCodeInjection: false,
      stringArray: true,
      stringArrayEncoding: ['base64'],
      stringArrayThreshold: 0.75,
      debugProtection: true,
      debugProtectionInterval: 4000,
      disableConsoleOutput: true
    }, ['vendor.js'])
  ]
};
