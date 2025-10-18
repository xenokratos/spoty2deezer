export function urlProxy(url: string): string {
	if (import.meta.env.MODE === 'development') {
		return `/proxy?url=${encodeURIComponent(url)}`;
	}
	return url; // prod -> real URL (needs a real backend proxy if you need to READ it)
}
