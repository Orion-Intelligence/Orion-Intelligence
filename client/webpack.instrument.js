const path = require("path");

module.exports = (config) => {
  config.module.rules.push({
    test: /\.ts$/,
    enforce: "post",
    include: [path.resolve(__dirname, "src")],
    exclude: [/node_modules/, /\.spec\.ts$/],
    use: {
      loader: "babel-loader",
      options: {
        babelrc: false,
        configFile: false,
        presets: [["@babel/preset-env"], ["@babel/preset-typescript"]],
        plugins: ["istanbul"],
      },
    },
  });

  return config;
};
