'use client';

import * as React from 'react';

const STORAGE_KEY = 'auth_rate_limit';
const MAX_ATTEMPTS = 5;
const INITIAL_COOLDOWN_MS = 60_000;
const BACKOFF_FACTOR = 2;

type RateLimitState = {
    count: number;
    cooldownUntil: number | null;
};

function readState(): RateLimitState {
    if (typeof window === 'undefined') return { count: 0, cooldownUntil: null };
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { count: 0, cooldownUntil: null };
        return JSON.parse(raw) as RateLimitState;
    } catch {
        return { count: 0, cooldownUntil: null };
    }
}

function writeState(state: RateLimitState): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch { /* quota exceeded - degrade gracefully */ }
}

export function useRateLimiter() {
    const [state, setState] = React.useState<RateLimitState>(readState);

    React.useEffect(() => {
        writeState(state);
    }, [state]);

    const recordAttempt = React.useCallback((failed: boolean) => {
        setState(prev => {
            const count = failed ? prev.count + 1 : 0;
            const cooldownUntil =
                failed && count >= MAX_ATTEMPTS
                    ? Date.now() + INITIAL_COOLDOWN_MS * Math.pow(BACKOFF_FACTOR, count - MAX_ATTEMPTS)
                    : null;
            return { count, cooldownUntil };
        });
    }, []);

    const isBlocked = React.useMemo(() => {
        if (!state.cooldownUntil) return false;
        if (Date.now() >= state.cooldownUntil) {
            setState(prev => ({ ...prev, cooldownUntil: null }));
            return false;
        }
        return true;
    }, [state.cooldownUntil]);

    const remainingMs = React.useMemo(() => {
        if (!state.cooldownUntil) return 0;
        return Math.max(0, state.cooldownUntil - Date.now());
    }, [state.cooldownUntil]);

    const reset = React.useCallback(() => {
        setState({ count: 0, cooldownUntil: null });
    }, []);

    return { attemptCount: state.count, isBlocked, remainingMs, recordAttempt, reset };
}
