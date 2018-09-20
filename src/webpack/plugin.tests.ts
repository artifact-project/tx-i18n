import * as webpack from 'webpack';
import * as MemoryFS from 'memory-fs';
import webpackConfig from './fixture/webpack.config';
import { Extractor } from './plugin';

const fs = new MemoryFS();
const localeOutput = `${__dirname}/phrases.json`;
const compiler = webpack({
	...webpackConfig,
	plugins: [
		new Extractor({
			output: localeOutput,
			outputFileSystem: fs,
		}),
	],
});

compiler.outputFileSystem = fs;

it('Extract', async () => {
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
				const content = compiler.outputFileSystem.readFileSync(localeOutput) + '';

				expect(JSON.parse(content)).toEqual({
					default: {
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
