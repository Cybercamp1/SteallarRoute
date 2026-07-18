import { useEffect, useRef, useState, useCallback } from 'react';
import styles from './LandingPage.module.css';

/* ─── Animated Counter Hook ─── */
function useAnimatedCounter(target: number, duration = 2000, suffix = ''): string {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  const animate = useCallback(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    };

    requestAnimationFrame(tick);
  }, [target, duration]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          animate();
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [animate]);

  const formatted =
    target >= 1000
      ? `${(count / 1000).toFixed(count >= target ? 0 : 1)}K`
      : count.toString();

  return `${formatted}${suffix}`;
}

/* ─── Fade-in on scroll Hook ─── */
function useFadeInOnScroll<T extends HTMLElement>(): React.RefObject<T | null> {
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add(styles.fadeInUp);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return ref;
}

/* ─── Feature data ─── */
interface Feature {
  icon: string;
  title: string;
  description: string;
}

const FEATURES: Feature[] = [
  {
    icon: '⚡',
    title: 'Lightning Fast',
    description:
      'Path discovery in under 3 seconds using Stellar\'s native DEX and real-time orderbook scanning.',
  },
  {
    icon: '💰',
    title: 'Lowest Fees',
    description:
      'AI scoring finds the most cost-effective route across all anchors, saving you up to 60% on fees.',
  },
  {
    icon: '🛡️',
    title: 'Secure & Transparent',
    description:
      'All transactions recorded on Stellar blockchain with full auditability and end-to-end encryption.',
  },
  {
    icon: '🌍',
    title: 'Global Coverage',
    description:
      'Access to Stellar\'s worldwide anchor network for 50+ currencies across 6 continents.',
  },
  {
    icon: '📊',
    title: 'Smart Analytics',
    description:
      'Track your transfer history and route performance over time with rich visual dashboards.',
  },
  {
    icon: '⭐',
    title: 'Community Ratings',
    description:
      'User feedback drives our route reliability scores, ensuring you always pick trusted anchors.',
  },
];

/* ─── Step data ─── */
interface Step {
  number: number;
  icon: string;
  title: string;
  description: string;
}

const STEPS: Step[] = [
  {
    number: 1,
    icon: '🔗',
    title: 'Connect Wallet',
    description: 'Link your Stellar wallet via Freighter in one click — no signups, no KYC delays.',
  },
  {
    number: 2,
    icon: '💱',
    title: 'Choose Amount & Currency',
    description:
      'Enter how much you want to send and pick your source and destination currencies.',
  },
  {
    number: 3,
    icon: '🚀',
    title: 'Compare & Send',
    description:
      'View AI-ranked routes with transparent fee breakdowns and execute your payment instantly.',
  },
];

/* ─── Stat data ─── */
interface Stat {
  value: number;
  suffix: string;
  label: string;
}

const STATS: Stat[] = [
  { value: 12400, suffix: '+', label: 'Routes Analyzed' },
  { value: 3200, suffix: '+', label: 'Total Transfers' },
  { value: 50, suffix: '+', label: 'Countries Supported' },
  { value: 42, suffix: '%', label: 'Average Savings' },
];

