module.exports = (config) => {
  config.module.rules.push({
    test: /\.[jt]s$/,
    enforce: "post",
    use: {
      loader: "babel-loader",
      options: {
        presets: [["@babel/preset-env"]],
        plugins: ["istanbul"],
      },
    },
    include: [/src/],
    exclude: [/node_modules/, /\.spec\./],
  });
  return config;
};
