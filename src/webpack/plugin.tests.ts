import * as webpack from 'webpack';
import * as MemoryFS from 'memory-fs';
import webpackConfig from './fixture/webpack.config';
import { Extractor } from './plugin';

const localeOutput = `${__dirname}/phrases.js`;
const compiler = webpack({
	...webpackConfig,
	plugins: [
		new Extractor({
			output: localeOutput,
		}),
	],
});

compiler.outputFileSystem = new MemoryFS();


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
				expect(JSON.parse(compiler.outputFileSystem.readFileSync(localeOutput) + '')).toEqual([
					'Рубаха',
					'Демо',
					'Привет, <1><#2></1>!',
					'Мы рады видеть тебя!',
				]);
				resolve();
			}));
		});
	});
});