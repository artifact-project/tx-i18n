import { writeFileSync } from 'fs';
import { getPhrases, resetPhrases, Pharse, ContextedPhrases } from '../transformer/transformer';
import { Compiler } from 'webpack';
import { Locale, ContextedLocale } from '../i18n/locale';

export type ExtractorSeparateOutput = (phrases: ContextedPhrases) => Array<{
	file: string;
	phrases: ContextedPhrases;
}>

export type ExtractorOptions = {
	output: string | ExtractorSeparateOutput;
	indent?: string;
	stringify?: (locale: ContextedLocale) => string;
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

		const jstr = JSON.stringify;
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

		output(getPhrases()).forEach(({file, phrases:contextedPhrases}) => {
			const ctxLocale = Object.keys(contextedPhrases).reduce((contexted, context) => {
				contexted[context] = contextedPhrases[context]
					.map(phrase => phrase.value)
					.sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
					.reduce((locale, phrase) => {
						locale[phrase] = phrase;
						return locale;
					}, {});

				return contexted;
			}, {} as ContextedLocale);

			let content = '';

			if (stringify) {
				content = stringify(ctxLocale);
			} else {
				content = '{\n' + Object.keys(ctxLocale).map((context) => {
					const locale = ctxLocale[context];

					return (
						`${indent}${jstr(context)}: {\n` +
							Object
								.keys(locale)
								.map(key => `${indent}${indent}${jstr(key)}: ${jstr(locale[key])}`)
								.join(',\n') +
						`${indent}\n}`
					);
				}).join(',') + '\n}';

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