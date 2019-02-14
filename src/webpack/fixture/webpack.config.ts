import { Configuration } from 'webpack';


export default (module: Configuration['module']): Configuration => ({
	context: __dirname,
	entry: './example.tsx',

	output: {
		path: __dirname,
		filename: 'example.output.js',
	},

	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx'],
	},

	node: {
		Buffer: false,
	},

	module,
});