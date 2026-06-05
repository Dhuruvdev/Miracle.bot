import { StrictMode, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import 'emoji-mart/css/emoji-mart.css'
import 'components-sdk/components-sdk.css'
import './index.css'
import './slider.css'
import './i18n'
import App from './App'
import {store} from './state'
import {Provider} from 'react-redux'
import { ButtonActionsProvider } from './ButtonActionsContext';
import { ResponseBuilderProvider } from './ResponseBuilderContext';
import { useAuth } from './hooks/useAuth';
import { useDiscordPresence } from './hooks/useDiscordPresence';
import { SignIn } from './SignIn';
import { ToastProvider } from './Toast';
import { TermsPage } from './TermsPage';
import { PrivacyPage } from './PrivacyPage';

function AuthGate() {
    const { user, isAuthenticated, isLoading } = useAuth();
    useDiscordPresence(user);

    // Detect ?discord_connected=1 set by the OAuth callback redirect
    const [discordJustConnected, setDiscordJustConnected] = useState(() => {
        const params = new URLSearchParams(window.location.search);
        const yes = params.get('discord_connected') === '1';
        if (yes) window.history.replaceState({}, '', window.location.pathname);
        return yes;
    });

    // Auto-dismiss the "connected" screen after 1.8s once we know user is authed
    useEffect(() => {
        if (!discordJustConnected || isLoading) return;
        if (!isAuthenticated) {
            setDiscordJustConnected(false);
            return;
        }
        const t = setTimeout(() => setDiscordJustConnected(false), 1800);
        return () => clearTimeout(t);
    }, [discordJustConnected, isAuthenticated, isLoading]);

    // ── Loading spinner ───────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#202226',
            }}>
                <div style={{ position: 'relative', width: '6rem', height: '6rem' }}>
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        border: '8px solid rgba(88,101,242,0.2)',
                    }} />
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        border: '8px solid transparent',
                        borderTopColor: '#5865F2',
                        borderRightColor: '#5865F2',
                        animation: 'oe-spin 0.9s linear infinite',
                    }} />
                </div>
                <style>{`
                    @keyframes oe-spin { to { transform: rotate(360deg); } }
                `}</style>
            </div>
        );
    }

    if (!isAuthenticated) return <SignIn />;

    // ── Discord connected success screen ──────────────────────────────────────
    if (discordJustConnected) {
        const displayName = user?.username ?? user?.email ?? 'there';
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#202226',
                gap: '1.75rem',
            }}>
                <style>{`
                    @keyframes oe-connected-pop {
                        0%   { transform: scale(0.4); opacity: 0; }
                        70%  { transform: scale(1.08); opacity: 1; }
                        100% { transform: scale(1);    opacity: 1; }
                    }
                    @keyframes oe-connected-fade {
                        from { opacity: 0; transform: translateY(8px); }
                        to   { opacity: 1; transform: translateY(0); }
                    }
                `}</style>

                <div style={{
                    width: '5.5rem', height: '5.5rem',
                    background: 'linear-gradient(135deg,#5865F2,#4752c4)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'oe-connected-pop 0.45s cubic-bezier(0.175,0.885,0.32,1.275) forwards',
                    boxShadow: '0 0 40px rgba(88,101,242,0.4)',
                }}>
                    <svg width="2.2rem" height="2.2rem" viewBox="0 0 24 24" fill="none"
                         stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                    </svg>
                </div>

                <div style={{ textAlign: 'center', animation: 'oe-connected-fade 0.4s 0.2s ease-out both' }}>
                    <h2 style={{
                        color: '#fff', margin: '0 0 0.5rem',
                        fontSize: '1.4rem', fontWeight: 700, fontFamily: 'inherit',
                    }}>
                        Discord Connected!
                    </h2>
                    <p style={{ color: '#b9bbbe', margin: 0, fontSize: '0.95rem' }}>
                        Welcome back, <strong style={{ color: '#fff' }}>{displayName}</strong>
                    </p>
                </div>

                <div style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    color: '#72767d', fontSize: '0.8rem',
                    animation: 'oe-connected-fade 0.4s 0.35s ease-out both',
                }}>
                    <div style={{
                        width: '0.55rem', height: '0.55rem',
                        border: '2px solid rgba(88,101,242,0.3)',
                        borderTop: '2px solid #5865F2',
                        borderRadius: '50%',
                        animation: 'oe-spin 0.8s linear infinite',
                    }} />
                    Loading your workspace…
                </div>
            </div>
        );
    }

    // ── Main app ──────────────────────────────────────────────────────────────
    return (
        <Provider store={store}>
            <ButtonActionsProvider>
                <ResponseBuilderProvider>
                    <App />
                </ResponseBuilderProvider>
            </ButtonActionsProvider>
        </Provider>
    );
}

function Root() {
    const path = window.location.pathname.replace(/\/$/, '');
    if (path === '/terms')   return <TermsPage />;
    if (path === '/privacy') return <PrivacyPage />;
    return (
        <ToastProvider>
            <AuthGate />
        </ToastProvider>
    );
}

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <Root />
  </StrictMode>,
)
