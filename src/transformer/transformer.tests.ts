import { transform } from './test-utils';
import { getPhrases, resetPhrases } from './transformer';

beforeEach(() => {
	resetPhrases();
})

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

it('plural', () => {
	expect(transform('plural')).toMatchSnapshot();
	expect(getPhrases().default.map(v => v.value)).toEqual([
		'You have {v1, plural, one {# message} other {# messages}}.',
		'{v1, plural, one {# message} other {# messages}}',
		'{v1, plural, one {message} other {messages}}',
	]);
});

it('func', () => {
	expect(transform('func')).toMatchSnapshot();
	// expect(getPhrases().default[0].value).toEqual('Single "quote"')
	// expect(getPhrases().default[1].value).toEqual('Double \"quote\"');
	// expect(getPhrases().default[2].value).toEqual('Mixed \"quote\"');
});

it('like mustache vars', () => {
	expect(transform('like-mustache-vars')).toMatchSnapshot();
	// expect(getPhrases().default[0].value).toEqual('Single "quote"')
	// expect(getPhrases().default[1].value).toEqual('Double \"quote\"');
	// expect(getPhrases().default[2].value).toEqual('Mixed \"quote\"');
});

it('phrases', () => {
	transform('simple')

	expect(Object.keys(getPhrases())).toEqual(['default']);
	expect(getPhrases().default[0]).toEqual({
		ctx: 'default',
		file: `${__dirname}/fixture/simple.ts`,
		value: 'foo',
		loc: {
			start: {line: 0, character: 0},
			end: {line: 0, character: 5},
		},
	});
});

it('phrases with context', () => {
	resetPhrases();
	transform('context')

	expect(Object.keys(getPhrases())).toEqual([
		'default',
		'other',
	]);

	expect(getPhrases().default.map(p => p.value)).toEqual([
		'foo',
		'bar',
		'qux',
	]);

	expect(getPhrases().other[0].ctx).toEqual('other');
	expect(getPhrases().other.map(p => p.value)).toEqual([
		'bar',
		'foo',
		'bar',
		'baz',
		'qux',
	]);
});
