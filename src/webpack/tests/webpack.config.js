const { Extractor } = require('../plugin');

module.exports = {
	context: __dirname,
	devtool: null,
	entry: './example.tsx',

	output: {
		path: __dirname,
		filename: 'output.js',
	},

	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx'],
	},

	module: {
		rules: [{
			test: /\.tsx?$/,
			loader: 'awesome-typescript-loader',
		}],
	},

	plugins: [
		new Extractor({}),
	],
};