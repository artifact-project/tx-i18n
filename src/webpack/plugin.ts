import { getPhrases } from '../transformer/transformer';
import { Compiler } from 'webpack';

type ExtractorOptions = {
	output: string;
}

export class Extractor {
	constructor(private options: ExtractorOptions) {
	}

	// Use @types/webpack
	apply(compiler: Compiler) {
		compiler.plugin('done', () => {
			compiler.outputFileSystem.writeFileSync(
				this.options.output,
				JSON.stringify(getPhrases(), null, 2),
				'utf8',
			);
		});
	}
}