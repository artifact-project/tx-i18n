import { transform } from './test-utils';
import { getPhrases, resetPhrases } from './transformer';

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

it('template', () => {
	resetPhrases();
	transform('simple')

	expect(getPhrases()[0]).toEqual({
		file: `${__dirname}/fixture/simple.ts`,
		value: 'foo',
		loc: {
			start: {line: 0, character: 0},
			end: {line: 0, character: 5},
		},
	});
});
