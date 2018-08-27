import * as ts from 'typescript';
import * as React from 'react';
import * as renderer from 'react-test-renderer';
import { transform } from './transformer.tests';
import i18n from '../../index';
import { setDefaultLocale } from '../i18n/locale';

beforeEach(() => {
	setDefaultLocale({});
})

describe('transform', () => {
	it('react', () => {
		expect(transform('react')).toMatchSnapshot();
	});

	it('react-composite', () => {
		expect(transform('react-composite')).toMatchSnapshot();
	});
});

describe('render', () => {
	function load(name): any {
		try {
			const exports = {};
			const source = transform(name, {
				module: ts.ModuleKind.CommonJS,
				target: ts.ScriptTarget.ES5,
				jsx: ts.JsxEmit.React,
			});

			Function('exports, require', source)(
				exports,
				(name) => {
					if (name === 'tx-i18n') {
						return i18n;
					} else if (name.substr(0, 2) === './') {
						return load(name.substr(2));
					} else {
						return require(name);
					}
				},
			);

			return exports;
		} catch (err) {
			console.error(err);
		}
	}

	function render(Block, props = {}) {
		return renderer
			.create(React.createElement(Block, props))
			.toJSON();
	}

	describe('react', () => {
		const blocks = load('react');

		it('react: Static', () => {
			expect(render(blocks.Static)).toMatchSnapshot();
		});

		it('react: Hello', () => {
			expect(render(blocks.Hello, {username: 'Рубаха'})).toMatchSnapshot();
		});

		it('react: ClickHere', () => {
			expect(render(blocks.ClickHere, {username: 'Рубаха'})).toMatchSnapshot();
		});
	});

	describe('react-composite', () => {
		const blocks = load('react-composite');

		it('react-composite: DeepHello', () => {
			setDefaultLocale({
				'Привет <#1>-кун!1': 'Hi, <#1>-kun!',
				'<1/> или Нет!': '<1/> or No!',
			});
			expect(render(blocks.DeepHello, {username: 'i18n'})).toMatchSnapshot();
		});

		it('react-composite: DeepHello (invert)', () => {
			setDefaultLocale({
				'Привет <#1>-кун!1': '<#1>, HI!',
				'<1/> или Нет!': 'No or <1/>!',
			});
			expect(render(blocks.DeepHello, {username: 'i18n'})).toMatchSnapshot();
		});

		it('react-composite: Dialog', () => {
			setDefaultLocale({
				'Ширина:': 'Width:',
				'Да<#1><2/>': '<2/> — yes',
			});
			expect(render(blocks.Dialog)).toMatchSnapshot();
		});
	});
});
