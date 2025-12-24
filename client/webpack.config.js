module.exports = (config, options) => {
  if (options?.configuration !== "production") return config;

  const CompressionPlugin = require("compression-webpack-plugin");
  const JavaScriptObfuscator = require("webpack-obfuscator");

  config.plugins.push(
    new CompressionPlugin({
      filename: "[path][base].gz",
      algorithm: "gzip",
      test: /\.(js|css|html|svg)$/,
      threshold: 10240,
      minRatio: 0.8,
    }),
    new JavaScriptObfuscator(
      {
        rotateStringArray: true,
        compact: true,
        controlFlowFlattening: false,
        controlFlowFlatteningThreshold: 0.75,
        deadCodeInjection: false,
        stringArray: true,
        stringArrayThreshold: 0.2,
      },
      ["vendor.js"]
    )
  );

  return config;
};
