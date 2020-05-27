var path = require("path");
var webpack = require("webpack");
var autoprefixer = require("autoprefixer");

const mode = process.env.NODE_ENV || "development";
const isDevBuild = mode !== "production";

module.exports = {
  context: path.resolve(__dirname, "src"),
  entry: "./main.js",
  mode: mode,
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "[name].bundle.js",
  },
  module: {
    rules: [
      { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader" },
      { test: /\.(png|jpg|gif)$/, loader: "url-loader" },
      {
        test: /\.less$/,
        use: ["style-loader", "css-loader", "postcss-loader", "less-loader"],
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          {
            loader: "style-loader",
          },
          {
            loader: "css-loader",
            options: { sourceMap: true },
          },
          {
            loader: "resolve-url-loader",
            options: { sourceMap: true },
          },
          {
            loader: "sass-loader",
            options: { sourceMap: true },
          },
        ],
      },
    ],
  },
  resolve: {
    alias: {
      jqueryui: "jquery-ui",
      slimscroll: "jquery-slimscroll",
      //'slick.formatters': path.resolve(__dirname, 'App/slick.formatters.js') //take slickgrid from node_modules but this one is adapted for BNP
    },
  },
  plugins: [
    //everything we add here, is globally available
    new webpack.ProvidePlugin({
      $: "jquery",
      jQuery: "jquery",
    }),
    new webpack.ProvidePlugin({
      _: "underscore",
    }),
    new webpack.ProvidePlugin({
      d3: "d3",
    }),
    new webpack.LoaderOptionsPlugin({
      options: {
        postcss: [autoprefixer()],
      },
    }),
  ],
};

if (!isDevBuild) {
  module.exports.optimization = {
    minimize: true,
  };
} else {
  module.exports.devtool = "source-map";

  module.exports.devServer = {
    contentBase: "./public",
    host: "localhost",
    port: 9000,
    open: true,
  };
}
