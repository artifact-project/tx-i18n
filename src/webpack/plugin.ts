import { writeFileSync } from 'fs';
import { getPhrases, resetPhrases, Pharse } from '../transformer/transformer';
import { Compiler } from 'webpack';
import { Locale } from '../i18n/locale';

type ExtractorOptions = {
	output: string | ((phrases: Pharse[]) => Array<{file: string; phrases: Pharse[];}>);
	indent?: string;
	stringify?: (json: Locale) => string;
	outputFileSystem?: {
		writeFileSync(filename: string, content: string): void
	};
}

export class Extractor {
	private _cache = {};
	private _watchMode = false;;

	constructor(private options: ExtractorOptions) {
		this.options.outputFileSystem = this.options.outputFileSystem || {
			writeFileSync,
		};
	}

	private listenExit() {
		process.on('SIGINT', () => {
			this.save();
			process.exit();
		});
	}

	private save() {
		if (this._watchMode) {
			return;
		}

		let {
			output,
			indent = '  ',
			stringify,
		} = this.options;

		if (typeof output === 'string') {
			const file = output;
			output = (phrases) => [{
				file,
				phrases,
			}];
		}

		output(getPhrases()).forEach(({file, phrases}) => {
			const locale = phrases
				.map(phrase => phrase.value)
				.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
				.reduce((locale, phrase) => {
					locale[phrase] = phrase;
					return locale;
				}, {});
			let content = '';

			if (stringify) {
				content = stringify(locale);
			} else {
				content = (
					'{\n' +
						Object
							.keys(locale)
							.map(key => `${indent}${JSON.stringify(key)}: ${JSON.stringify(locale[key])}`)
							.join(',\n') +
					'\n}'
				);

				if (/\.[tj]sx?$/.test(file)) {
					content = `export default ${content};`;
				}
			}

			if (this._cache[file] !== content) {
				this._cache[file] = content;
				this.options.outputFileSystem.writeFileSync(
					file,
					content,
				);
			}
		});
	}

	apply(compiler: Compiler) {
		compiler.plugin('watch-run', (_, done) => {
			if (!this._watchMode) {
				this._watchMode = true;
				this.listenExit();
			}

			done();
		});

		compiler.plugin('compile', () => {
			resetPhrases();
		});

		compiler.plugin('done', () => {
			if (!this._watchMode) {
				this.save();
			}
		});
	}
}