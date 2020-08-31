import { i18nJSXFactory } from './jsx';

it('jsx', () => {
	const jsx = i18nJSXFactory((type, props, ...children) => ({
		type,
		props: {
			...Object(props),
			children,
		},
	}));

	expect(jsx(
		`Привет {v1}, нажми <a2>здесь</a2> чтобы продолжить<i3/>.`,
		[
			{type: 'div', props: null},
			'Вася',
			{type: 'a', props: {href: '#'}},
			{type: 'i', props: {className: 'icon'}},
		]
	)).toMatchSnapshot();
});
