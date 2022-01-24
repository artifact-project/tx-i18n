import { transform, reactLoad, reactRender } from './test-utils';
import { setDefaultLocale } from '../i18n/locale';
import { getPhrases } from './transformer';
import { enPlural } from '../../icu/plural/en';

beforeEach(() => {
	setDefaultLocale({}, enPlural as any);
})

describe('transform', () => {
	it('react', () => {
		expect(transform('react')).toMatchSnapshot();
	});

	it('react-composite', () => {
		expect(transform('react-composite')).toMatchSnapshot();
	});

	it('react-fragments', () => {
		expect(transform('react-fragments')).toMatchSnapshot();
	});
});

describe('render', () => {
	describe('react', () => {
		const blocks = reactLoad('react');

		it('react: Static', () => {
			expect(reactRender(blocks.Static)).toMatchSnapshot();
		});

		it('react: Entities', () => {
			expect(reactRender(blocks.Entities)).toMatchSnapshot();
		});

		it('react: Hello', () => {
			expect(reactRender(blocks.Hello, {username: 'Рубаха'})).toMatchSnapshot();
		});

		it('react: ClickHere', () => {
			expect(reactRender(blocks.ClickHere, {username: 'Рубаха'})).toMatchSnapshot();
		});

		it('react: Fragment', () => {
			expect(reactRender(blocks.Fragment)).toMatchSnapshot();
		});
	});

	describe('react-composite', () => {
		const blocks = reactLoad('react-composite');

		it('react-composite: DeepHello', () => {
			setDefaultLocale({
				default: {
					'Привет {v1}-кун!1': 'Hi, {v1}-kun!',
					'<Hello1/> или Нет!': '<Hello1/> or No!',
				},
			}, enPlural);
			expect(reactRender(blocks.DeepHello, {username: 'i18n'})).toMatchSnapshot();
		});

		it('react-composite: DeepHello (invert)', () => {
			setDefaultLocale({
				default: {
					'Привет {v1}-кун!1': '{v1}, HI!',
					'<Hello1/> или Нет!': 'No or <Hello1/>!',
				},
			}, enPlural);
			expect(reactRender(blocks.DeepHello, {username: 'i18n'})).toMatchSnapshot();
		});

		it('react-composite: Dialog', () => {
			setDefaultLocale({
				default: {
					'Подвал': 'Footer',
					'Хорошо': 'OK',
					'Отмена': 'Cancel',
					'Ширина:': 'Width:',
					'Да{v1}<input2/>': '<input2/> — fail',
					'Тест \"фу\" бар': 'Test "foo" bar',
					'{v1} Окей': 'fail:okey',
				},
				form: {
					'Сохранить': 'Save',
					'<button1/>или<Button2/>': '<button1/> or <Button2/>',
					'Отмена': 'Form cancel',
					'Да{v1}<input2/>': '<input2/> — YES',
					'{v1} Окей': 'Okey {v1}',
				},
			}, enPlural);

			expect(Object.keys(getPhrases())).toEqual(['default', 'form']);
			// expect(getPhrases()).toEqual({});
			expect(reactRender(blocks.Dialog)).toMatchSnapshot();
		});
	});
});