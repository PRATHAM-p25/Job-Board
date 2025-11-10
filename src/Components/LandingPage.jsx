import React from 'react';
import { useNavigate } from 'react-router-dom';
import './LandingPage.css';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-fullscreen">
      <header className="landing-header">
        <h2 className="landing-logo">Job–Board</h2>
        <nav className="landing-nav">
        </nav>
      </header>

      <main className="landing-hero">
        <div className="landing-text">
          <h1>
            <span className="highlight">Launch</span> your<br />Career Path
          </h1>
          <p>A central hub for securing opportunity.</p>
          < button onClick={() => navigate('/auth?tab=signin')} className="get-started">
            Get Started
          </button>
        </div>
        <div className="landing-glow"></div>
      </main>
    </div>
  );
}
