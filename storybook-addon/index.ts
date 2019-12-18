import { createElement, useEffect, useReducer } from 'react';
import addons, { makeDecorator, StoryContext, StoryGetter } from '@storybook/addons';
import { ADDON_EVENT_SET, ADDON_EVENT_REGISTER } from './shared';
import { setLang, getLang, setLocale, ContextedLocale } from '../src/i18n/locale';
import { Channel } from '@storybook/channels';

export const withTXI18n = makeDecorator({
	name: 'tx-i18n',
	parameterName: 'tx-i18n',
	skipIfNoParametersOrOptions: true,

	wrapper: (getStory: StoryGetter, context: StoryContext, { parameters }) => {
		const channel = addons.getChannel();
		channel.emit(ADDON_EVENT_REGISTER, parameters);
		return createElement(TXI18NProvider, {...Object(parameters), channel}, () => getStory(context));
	},
});

type TXI18NProviderProps = {
	channel: Channel;
	children: () => JSX.Element;
	locales: {[lang:string]: ContextedLocale};
	defaultLang: string;
}

function TXI18NProvider(props: TXI18NProviderProps) {
	const {
		channel,
		children,
		locales,
		defaultLang,
	} = props;
	const lang = getLang();
	const forceUpdate = useForceUpdate();

	useEffect(() => {
		Object.entries(locales).forEach(([lang, locale]) => {
			setLocale(lang, locale);
		});

		setLang(defaultLang);

		const handle = (val: string) => {
			console.log(`[tx-i18n] Lang switched to "${val}"`);
			setLang(val);
			forceUpdate();
		};

		channel.on(ADDON_EVENT_SET, handle);
		return () => {
			channel.removeListener(ADDON_EVENT_SET, handle);
		};
	}, [defaultLang]);

	return createElement('div', {lang}, children());
}


function useForceUpdateReducer(x: number) {
	return x + 1;
}

function useForceUpdate(): () => void {
	return useReducer(useForceUpdateReducer, 0)[1] as any;
}

if (module && (module as any).hot && (module as any).hot.decline) {
	(module as any).hot.decline();
}
