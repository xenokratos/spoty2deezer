import { useTranslation } from 'react-i18next';

export const Footer = () => {
	const { t } = useTranslation();
	return (
		<div className="text-center mt-10">
			<p className="text-gray-600 text-sm">{t('footer.description')}</p>
		</div>
	);
};
