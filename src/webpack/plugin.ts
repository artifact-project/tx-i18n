import { Compiler } from 'webpack';

type ExtractorOptions = {
	output: string;
}

export class Extractor {
	constructor(private options: ExtractorOptions) {
	}

	apply(compiler: Compiler) {
		compiler.plugin('done', () => {
			console.log('Hello World!', this.options);
		});
	}
}