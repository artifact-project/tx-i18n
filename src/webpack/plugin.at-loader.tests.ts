import * as webpack from 'webpack';
import * as MemoryFS from 'memory-fs';
import webpackConfig from './fixture/webpack.config';
import { Extractor } from './plugin';
import tx18n from '../transformer/transformer';

const fs = new MemoryFS();
const localeOutput = `${__dirname}/at-phrases.json`;
const compiler = webpack({
	...webpackConfig({
		rules: [{
			test: /\.tsx?$/,
			loader: 'awesome-typescript-loader',
			exclude: /node_modules/,
			options: {
				getCustomTransformers: () => ({
					before: [
						tx18n({
							packageName: `${__dirname}/../i18n/i18n`,
							exclude: [
								'tx-i18n/src/i18n',
								'tx-i18n/src/jsx',
								'tx-i18n/src/transformer',
							],
						}),
					],
					after: [],
				}),
			},
		}],
	}),

	plugins: [
		new Extractor({
			output: localeOutput,
			outputFileSystem: fs,
		}),
	],
});

compiler.outputFileSystem = fs;

it('at-loader: Extract', async () => {
	await new Promise((resolve, reject) => {
		compiler.run((err, stats) => {
			if (err || stats.hasErrors()) {
				console.log(stats.toString({
					colors: true,
				}))
				reject(err);
				return;
			}

			resolve(new Promise(resolve => {
				const content = fs.readFileSync(localeOutput) + '';

				expect(JSON.parse(content)).toEqual({
					default: {
						"test test или<#1><2>Duo</2>.": "test test или<#1><2>Duo</2>.",
						'Демо': 'Демо',
						'Мы рады видеть тебя!': 'Мы рады видеть тебя!',
						'Привет, <1><#2></1>!': 'Привет, <1><#2></1>!',
						'Рубаха': 'Рубаха',
					},
				});

				resolve();
			}));
		});
	});
});
