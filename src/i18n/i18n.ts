import { textCompile } from './i18n.compiler';
import { getTranslate, getLang, getPlural } from './locale';

export function i18n(phrase: string, parts: any[], ctx: string = 'default'): string {
	const lang = getLang();
	const plural = getPlural();
	const translatePhrase = getTranslate(phrase, lang, ctx);
	const compiledPhrase = textCompile(translatePhrase, plural);

	// console.log(phrase, parts)
	return compiledPhrase(parts);
}
