import { jsxFactory } from './jsx';

it('jsx', () => {
	const jsx = jsxFactory((type, props, ...children) => ({
		type,
		props: {
			...Object(props),
			children,
		},
	}));

	expect(jsx(
		"Привет <#1>, нажми <2>здесь</2> чтобы продолжить<3/>.",
		[
			{type: 'div', props: null},
			"Вася",
			{type: "a", props: {href: "#"}},
			{type: "i", props: {className: "icon"}},
		]
	)).toMatchSnapshot();
});
