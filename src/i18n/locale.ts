let defaultLocale: Locale = {};

export type Locale = {
	[phrase:string]: string;
}

export function setDefaultLocale(local: Locale) {
	defaultLocale = local;
}

export function getTranslate(phrase: string) {
	if (defaultLocale.hasOwnProperty(phrase)) {
		return defaultLocale[phrase];
	}

	// todo: not translated phrase
	return phrase;
}