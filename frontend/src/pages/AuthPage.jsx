import "../styles/auth.css";
import { SignInButton, SignUpButton } from "@clerk/clerk-react";
import {
  ArrowRight,
  Hash,
  Lock,
  MessagesSquare,
  ShieldCheck,
  Sparkles,
  Video,
  Zap,
} from "lucide-react";

const FEATURES = [
  {
    icon: MessagesSquare,
    title: "Channels & direct messages",
    description: "Organise conversations by topic or talk one-to-one.",
  },
  {
    icon: Video,
    title: "Video calls & meetings",
    description: "Jump from a thread into a face-to-face call in one click.",
  },
  {
    icon: ShieldCheck,
    title: "Secure & private",
    description: "Authenticated sessions and private channels by default.",
  },
];

const TRUST_ITEMS = [
  { icon: Lock, label: "Encrypted in transit" },
  { icon: Zap, label: "Real-time sync" },
  { icon: Sparkles, label: "Free to start" },
];

const AuthPage = () => {
  return (
    <main className="auth-container">
      <section className="auth-left" aria-labelledby="auth-title">
        <div className="auth-hero">
          <div className="brand-container">
            <img src="/logo.png" alt="" className="brand-logo" width="56" height="56" />
            <span className="brand-name">Slap</span>
          </div>

          <span className="hero-eyebrow">
            <span className="hero-eyebrow__dot" aria-hidden="true" />
            Real-time team chat
          </span>

          <h1 id="auth-title" className="hero-title">
            Where work <span className="hero-title__accent">happens</span>
          </h1>

          <p className="hero-subtitle">
            Connect with your team instantly through secure, real-time messaging. Channels, direct
            messages and video calls — all in one focused workspace.
          </p>

          <ul className="features-list">
            {FEATURES.map((feature) => (
              <li key={feature.title} className="feature-item">
                <span className="feature-icon" aria-hidden="true">
                  <feature.icon size={20} strokeWidth={2} />
                </span>
                <span className="feature-text">
                  <span className="feature-title">{feature.title}</span>
                  <span className="feature-description">{feature.description}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="cta-group">
            <SignUpButton mode="modal">
              <button type="button" className="cta-button">
                Get started with Slap
                <ArrowRight className="button-arrow" size={20} aria-hidden="true" />
              </button>
            </SignUpButton>

            <SignInButton mode="modal">
              <button type="button" className="cta-secondary">
                I already have an account
              </button>
            </SignInButton>
          </div>

          <ul className="trust-row" aria-label="Why teams choose Slap">
            {TRUST_ITEMS.map((item) => (
              <li key={item.label} className="trust-item">
                <item.icon size={16} aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="auth-right" aria-hidden="true">
        <div className="auth-image-container">
          <img
            src="/auth-i.png"
            alt=""
            className="auth-image"
            loading="lazy"
            decoding="async"
          />
          <div className="image-overlay"></div>

          <div className="floating-card floating-card--top">
            <span className="floating-card__icon">
              <Hash size={16} />
            </span>
            <span>
              <strong>general</strong>
              <small>12 new messages</small>
            </span>
          </div>

          <div className="floating-card floating-card--bottom">
            <span className="floating-card__icon floating-card__icon--live">
              <Video size={16} />
            </span>
            <span>
              <strong>Design sync</strong>
              <small>Live · 4 participants</small>
            </span>
          </div>
        </div>
      </section>
    </main>
  );
};
export default AuthPage;
