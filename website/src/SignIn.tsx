import Styles from './SignIn.module.css';

export function SignIn() {
    return (
        <div className={Styles.page}>
            <div className={Styles.card}>
                <div className={Styles.brand}>
                    <span className={Styles.brandDot} />
                    <span className={Styles.brandName}>OpenEmbedded</span>
                </div>

                <h1 className={Styles.title}>Sign in to continue</h1>
                <p className={Styles.description}>
                    Build Discord components visually, in seconds.
                </p>

                <a href="/api/login" className={Styles.signInButton}>
                    Sign In
                </a>
            </div>
        </div>
    );
}
