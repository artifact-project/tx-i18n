import { transform } from './test-utils';

it('empty', () => {
	expect(transform('empty')).toMatchSnapshot(`'';`);
});

it('numbers', () => {
	expect(transform('numbers')).toMatchSnapshot();
});

it('simple', () => {
	expect(transform('simple')).toMatchSnapshot();
});

it('object', () => {
	expect(transform('object')).toMatchSnapshot();
});

it('template', () => {
	expect(transform('template')).toMatchSnapshot();
});
