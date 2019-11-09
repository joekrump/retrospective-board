const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.tsx',
  resolve: { extensions: ['.ts', '.js', '.tsx'] },
  module: {
    rules: [
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          }
        ]
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
      {
        enforce: "pre",
        test: /\.js$/,
        loader: "source-map-loader",
      }
    ]
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, './public'),
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/index.html"
    })
  ]
};
