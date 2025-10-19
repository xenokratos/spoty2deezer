import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

const resources = {
	en: {
		translation: {
			// Navigation and UI
			'nav.title': 'MusConv',
			'nav.description':
				'Convert your music links from Spotify to Deezer and YouTube Music instantly',

			// Form
			'form.placeholder': 'Paste any Spotify or Deezer link...',
			'form.convertButton': 'Convert to Other Platforms',
			'form.convertButton.loading': 'Converting...',
			'form.error.empty': 'Please enter a Spotify or Deezer URL to convert',
			'form.error.invalid': 'Please enter a valid Spotify or Deezer URL',

			// Results
			'results.title': 'Conversion Results',
			'results.spotify.matches':
				'Found {{count}} Deezer match{{plural}} and {{youtubeCount}} YouTube Music match{{youtubePlural}}.',
			'results.deezer.matches':
				'Found {{count}} YouTube Music match{{plural}}.',
			'results.clearButton': 'Convert Another Track',
			'results.topMatch': 'Top Match',
			'results.otherMatches': 'Other Matches',
			'results.youtube.matches': 'YouTube Music Matches',

			// Track info
			'track.by': 'by',

			// Actions
			'action.open.spotify': 'Open in Spotify',
			'action.open.deezer': 'Open in Deezer',
			'action.open.youtube': 'Open in YouTube Music',
			'action.copy': 'Copy Link',

			// Platform names
			'platform.spotify': 'Spotify',
			'platform.deezer': 'Deezer',
			'platform.youtube': 'YouTube Music',

			// Error messages
			'error.track.notFound.spotify':
				'Track not found on Spotify. Please verify the URL is correct.',
			'error.track.notFound.deezer':
				'Track not found on Deezer. Please verify the URL is correct.',
			'error.track.extractFailed.spotify':
				'Unable to extract track information from Spotify. Please check the URL and try again.',
			'error.track.extractFailed.deezer':
				'Unable to extract track information from Deezer. Please check the URL and try again.',
			'error.connection.timeout':
				'Connection timeout. Please check your internet connection and try again.',
			'error.service.unavailable':
				'Service temporarily unavailable. Please try again later.',
			'error.noMatches.deezer':
				'No matching tracks found on Deezer. Try adjusting the search terms or check if the track exists on Deezer.',
			'error.noMatches.youtube':
				'No matching tracks found on YouTube Music. Try searching manually with the track details.',
			'error.invalid.url.spotify':
				'Invalid Spotify URL. Please check the format and try again.',
			'error.invalid.url.deezer':
				'Invalid Deezer URL. Please check the format and try again.',
			'error.unknown': 'An unexpected error occurred. Please try again.',

			// Footer
			'footer.description': 'Made with ❤️ for music lovers',
			'footer.builtWith': 'Built with React & TypeScript',
		},
	},
	fr: {
		translation: {
			// Navigation and UI
			'nav.title': 'Convertisseur Musical Universel',
			'nav.description':
				'Convertissez vos liens musicaux entre Spotify, Deezer et YouTube Music instantanément',

			// Form
			'form.placeholder': "Collez n'importe quel lien Spotify ou Deezer...",
			'form.convertButton': "Convertir vers d'autres plateformes",
			'form.convertButton.loading': 'Conversion en cours...',
			'form.error.empty':
				'Veuillez entrer une URL Spotify ou Deezer à convertir',
			'form.error.invalid': 'Veuillez entrer une URL Spotify ou Deezer valide',

			// Results
			'results.title': 'Résultats de conversion',
			'results.spotify.matches':
				'{{count}} correspondance{{plural}} trouvée{{plural}} sur Deezer et {{youtubeCount}} sur YouTube Music.',
			'results.deezer.matches':
				'{{count}} correspondance{{plural}} trouvée{{plural}} sur YouTube Music.',
			'results.clearButton': 'Convertir un autre titre',
			'results.topMatch': 'Meilleure correspondance',
			'results.otherMatches': 'Autres correspondances',
			'results.youtube.matches': 'Correspondances YouTube Music',

			// Track info
			'track.by': 'par',

			// Actions
			'action.open.spotify': 'Ouvrir dans Spotify',
			'action.open.deezer': 'Ouvrir dans Deezer',
			'action.open.youtube': 'Ouvrir dans YouTube Music',
			'action.copy': 'Copier le lien',

			// Platform names
			'platform.spotify': 'Spotify',
			'platform.deezer': 'Deezer',
			'platform.youtube': 'YouTube Music',

			// Error messages
			'error.track.notFound.spotify':
				"Titre non trouvé sur Spotify. Veuillez vérifier que l'URL est correcte.",
			'error.track.notFound.deezer':
				"Titre non trouvé sur Deezer. Veuillez vérifier que l'URL est correcte.",
			'error.track.extractFailed.spotify':
				"Impossible d'extraire les informations du titre depuis Spotify. Veuillez vérifier l'URL et réessayer.",
			'error.track.extractFailed.deezer':
				"Impossible d'extraire les informations du titre depuis Deezer. Veuillez vérifier l'URL et réessayer.",
			'error.connection.timeout':
				"Délai d'attente dépassé. Veuillez vérifier votre connexion internet et réessayer.",
			'error.service.unavailable':
				'Service temporairement indisponible. Veuillez réessayer plus tard.',
			'error.noMatches.deezer':
				"Aucune correspondance trouvée sur Deezer. Essayez d'ajuster les termes de recherche ou vérifiez si le titre existe sur Deezer.",
			'error.noMatches.youtube':
				'Aucune correspondance trouvée sur YouTube Music. Essayez de rechercher manuellement avec les détails du titre.',
			'error.invalid.url.spotify':
				'URL Spotify invalide. Veuillez vérifier le format et réessayer.',
			'error.invalid.url.deezer':
				'URL Deezer invalide. Veuillez vérifier le format et réessayer.',
			'error.unknown':
				"Une erreur inattendue s'est produite. Veuillez réessayer.",

			// Footer
			'footer.description': 'Fait avec ❤️ pour les amateurs de musique',
			'footer.builtWith': 'Construit avec React & TypeScript',
		},
	},
};

i18n
	.use(LanguageDetector)
	.use(initReactI18next)
	.init({
		resources,
		fallbackLng: 'en',
		debug: false,
		detection: {
			order: ['localStorage', 'navigator', 'htmlTag'],
			lookupLocalStorage: 'i18nextLng',
			caches: ['localStorage'],
		},
	});

export default i18n;
