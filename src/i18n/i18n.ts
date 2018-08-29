import { createElement } from 'react';

import { createCompiler } from './compiler';
import { jsxFactory } from '../jsx/jsx';
import { getTranslate } from './locale';

const compile = createCompiler({
	inject: null,
	partOffset: -1,
	before: () => '',
	after: () => '""',
	text: (text) => `${text}+`,
	value: (part) => `${part}+`,
});

function i18n(phrase: string, parts: any[]) {
	const translatePhrase = getTranslate(phrase);
	const compiledPhrase = compile(translatePhrase);

	return compiledPhrase(parts);
}

i18n['jsx'] = jsxFactory(createElement);

export default i18n as {
	(pharse: string, parts: any[]): string;
	jsx: {
		(pharse: string, parts: any[]): any;
		useWrapper: (Cmp: Function) => void;
	};
};