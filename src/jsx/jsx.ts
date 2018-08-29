import { getTranslate } from '../i18n/locale';
import { createCompiler } from '../i18n/compiler';

type JsxElement = {
	type: string | Function;
	props: {
		children: Array<JsxElement | string>;
		[key:string]: any;
	};
}

export function jsxFactory(create: (type: string | Function, props: object, ...children: any[]) => JsxElement) {
	const compile = createCompiler({
		inject: {
			__CREATE__: create,
		},
		partOffset: 0,
		before: () => '__CREATE__(__parts__[0].type, __parts__[0].props,',
		after: () => ')',
		text: (text) => `${text},`,
		value: (part) => `${part},`,
		selfClose: (part) => `__CREATE__(${part}.type, ${part}.props),`,
		open: (part) => `__CREATE__(${part}.type, ${part}.props,`,
		close: () => '),',
	});
	let Wrapper = null;

	function jsx(phrase: string, parts) {
		const translatePhrase = getTranslate(phrase);
		const compiledPhrase = compile(translatePhrase);

		return Wrapper
			? create(Wrapper, {value: () => compiledPhrase(parts)})
			: compiledPhrase(parts)
		;
	}

	jsx['useWrapper'] = (Cmp) => {
		Wrapper = Cmp;
	};

	return jsx as {
		(phrase: string, parts: any[]): JsxElement;
		useWrapper: (Cmp: Function) => void;
	};
}