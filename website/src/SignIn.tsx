import Styles from './SignIn.module.css';

export function SignIn() {
    return (
        <div className={Styles.page}>
            <div className={Styles.left}>
                <div className={Styles.brand}>
                    <span className={Styles.brandDot} />
                    <span className={Styles.brandName}>OpenEmbedded</span>
                </div>

                <h1 className={Styles.headline}>
                    Build <em>Discord</em> components<br />
                    visually, in seconds.
                </h1>
                <p className={Styles.sub}>
                    Design buttons, dropdowns, containers and more with a drag-and-drop canvas. Send directly to any Discord channel via webhook or bot.
                </p>

                <div className={Styles.features}>
                    <div className={Styles.feature}>
                        <span className={Styles.featureIcon}>🎨</span>
                        Drag-and-drop component builder
                    </div>
                    <div className={Styles.feature}>
                        <span className={Styles.featureIcon}>⚡</span>
                        Instant live preview
                    </div>
                    <div className={Styles.feature}>
                        <span className={Styles.featureIcon}>🤖</span>
                        Send via webhook or bot
                    </div>
                    <div className={Styles.feature}>
                        <span className={Styles.featureIcon}>{'</>'}</span>
                        Code generator for all libraries
                    </div>
                </div>
            </div>

            <div className={Styles.right}>
                <div className={Styles.card}>
                    <div className={Styles.mobileBrand}>
                        <span className={Styles.mobileDot} />
                        <span className={Styles.mobileName}>OpenEmbedded</span>
                    </div>

                    <div className={Styles.lockIcon}>🔐</div>

                    <h2 className={Styles.title}>Welcome back</h2>
                    <p className={Styles.description}>
                        Sign in to access the OpenEmbedded Discord component builder.
                    </p>

                    <a href="/api/login" className={Styles.signInButton}>
                        Sign In
                    </a>

                    <div className={Styles.securityNote}>
                        <span className={Styles.securityDot} />
                        Secured with OpenID Connect · Session encrypted
                    </div>

                    <div className={Styles.footer}>
                        © {new Date().getFullYear()} OpenEmbedded
                    </div>
                </div>
            </div>
        </div>
    );
}
