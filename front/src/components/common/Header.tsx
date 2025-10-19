import { useTranslation } from 'react-i18next';

export const Header = () => {
	const { t } = useTranslation();
	return (
		<div className="text-center mb-10">
			<h1 className="text-4xl md:text-5xl font-bold text-gray-900">
				{t('nav.title')}
			</h1>
			<p className="mt-4 text-lg text-gray-600">{t('nav.description')}</p>
		</div>
	);
};
