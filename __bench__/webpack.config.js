const {join} = require('path');
const webpack = require('webpack');

module.exports = {
	entry: {
		bench: './bench.tsx',
	},

	output: {
		path: join(__dirname, 'dist'),
		filename: '[name].js',
	},

	module: {
		rules: [
			{
				test: /\.tsx?$/,
				loader: 'awesome-typescript-loader',
			},
		],
	},

	resolve: {
		extensions: ['.tsx', '.ts', '.js'],
	},

	node: {
		Buffer: false,
	},

	plugins: [
		new webpack.DefinePlugin({
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
		}),
	],
};