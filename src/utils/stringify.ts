import { ContextedPhrases } from '../transformer/transformer';
import { ContextedLocale } from '../i18n/locale';

export type StringifySeparateOutput = (phrases: ContextedPhrases) => Array<{
	file: string;
	phrases: ContextedPhrases;
}>;

export type StringifyOptions = {
	phrases: ContextedPhrases;
	output?: string | StringifySeparateOutput;
	indent?: string;
	stringify?: (locale: ContextedLocale) => string;
	valueWrapper?: [string, string];
	outputFileSystem?: {
		writeFileSync(filename: string, content: string): void
	};
};

const jsonStringify = JSON.stringify;

export function phrasesStringify(options: StringifyOptions) {
	let {
		phrases,
		output = './locale.ts',
		indent = '  ',
		stringify,
		valueWrapper,
	} = options;

	if (typeof output === 'string') {
		const file = output;
		output = (phrases) => [{
			file,
			phrases,
		}];
	}

	const valueStringify = Array.isArray(valueWrapper)
		? (value: any) => valueWrapper[0] + jsonStringify(value) + valueWrapper[1]
		: jsonStringify
	;

	return output(phrases).map(({file, phrases:contextedPhrases}) => {
		let content = '';

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

		if (stringify) {
			content = stringify(ctxLocale);
		} else {
			content = '{\n' + Object.keys(ctxLocale).map((context) => {
				const locale = ctxLocale[context];

				return (
					`${indent}${jsonStringify(context)}: {\n` +
						Object
							.keys(locale)
							.map(key => `${indent}${indent}${jsonStringify(key)}: ${valueStringify(locale[key])}`)
							.join(',\n') +
					`\n${indent}}`
				);
			}).join(',') + '\n}';

			if (/\.[tj]sx?$/.test(file)) {
				content = `export default ${content};`;
			}
		}

		return {
			file,
			content,
		};
	});
}