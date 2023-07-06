const common = require('./webpack.common.js');
const { merge } = require('webpack-merge');
const Path = require('path');
const StyleLintPlugin = require('stylelint-webpack-plugin');
const Webpack = require('webpack');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'eval-cheap-source-map',
  output: {
    chunkFilename: 'js/[name].chunk.js'
  },
  plugins: [
    new Webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development')
    }),
    new StyleLintPlugin({
      configFile: Path.resolve(__dirname, '../stylelint.config.js'),
      failOnError: false,
      quiet: false
    })
  ],
  module: {
    rules: [
      {
        test: /\.js$/,
        include: Path.resolve(__dirname, '../src'),
        enforce: 'pre',
        loader: 'eslint-loader',
        options: {
          emitWarning: true,
        }
      },
      {
        test: /\.js$/,
        include: Path.resolve(__dirname, '../src'),
        loader: 'babel-loader'
      },
      {
        test: /\.s?css$/i,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              sourceMap: true,
            },
          },
          'postcss-loader',
          'sass-loader'
        ]
      }
    ]
  }
});
