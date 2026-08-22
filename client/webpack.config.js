module.exports = (config, options) => {
  if (options?.configuration !== "production") {
    const { createProxyMiddleware } = require("http-proxy-middleware");
    const mailTarget = "http://127.0.0.1:4300";
    const isOrionMailHost = (_pathname, request) => {
      const host = String(request.headers.host || "").toLowerCase();
      return host === "mail.localhost" || host.startsWith("mail.localhost:");
    };
    const mailProxy = createProxyMiddleware({
      pathFilter: isOrionMailHost,
      target: mailTarget,
      changeOrigin: true,
    });
    const setupMiddlewares = config.devServer?.setupMiddlewares;

    config.devServer = {
      ...config.devServer,
      proxy: [
        {
          pathFilter: isOrionMailHost,
          router: () => mailTarget,
          changeOrigin: true,
          ws: true,
        },
        ...(config.devServer?.proxy || []),
      ],
      setupMiddlewares: (middlewares, devServer) => {
        const configuredMiddlewares = setupMiddlewares
          ? setupMiddlewares(middlewares, devServer)
          : middlewares;

        configuredMiddlewares.unshift({
          name: "orion-mail-host-proxy",
          middleware: mailProxy,
        });
        return configuredMiddlewares;
      },
    };

    return config;
  }

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
