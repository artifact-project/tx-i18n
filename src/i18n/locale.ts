let LANG = 'default';

const LOCALES = {
	[LANG]: {},
};

export type Locale = {
	[phrase:string]: string;
}

export function setLang(name: string) {
	LANG = name;
}

export function getLang() {
	return LANG;
}

export function setLocale(lang: 'default' | string, locale: Locale) {
	LOCALES[lang] = locale;
}

export function setDefaultLocale(locale: Locale) {
	setLocale('default', locale);
}

export function getTranslate(phrase: string, lang = LANG) {
	if (LOCALES.hasOwnProperty(lang) && LOCALES[lang].hasOwnProperty(phrase)) {
		return LOCALES[lang][phrase];
	}

	// todo: warning not translated phrase
	return phrase;
}