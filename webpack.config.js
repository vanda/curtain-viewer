const { resolve } = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const OUTPUT_PATH = resolve(__dirname, 'dist');

module.exports = {
  mode: 'development',
  entry: {
    vamModal : ['element-remove', './src/components/vam-modal/index.js']
	},
  output: {
    filename: '[name].bundle.js',
    path: OUTPUT_PATH
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: 'V&amp;A Web Components',
      template: './src/index.html'
    })
  ],
  module: {
    rules: [
      {
				test: /\.js$/,
				loader: 'babel-loader',
				exclude: /node_modules\/(?!(@webcomponents\/shadycss|lit-element|lit-html)\/).*/,
				options: {
					cacheDirectory: true
				}
			},
      {
        test: /\.pcss?$/,
        use: [
          'css-loader',
          'postcss-loader'
        ]
      }
    ]
  }
};
