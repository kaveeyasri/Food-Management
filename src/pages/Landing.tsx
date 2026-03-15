import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Leaf, ArrowRight, Utensils, Heart, MapPin, Zap, Shield, Globe, TrendingUp } from 'lucide-react';

const STATS = [
  { label: 'Meals Saved', value: '12,480+' },
  { label: 'NGOs Registered', value: '340+' },
  { label: 'Cities Active', value: '28' },
  { label: 'Donors', value: '1,600+' },
];

const HOW_IT_WORKS = [
  {
    step: '01',
    icon: <Utensils size={28} />,
    title: 'Donors Upload Surplus',
    desc: 'Restaurants, hotels & households post available food with quantity, type, and pickup location.',
  },
  {
    step: '02',
    icon: <Zap size={28} />,
    title: 'Instant Notifications',
    desc: 'Nearby NGOs and individuals receive real-time alerts about available food in their radius.',
  },
  {
    step: '03',
    icon: <Heart size={28} />,
    title: 'Collect & Redistribute',
    desc: 'Receivers claim, confirm, and collect food — turning waste into nourishment.',
  },
];

const FEATURES = [
  { icon: <MapPin size={24} />, title: 'Geofenced Listings', desc: 'Only see food donations within your configured radius.' },
  { icon: <Zap size={24} />, title: 'Real-time Updates', desc: 'Live dashboard powered by Supabase Realtime — no refresh needed.' },
  { icon: <Shield size={24} />, title: 'Verified Donors', desc: 'Role-based profiles for restaurants, NGOs, individuals & more.' },
  { icon: <Globe size={24} />, title: 'Interactive Map', desc: 'Leaflet-powered map with urgency-colored markers for instant visual triage.' },
  { icon: <TrendingUp size={24} />, title: 'Impact Tracking', desc: 'Track your donation and claim history with detailed statistics.' },
  { icon: <Leaf size={24} />, title: 'Carbon-Positive', desc: 'Every meal saved reduces methane emissions from landfill food decomposition.' },
];

const Landing: React.FC = () => {
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.1 }
    );
    document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <div className="landing">
      {/* Hero */}
      <section className="hero">
        <div className="hero-bg-orbs">
          <div className="orb orb-1" />
          <div className="orb orb-2" />
          <div className="orb orb-3" />
        </div>
        <div className="hero-content">
          <div className="hero-badge animate-on-scroll">
            <Leaf size={14} /> Real-Time Food Redistribution Network
          </div>
          <h1 className="hero-title animate-on-scroll">
            Turn Surplus Food<br />
            <span className="gradient-text">Into Hope</span>
          </h1>
          <p className="hero-subtitle animate-on-scroll">
            FoodBridge connects food donors with NGOs and individuals in need — 
            using real-time location services to ensure every meal reaches someone before it's too late.
          </p>
          <div className="hero-cta animate-on-scroll">
            <Link to="/auth?mode=signup" className="btn-hero-primary">
              Start Donating <ArrowRight size={18} />
            </Link>
            <Link to="/dashboard" className="btn-hero-secondary">
              Browse Listings
            </Link>
          </div>
        </div>
        <div className="hero-visual animate-on-scroll">
          <div className="hero-card-stack">
            <div className="preview-card card-fresh-preview">
              <div className="preview-card-header">
                <span className="preview-dot green" />
                <strong>Biryani (10kg)</strong>
                <span className="preview-badge veg">Veg</span>
              </div>
              <div className="preview-card-meta">📍 MG Road · ⏱ 6 hrs left</div>
            </div>
            <div className="preview-card card-moderate-preview">
              <div className="preview-card-header">
                <span className="preview-dot yellow" />
                <strong>Mixed Veg Curry (5kg)</strong>
                <span className="preview-badge nonveg">Non-Veg</span>
              </div>
              <div className="preview-card-meta">📍 Koramangala · ⏱ 2 hrs left</div>
            </div>
            <div className="preview-card card-urgent-preview">
              <div className="preview-card-header">
                <span className="preview-dot red" />
                <strong>Bread Rolls (50 pcs)</strong>
                <span className="preview-badge vegan">Vegan</span>
              </div>
              <div className="preview-card-meta">📍 Indiranagar · ⏱ 18 min left</div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats-section" ref={statsRef}>
        {STATS.map((stat, i) => (
          <div key={i} className="stat-item animate-on-scroll">
            <div className="stat-value">{stat.value}</div>
            <div className="stat-label">{stat.label}</div>
          </div>
        ))}
      </section>

      {/* How It Works */}
      <section className="how-section">
        <div className="section-header animate-on-scroll">
          <h2>How FoodBridge Works</h2>
          <p>A seamless 3-step process that turns food surplus into community nourishment</p>
        </div>
        <div className="how-steps">
          {HOW_IT_WORKS.map((step, i) => (
            <div key={i} className="how-step animate-on-scroll">
              <div className="step-number">{step.step}</div>
              <div className="step-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
              {i < HOW_IT_WORKS.length - 1 && <div className="step-connector" />}
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="features-section">
        <div className="section-header animate-on-scroll">
          <h2>Built for Impact</h2>
          <p>Every feature is designed to maximize food saved and minimize spoilage</p>
        </div>
        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <div key={i} className="feature-card animate-on-scroll">
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-section animate-on-scroll">
        <div className="cta-content">
          <h2>Ready to make a difference?</h2>
          <p>Join thousands of donors and receivers building a zero-waste future.</p>
          <div className="cta-btns">
            <Link to="/auth?mode=signup" className="btn-hero-primary">
              Join FoodBridge <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <Leaf size={20} />
          <span>FoodBridge</span>
        </div>
        <p>© 2026 FoodBridge — Every meal saved matters.</p>
      </footer>
    </div>
  );
};

export default Landing;
