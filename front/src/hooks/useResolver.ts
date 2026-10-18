import { useCallback, useEffect, useRef } from 'react';
import type { Resolution } from '../../../back/lib/contract';
import { isResolution } from '../utils/resolutionContract';

export function useResolver() {
	const controller = useRef<AbortController | null>(null);
	const cancel = useCallback(() => {
		controller.current?.abort();
		controller.current = null;
	}, []);
	useEffect(() => cancel, [cancel]);
	const resolve = useCallback(
		async (url: string): Promise<Resolution> => {
			cancel();
			const current = new AbortController();
			controller.current = current;
			const base = import.meta.env.DEV
				? ''
				: (
						import.meta.env.VITE_API_URL ??
						import.meta.env.VITE_PROXY_TARGET ??
						''
					).replace(/\/$/, '');
			try {
				const response = await fetch(`${base}/api/resolve`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ url }),
					signal: current.signal,
				});
				if (!response.ok) throw new Error('Resolution failed');
				const value: unknown = await response.json();
				if (!isResolution(value)) throw new Error('Invalid resolver response');
				return value;
			} finally {
				if (controller.current === current) controller.current = null;
			}
		},
		[cancel],
	);
	return { resolve, cancel };
}
