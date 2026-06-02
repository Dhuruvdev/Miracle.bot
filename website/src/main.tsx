import { StrictMode } from 'react';
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
import { SignIn } from './SignIn';

function AuthGate() {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#292a2c',
            }}>
                <div style={{ position: 'relative', width: '6rem', height: '6rem' }}>
                    {/* Spinning conic-gradient arc ring */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: 'conic-gradient(from 0deg, #5758e6 0%, #8b8cf8 55%, transparent 72%)',
                        WebkitMask: 'radial-gradient(farthest-side, transparent calc(100% - 7px), white calc(100% - 6px))',
                        mask: 'radial-gradient(farthest-side, transparent calc(100% - 7px), white calc(100% - 6px))',
                        animation: 'oe-spin 0.9s linear infinite',
                        filter: 'drop-shadow(0 0 6px rgba(87,88,230,0.9))',
                    }} />
                    {/* Static faint track ring */}
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        border: '6px solid rgba(87,88,230,0.12)',
                    }} />
                    {/* Power-button icon in centre */}
                    <div style={{
                        position: 'absolute',
                        inset: '22%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        animation: 'oe-pulse 2s ease-in-out infinite',
                    }}>
                        <svg viewBox="0 0 24 24" style={{
                            width: '100%', height: '100%',
                            fill: 'none',
                            stroke: '#5758e6',
                            strokeWidth: 2.5,
                            strokeLinecap: 'round',
                            filter: 'drop-shadow(0 0 5px rgba(87,88,230,0.95))',
                        }}>
                            <path d="M12 2v7" />
                            <path d="M6.2 5.8A8 8 0 1 0 17.8 5.8" />
                        </svg>
                    </div>
                </div>
                <style>{`
                    @keyframes oe-spin  { to { transform: rotate(360deg); } }
                    @keyframes oe-pulse {
                        0%, 100% { opacity: 0.6; transform: scale(0.95); }
                        50%       { opacity: 1;   transform: scale(1.05); }
                    }
                `}</style>
            </div>
        );
    }

    if (!isAuthenticated) return <SignIn />;

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

const root = createRoot(document.getElementById('root')!);

root.render(
  <StrictMode>
    <AuthGate />
  </StrictMode>,
)
