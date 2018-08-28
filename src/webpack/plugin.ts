import { writeFileSync } from 'fs';
import { getPhrases, resetPhrases } from '../transformer/transformer';
import { Compiler } from 'webpack';

type ExtractorOptions = {
	output: string;
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
		const content = JSON.stringify(
			getPhrases().reduce((locale, phrase) => {
				locale[phrase] = phrase;
				return locale;
			}, {}),
			null,
			2,
		);

		if (this._content !== content) {
			this._content = content;
			this.options.outputFileSystem.writeFileSync(
				this.options.output,
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