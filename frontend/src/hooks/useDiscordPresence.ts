import { useEffect } from 'react';
import { AuthUser } from './useAuth';

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes (presence expires after 20)

/**
 * Keeps the Discord Rich Presence activity alive while the user has the
 * site open. Pings the backend refresh endpoint every 15 minutes.
 * Only active when the user is logged in via Discord.
 */
export function useDiscordPresence(user: AuthUser | null) {
    useEffect(() => {
        if (!user || user.provider !== 'discord') return;

        // Ping immediately on mount (in case of page refresh)
        const ping = () =>
            fetch('/api/auth/presence/refresh', {
                method: 'POST',
                credentials: 'include',
            }).catch(() => {});

        ping();

        const timer = setInterval(ping, REFRESH_INTERVAL_MS);
        return () => clearInterval(timer);
    }, [user?.id, user?.provider]);
}
