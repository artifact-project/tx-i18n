import { writeFileSync } from 'fs';
import { getPhrases, resetPhrases } from '../transformer/transformer';
import { Compiler } from 'webpack';
import { Locale } from '../i18n/locale';

type ExtractorOptions = {
	output: string;
	indent?: string;
	stringify?: (json: Locale) => string;
	outputFileSystem?: {
		writeFileSync(filename: string, content: string): void
	};
}

export class Extractor {
	private _content = '';
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
		const {
			output,
			indent = '  ',
			stringify,
		} = this.options;;
		const locale = getPhrases().reduce((locale, phrase) => {
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

			if (/\.[tj]sx?$/.test(output)) {
				content = `export default ${content};`;
			}
		}

		if (this._content !== content) {
			this._content = content;
			this.options.outputFileSystem.writeFileSync(
				output,
				content,
			);
		}
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