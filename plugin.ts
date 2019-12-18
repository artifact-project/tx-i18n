import { writeFileSync } from 'fs';
import { Program } from 'typescript';
import transformerFactory, { TXConfig, getPhrases, ContextedPhrases, contextedPhrasesFilter, Phrase } from './src/transformer/transformer';
import { phrasesStringify, StringifySeparateOutput } from './src/utils/stringify';

type MultipleOutput = {
	file: string;
	test: string[];
};

type PluginOptions = Pick<TXConfig,
	| 'exclude'
	| 'include'
	| 'fnName'
	| 'packageName'
> & {
	humanTextCheckRegExp?: string;
	verbose?: boolean;
	output?: string | MultipleOutput[];
	outputOptions?: {
		indent?: string;
	};
};

export default function txPlugin(_: Program, pluginOptions: PluginOptions) {
	const verbose = pluginOptions.verbose ? (...args: any[]) => console.log('[tx-i18n]', ...args) : (() => {});

	function save() {
		const {
			output = './locale.default.ts',
			outputOptions = {},
		} = pluginOptions;

		phrasesStringify({
			output: prepareOutput(output),
			phrases: getPhrases(),
			indent: outputOptions.indent,
		}).forEach(({file, content}) => {
			verbose('Write locale file', file);
			writeFileSync(file, content);
		});
	}

	process.on('SIGINT', () => {
		verbose('process.SIGINT');
		save();
	});

	process.on('exit', () => {
		verbose('process.exit');
		save();
	});

	console.log('txPlugin:', pluginOptions);

	const extra: TXConfig = {verbose};

	if (pluginOptions.humanTextCheckRegExp) {
		const re = new RegExp(pluginOptions.humanTextCheckRegExp, 'i');
		extra.isHumanText =  (val: string) => re.test(val);
	}

	return transformerFactory({
		...pluginOptions,
		...Object(extra),
	});
}

function prepareOutput(output: PluginOptions['output']): string | StringifySeparateOutput {
	if (typeof output === 'string') {
		return output;
	}

	const filters = output.map(({file, test}) => {
		const regexp = test.map((val) => new RegExp(val));
		const filter = ({file}: Phrase) => regexp.some((re) => re.test(file));

		return  {
			file,
			filter,
		};
	});

	return (phrases: ContextedPhrases) => filters.map(({file, filter}) => ({
		file,
		phrases: contextedPhrasesFilter(phrases, filter),
	}));
}