/* ─── Stat Counter Component ─── */
function StatCounter({ value, suffix, label }: Stat) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const startTime = performance.now();
          const duration = 2200;

          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(tick);
          };

          requestAnimationFrame(tick);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value]);

  const formatted =
    value >= 10000
      ? `${(count / 1000).toFixed(count >= value ? 1 : 1)}K`
      : count.toLocaleString();

  return (
    <div className={styles.statItem}>
      <span ref={ref} className={styles.statValue} aria-label={`${value}${suffix} ${label}`}>
        {formatted}{suffix}
      </span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════
   LANDING PAGE COMPONENT
   ═══════════════════════════════════════════ */

const LandingPage: React.FC = () => {
  /* Animated counters for hero stats */
  const routesScanned = useAnimatedCounter(1200, 2000, '+');
  const transferred = useAnimatedCounter(50, 2000, 'K+');
  const successRate = '98.5%'; // static – looks better as precise number

  /* Fade-in refs for sections */
  const problemRef = useFadeInOnScroll<HTMLDivElement>();
  const featuresRef = useFadeInOnScroll<HTMLDivElement>();
  const howRef = useFadeInOnScroll<HTMLDivElement>();
  const ctaRef = useFadeInOnScroll<HTMLDivElement>();

  return (
    <div className={styles.landingPage}>
      {/* ═══════════ HERO ═══════════ */}
      <section className={styles.hero} aria-label="Hero section">
        {/* Floating gradient orbs */}
        <div className={styles.orbContainer} aria-hidden="true">
          <div className={`${styles.orb} ${styles.orb1}`} />
          <div className={`${styles.orb} ${styles.orb2}`} />
          <div className={`${styles.orb} ${styles.orb3}`} />
        </div>

        <div className={styles.heroContent}>
          <h1 className={styles.heroHeadline}>
            Find the Best Cross-Border Payment Route on Stellar
          </h1>
          <p className={styles.heroSubtitle}>
            AnchorRoute scans Stellar's anchor network in real-time to find you the cheapest,
            fastest path for cross-border remittance.
          </p>

          <div className={styles.heroCta}>
            <button type="button" className={styles.btnPrimary} aria-label="Start sending payments">
              <span aria-hidden="true">🚀</span> Start Sending
            </button>
            <button type="button" className={styles.btnSecondary} aria-label="Learn how it works">
              How It Works <span aria-hidden="true">→</span>
            </button>
          </div>

          <div className={styles.heroStats} aria-label="Platform statistics">
            <div className={styles.heroStatItem}>
              <span className={styles.heroStatValue}>{routesScanned}</span>
              <span className={styles.heroStatLabel}>Routes Scanned</span>
            </div>
            <div className={styles.heroStatItem}>
              <span className={styles.heroStatValue}>${transferred}</span>
              <span className={styles.heroStatLabel}>Transferred</span>
            </div>
            <div className={styles.heroStatItem}>
              <span className={styles.heroStatValue}>{successRate}</span>
              <span className={styles.heroStatLabel}>Success Rate</span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════ PROBLEM / SOLUTION ═══════════ */}
      <section
        className={`${styles.problemSolution} ${styles.section}`}
        aria-label="Problem and solution"
      >
        <h2 className={styles.sectionTitle}>Why AnchorRoute?</h2>
        <hr className={styles.gradientDivider} />
        <p className={styles.sectionSubtitle}>
          Cross-border payments shouldn't be a guessing game. We turn complexity into clarity.
        </p>

        <div ref={problemRef} className={styles.psGrid}>
          {/* Problem Card */}
          <article className={`${styles.psCard} ${styles.psProblem}`}>
            <span className={`${styles.psCardLabel} ${styles.psProblemLabel}`}>
              <span aria-hidden="true">✕</span> The Problem
            </span>
            <h3 className={styles.psCardTitle}>Flying Blind with Cross-Border Transfers</h3>
            <p className={styles.psCardText}>
              Users have no visibility into which anchor or corridor offers the best exchange rate.
              Comparing routes manually across multiple anchors is time-consuming and error-prone —
              often resulting in hidden fees and missed savings.
            </p>
          </article>

          {/* Connector */}
          <div className={styles.psConnector} aria-hidden="true">
            <div className={styles.psConnectorDot} />
            <div className={styles.psConnectorLine} />
            <div className={styles.psConnectorDot} />
          </div>

          {/* Solution Card */}
          <article className={`${styles.psCard} ${styles.psSolution}`}>
            <span className={`${styles.psCardLabel} ${styles.psSolutionLabel}`}>
              <span aria-hidden="true">✓</span> The Solution
            </span>
            <h3 className={styles.psCardTitle}>AI-Powered Route Optimization</h3>
            <p className={styles.psCardText}>
              AnchorRoute's AI-powered engine scans all available paths in real-time, scores them by
              cost, speed, and reliability, and recommends the optimal route — all in seconds. No
              more guesswork.
            </p>
          </article>
        </div>
      </section>

      {/* ═══════════ FEATURES ═══════════ */}
      <section className={`${styles.features} ${styles.section}`} aria-label="Features">
        <h2 className={styles.sectionTitle}>Built for Speed, Trust, and Savings</h2>
        <hr className={styles.gradientDivider} />
        <p className={styles.sectionSubtitle}>
          Every feature is designed to make your cross-border payments faster, cheaper, and more
          transparent.
        </p>

        <div ref={featuresRef} className={styles.featuresGrid}>
          {FEATURES.map((feature, index) => (
            <article
              key={feature.title}
              className={`${styles.featureCard} ${styles[`delay${index + 1}` as keyof typeof styles] || ''}`}
            >
              <span className={styles.featureIcon} aria-hidden="true">
                {feature.icon}
              </span>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDesc}>{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ═══════════ HOW IT WORKS ═══════════ */}
      <section
        className={`${styles.howItWorks} ${styles.section}`}
        aria-label="How it works"
      >
        <h2 className={styles.sectionTitle}>How It Works</h2>
        <hr className={styles.gradientDivider} />
        <p className={styles.sectionSubtitle}>
          Three simple steps to find and execute the best cross-border payment route.
        </p>

        <div ref={howRef} className={styles.stepsContainer}>
          {STEPS.map((step, index) => (
            <div key={step.number}>
              {/* Vertical connector for mobile (between steps) */}
              {index > 0 && (
                <div className={styles.stepConnectorVertical} aria-hidden="true" />
              )}
              <div className={styles.step}>
                <div className={styles.stepIndicator}>
                  <div className={styles.stepNumber} aria-label={`Step ${step.number}`}>
                    {step.number}
                  </div>
                </div>

                {/* Horizontal connector (desktop) */}
                {index < STEPS.length - 1 && (
                  <div className={styles.stepConnector} aria-hidden="true" />
                )}

                <span className={styles.stepIcon} aria-hidden="true">
                  {step.icon}
                </span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepDesc}>{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════ STATS BAR ═══════════ */}
      <section className={styles.statsBar} aria-label="Platform statistics">
        <div className={styles.statsGrid}>
          {STATS.map((stat) => (
            <StatCounter key={stat.label} {...stat} />
          ))}
        </div>
      </section>

      {/* ═══════════ CTA ═══════════ */}
      <section className={`${styles.cta} ${styles.section}`} aria-label="Call to action">
        <div className={styles.ctaBg} aria-hidden="true" />
        <div className={styles.ctaOrb1} aria-hidden="true" />
        <div className={styles.ctaOrb2} aria-hidden="true" />

        <div ref={ctaRef} className={styles.ctaInner}>
          <h2 className={styles.ctaTitle}>Ready to find the best route?</h2>
          <p className={styles.ctaSubtitle}>
            Start your first transfer in under a minute. No signups, no hidden fees — just the
            fastest path from A to B.
          </p>
          <button type="button" className={styles.btnCta} aria-label="Connect wallet and start">
            <span aria-hidden="true">⚡</span> Connect Wallet &amp; Start
          </button>
        </div>
      </section>

      {/* ═══════════ FOOTER ═══════════ */}
      <footer className={styles.footer} aria-label="Site footer">
        <div className={styles.footerGrid}>
          {/* Brand Column */}
          <div className={styles.footerBrand}>
            <div className={styles.footerLogo}>
              <span className={styles.footerLogoIcon} aria-hidden="true">⚓</span>
              AnchorRoute
            </div>
            <p className={styles.footerTagline}>
              Find the cheapest, fastest cross-border payment route on the Stellar network. Powered
              by AI, secured by blockchain.
            </p>
            <div className={styles.footerStellarBadge}>
              <span aria-hidden="true">✦</span> Built on Stellar
            </div>
          </div>

          {/* Links Column */}
          <nav className={styles.footerColumn} aria-label="Site navigation">
            <h4>Links</h4>
            <ul className={styles.footerLinks}>
              <li><a href="#hero">Home</a></li>
              <li><a href="#dashboard">Dashboard</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
              </li>
            </ul>
          </nav>

          {/* Built With Column */}
          <div className={styles.footerColumn}>
            <h4>Built With</h4>
            <ul className={styles.footerLinks}>
              <li><a href="https://stellar.org" target="_blank" rel="noopener noreferrer">Stellar Network</a></li>
              <li><a href="https://soroban.stellar.org" target="_blank" rel="noopener noreferrer">Soroban Smart Contracts</a></li>
              <li><a href="https://react.dev" target="_blank" rel="noopener noreferrer">React 18</a></li>
              <li><a href="https://www.typescriptlang.org" target="_blank" rel="noopener noreferrer">TypeScript</a></li>
            </ul>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <span className={styles.footerCopyright}>
            © {new Date().getFullYear()} AnchorRoute. Open-source on Stellar.
          </span>
          <div className={styles.footerSocials}>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="GitHub"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Twitter"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href="https://discord.com"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialLink}
              aria-label="Discord"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
