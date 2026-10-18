import { useEffect, useId, useRef, useState } from 'react';
import { useResolver } from '../../hooks/useResolver';
import { useCopy } from './copy';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import { Platform } from './MediaCard';
import {
	platformNames,
	platforms,
	type Results as ResultData,
	supportedPlatform,
} from './presentation';
import { Results } from './Results';
import './relay.css';

export function RelayApp() {
	const { copy, i18n } = useCopy();
	const [url, setUrl] = useState('');
	const [error, setError] = useState<'empty' | 'invalid' | 'failed' | ''>('');
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<ResultData | null>(null);
	const [helpOpen, setHelpOpen] = useState(false);
	const [manualLink, setManualLink] = useState('');
	const [toast, setToast] = useState(0);
	const [copiedUrl, setCopiedUrl] = useState('');
	const inputId = useId();
	const mainId = useId();
	const helpId = useId();
	const errorId = useId();
	const manualId = useId();
	const inputRef = useRef<HTMLInputElement>(null);
	const manualRef = useRef<HTMLInputElement>(null);
	const resultsRef = useRef<HTMLDivElement>(null);
	const generation = useRef(0);
	const previousUrl = useRef('');
	const { resolve, cancel } = useResolver();
	const detected = supportedPlatform(url);
	const language = i18n.resolvedLanguage?.startsWith('fr') ? 'fr' : 'en';

	useEffect(() => {
		document.documentElement.lang = language;
	}, [language]);
	useEffect(
		() => () => {
			generation.current += 1;
		},
		[],
	);
	useEffect(() => {
		if (!toast) return;
		const timer = window.setTimeout(() => setToast(0), 4500);
		return () => window.clearTimeout(timer);
	}, [toast]);

	async function convert(candidate = url) {
		if (loading) return;
		const platform = supportedPlatform(candidate);
		if (!candidate.trim() || !platform) {
			setError(candidate.trim() ? 'invalid' : 'empty');
			inputRef.current?.focus();
			return;
		}
		const requestId = ++generation.current;
		const input = candidate.trim();
		setUrl(input);
		const previous = previousUrl.current === input ? result : null;
		setError('');
		setLoading(true);
		try {
			const next = await resolve(input);
			if (requestId !== generation.current) return;
			setResult({
				...next,
				destinations: next.destinations.map((destination) => ({
					...destination,
					matches: destination.failed
						? (previous?.destinations.find(
								(d) => d.platform === destination.platform,
							)?.matches ?? [])
						: destination.matches,
				})),
			});
			previousUrl.current = input;
			window.requestAnimationFrame(() =>
				resultsRef.current?.scrollIntoView({
					block: 'start',
					behavior: window.matchMedia('(prefers-reduced-motion: reduce)')
						.matches
						? 'instant'
						: 'smooth',
				}),
			);
		} catch {
			if (requestId !== generation.current) return;
			setError('failed');
		}
		setLoading(false);
	}

	function reset() {
		cancel();
		generation.current += 1;
		setResult(null);
		setUrl('');
		setError('');
		setLoading(false);
		setToast(0);
		inputRef.current?.focus();
	}

	async function copyLink(link: string) {
		try {
			await navigator.clipboard.writeText(link);
			setCopiedUrl(link);
			setToast(Date.now());
		} catch {
			setToast(0);
			setManualLink(link);
		}
	}

	return (
		<div className="relay-app">
			<a className="skip-link" href={`#${mainId}`}>
				{copy.skip}
			</a>
			<header className="app-header">
				<div className="header-inner">
					<a
						className="brand"
						href={import.meta.env.BASE_URL}
						aria-label="MusConv"
					>
						<span className="brand-icon">
							<Icon name="switch" />
						</span>
						MusConv
					</a>
					<nav aria-label={copy.converter}>
						<button
							type="button"
							className="text-button converter-nav"
							onClick={reset}
						>
							{copy.converter}
						</button>
						<button
							type="button"
							className="text-button"
							onClick={() => setHelpOpen(true)}
						>
							<Icon name="help" />
							{copy.help}
						</button>
						<label className="language-picker">
							<span className="sr-only">{copy.language}</span>
							<select
								value={language}
								onChange={(event) => {
									void i18n.changeLanguage(event.target.value);
								}}
							>
								<option value="en">EN</option>
								<option value="fr">FR</option>
							</select>
							<Icon name="chevron" />
						</label>
					</nav>
				</div>
			</header>
			<main className="app-main" id={mainId}>
				<div className={`hero ${result || loading ? 'hero-compact' : ''}`}>
					<div className="hero-copy">
						<h1>{copy.headline}</h1>
						<p className="hero-description">{copy.intro}</p>
						<div className="platforms">
							{platforms.map((platform) => (
								<Platform key={platform} platform={platform} />
							))}
						</div>
					</div>
					<form
						className="converter-panel"
						onSubmit={(event) => {
							event.preventDefault();
							void convert();
						}}
						aria-busy={loading}
					>
						<label htmlFor={inputId} className="field-label">
							{copy.label}
						</label>
						<div
							className={`input-row ${error === 'invalid' || error === 'empty' ? 'input-invalid' : ''}`}
						>
							<Icon name="link" />
							<input
								ref={inputRef}
								id={inputId}
								type="text"
								autoComplete="off"
								spellCheck={false}
								value={url}
								disabled={loading}
								placeholder={copy.placeholder}
								aria-invalid={error === 'invalid' || error === 'empty'}
								aria-describedby={error ? errorId : helpId}
								onChange={(event) => {
									setUrl(event.target.value);
									setError('');
								}}
							/>
							{url && (
								<button
									className="icon-button"
									type="button"
									aria-label={copy.clear}
									disabled={loading}
									onClick={() => {
										setUrl('');
										setError('');
										inputRef.current?.focus();
									}}
								>
									<Icon name="x" />
								</button>
							)}
						</div>
						{detected && (
							<div className="detected">
								<Icon name="check" />
								{platformNames[detected]} · {copy.detected}
							</div>
						)}
						<button
							className="button primary full-width"
							type="submit"
							disabled={loading}
						>
							<Icon name={loading ? 'loader' : 'search'} />
							{loading ? copy.searching : copy.find}
							{!loading && <Icon name="arrow" />}
						</button>
						<p id={helpId} className="micro">
							{copy.noAccount}
						</p>
						{error && (
							<div className="error-message" id={errorId} role="alert">
								<Icon name="alert" />
								<div>
									<strong>
										{error === 'empty'
											? copy.emptyInput
											: error === 'invalid'
												? copy.invalid
												: copy.failed}
									</strong>
									{error === 'failed' && <p>{copy.failedCopy}</p>}
								</div>
							</div>
						)}
						{!result && !loading && (
							<button
								type="button"
								className="text-button example-button"
								onClick={() => {
									setUrl(
										'https://open.spotify.com/track/1WvvmEowf7hiz5EnyAwtTj',
									);
									setError('');
									inputRef.current?.focus();
								}}
							>
								<Icon name="music" />
								{copy.example}
							</button>
						)}
					</form>
				</div>
				{loading && (
					<section className="loading-panel" aria-live="polite">
						<div>
							<p className="eyebrow">{copy.searching}</p>
							<h2>{copy.loadingTitle}</h2>
							<p className="muted">{copy.loadingCopy}</p>
						</div>
						<div className="service-statuses">
							{platforms
								.filter((p) => p !== detected)
								.map((platform) => (
									<div className="service-status" key={platform}>
										<Platform platform={platform} />
										<Icon name="loader" />
										<span className="muted">{copy.searching}</span>
									</div>
								))}
						</div>
						<button
							className="text-button"
							type="button"
							onClick={() => {
								generation.current += 1;
								cancel();
								setLoading(false);
							}}
						>
							<Icon name="x" />
							{copy.cancel}
						</button>
					</section>
				)}
				<div ref={resultsRef} className="results-anchor">
					{result && (
						<Results
							result={result}
							onClear={reset}
							onCopy={(link) => {
								void copyLink(link);
							}}
							onRetry={() => {
								void convert(previousUrl.current);
							}}
							busy={loading}
							copyNotice={toast > 0 ? { url: copiedUrl, id: toast } : null}
						/>
					)}
				</div>
				{!result && !loading && (
					<div className="how-it-works">
						{(
							[
								{
									icon: 'link',
									title: copy.stepOne,
									description: copy.stepOneCopy,
								},
								{
									icon: 'search',
									title: copy.stepTwo,
									description: copy.stepTwoCopy,
								},
								{
									icon: 'headphones',
									title: copy.stepThree,
									description: copy.stepThreeCopy,
								},
							] as const
						).map((step, index) => (
							<div key={step.icon}>
								<span className="step-number">0{index + 1}</span>
								<h2>
									<Icon name={step.icon} />
									{step.title}
								</h2>
								<p>{step.description}</p>
							</div>
						))}
					</div>
				)}
			</main>
			<footer className="app-footer">
				<div>
					<button
						className="text-button"
						type="button"
						onClick={() => setHelpOpen(true)}
					>
						<Icon name="help" />
						{copy.help}
					</button>
					<a
						className="text-button"
						href="https://github.com/xenokratos/spoty2deezer"
						target="_blank"
						rel="noopener noreferrer"
					>
						GitHub
						<Icon name="external" />
					</a>
				</div>
			</footer>
			<output className="toast-region" aria-live="polite">
				{toast > 0 && (
					<div className="copy-toast" key={toast}>
						<Icon name="check" />
						{copy.copied}
					</div>
				)}
			</output>
			<output className="sr-only" aria-live="polite">
				{result && !loading
					? `${copy.resultTitle} ${result.destinations.map((destination) => `${platformNames[destination.platform]}: ${destination.failed ? copy.unavailable : destination.matches.length === 0 ? copy.noMatches : destination.matches.some((media) => media.search) ? copy.searchLink : copy.top}`).join('. ')}`
					: ''}
			</output>
			<Dialog
				open={helpOpen}
				title={copy.helpTitle}
				onClose={() => setHelpOpen(false)}
			>
				<p className="muted">{copy.helpCopy}</p>
				{platforms.map((platform) => (
					<div className="help-service" key={platform}>
						<Platform platform={platform} />
						<p>
							{platform === 'spotify'
								? copy.spotifyHelp
								: platform === 'deezer'
									? copy.deezerHelp
									: copy.youtubeHelp}
						</p>
						<code>
							{platform === 'spotify' ? (
								<>
									open.spotify.com/track/…
									<br />
									open.spotify.com/album/…
									<br />
									spotify:track:… · spotify:album:…
								</>
							) : platform === 'deezer' ? (
								<>
									deezer.com/en/track/…
									<br />
									deezer.com/album/…
									<br />
									link.deezer.com/s/…
								</>
							) : (
								<>
									music.youtube.com/watch?v=…
									<br />
									music.youtube.com/playlist?list=OLAK5uy_…
									<br />
									www.youtube.com/watch?v=…
									<br />
									m.youtube.com/watch?v=…
								</>
							)}
						</code>
					</div>
				))}
				<p className="notice">
					<Icon name="info" />
					{copy.unsupported}
				</p>
			</Dialog>
			<Dialog
				open={!!manualLink}
				title={copy.manualTitle}
				onClose={() => setManualLink('')}
			>
				<p className="muted">{copy.manualCopy}</p>
				<label className="field-label" htmlFor={manualId}>
					{copy.label}
				</label>
				<input
					className="manual-link"
					id={manualId}
					ref={manualRef}
					readOnly
					value={manualLink}
					onFocus={(event) => event.target.select()}
				/>
				<button
					className="button primary"
					type="button"
					onClick={() => {
						manualRef.current?.focus();
						manualRef.current?.select();
					}}
				>
					<Icon name="copy" />
					{copy.select}
				</button>
			</Dialog>
		</div>
	);
}
