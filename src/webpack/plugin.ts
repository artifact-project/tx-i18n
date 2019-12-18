import { writeFileSync } from 'fs';
import { getPhrases, resetPhrases } from '../transformer/transformer';
import { Compiler } from 'webpack';
import { phrasesStringify, StringifyOptions, StringifySeparateOutput } from '../utils/stringify';

export type ExtractorOptions = Omit<StringifyOptions, 'phrases'> & {
	output: string | StringifySeparateOutput;
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

		phrasesStringify({
			...this.options,
			phrases: getPhrases(),
		}).forEach(({file, content}) => {
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