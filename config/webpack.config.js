const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/frontend/index.tsx',
  devtool: "source-map",
  resolve: { extensions: ['.ts', '.js', '.tsx', '.svg', '.css'] },
  module: {
    rules: [
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        loader: "url-loader",
        options: {
          limit: 10000,
          name: "static/media/[name].[hash:8].[ext]",
        },
      },
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
        test: /\.svg$/,
        use: ["svg-url-loader"],
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
    path: path.resolve(__dirname, '../public'),
    publicPath: "/",
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "./src/frontend/index.html",
      filename: "index.html",
      favicon: "./src/frontend/favicon.ico",
    })
  ],
  devServer: {
    compress: true,
    hot: true,
    port: 4000,
    watchFiles: path.join(__dirname, 'src/frontend'),
  }
};
