import tx18n from '../../transformer/transformer';
import { Configuration } from 'webpack';


export default <Configuration>{
	context: __dirname,
	entry: './example.tsx',

	output: {
		path: __dirname,
		filename: 'output.js',
	},

	resolve: {
		extensions: ['.ts', '.tsx', '.js', '.jsx'],
	},

	node: {
		Buffer: false,
	},

	module: {
		rules: [{
			test: /\.tsx?$/,
			loader: 'awesome-typescript-loader',
			exclude: /node_modules/,
			options: {
				getCustomTransformers: () => ({
					before: [
						tx18n({
							packageName: `${__dirname}/../../i18n/i18n`,
							exclude: [
								'tx-i18n/src/i18n',
								'tx-i18n/src/jsx',
							],
						}),
					],
					after: [],
				}),
			},
		}],
	},
};