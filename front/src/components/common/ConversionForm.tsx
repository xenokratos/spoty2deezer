import { useTranslation } from 'react-i18next';

interface ConversionFormProps {
	value: string;
	onChange: (value: string) => void;
	onConvert: () => void;
	loading: boolean;
	error: string;
}

export const ConversionForm = ({
	value,
	onChange,
	onConvert,
	loading,
	error,
}: ConversionFormProps) => {
	const { t } = useTranslation();
	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		onChange(e.target.value);
	};

	return (
		<div className="bg-white p-6 md:p-8 rounded-lg shadow-lg mb-8">
			<div className="relative mb-6">
				<span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-2xl">
					🔗
				</span>
				<input
					type="text"
					value={value}
					onChange={handleInputChange}
					placeholder={t('form.placeholder')}
					className="w-full bg-gray-50 border border-gray-300 text-gray-900 rounded-md py-3 pl-12 pr-4 text-base focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
				/>
			</div>

			<button
				type="button"
				onClick={onConvert}
				disabled={loading}
				className="w-full bg-primary hover:bg-green-600 text-white font-bold py-3 px-4 rounded-md transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
			>
				<span className="text-2xl">🔄</span>
				<span>
					{loading ? t('form.convertButton.loading') : t('form.convertButton')}
				</span>
			</button>

			{error && (
				<div className="mt-4 bg-red-100 p-3 rounded-md">
					<p className="text-red-600 text-sm">{t(error)}</p>
				</div>
			)}
		</div>
	);
};
