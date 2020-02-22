import { getTranslate, getLang } from '../i18n/locale';
import { jsxCompile, LikeJSXFactory } from './jsx.compiler';

export function i18nJSXFactory(createElement: LikeJSXFactory) {
	function jsx(phrase: string, parts: any[], ctx: string = 'default') {
		const translatePhrase = getTranslate(phrase, getLang(), ctx);
		const compiledPhrase = jsxCompile(translatePhrase, createElement);

		return compiledPhrase(parts);
	}

	return jsx;
}
