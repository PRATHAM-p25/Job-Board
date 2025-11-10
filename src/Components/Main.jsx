import React, { useState } from 'react';
import SignIn from './SignIn';
import Signup from './SignUp';
import './Main.css';

export default function Main() {
  const [isSignIn, setIsSignIn] = useState(true);

  return (
    <div className="main-page">
      <div className="auth-card">

        <div className="auth-left">
          <div className="brand">
            <h1>Campus Career Portal</h1>
            <p className="tag">Your Path to Professional Success</p>
          </div>

          <div className="visual">
            <div className="visual-card">Role Management & Discovery</div>
          </div>

          <p className="desc">Find the perfect role within our network.</p>
        </div>

        <div className="auth-right">
          <div className="tabs" role="tablist" aria-label="Sign in and Sign up">
            <button
              role="tab"
              aria-selected={isSignIn}
              className={`tab ${isSignIn ? 'active' : ''}`}
              onClick={() => setIsSignIn(true)}
            >
              Sign In
            </button>

            <button
              role="tab"
              aria-selected={!isSignIn}
              className={`tab ${!isSignIn ? 'active' : ''}`}
              onClick={() => setIsSignIn(false)}
            >
              Sign Up
            </button>

            <div
              className="tabs-indicator"
              style={{ transform: `translateX(${isSignIn ? '0%' : '100%'})` }}
              aria-hidden="true"
            />
          </div>

          <div className="form-area">
            <div className={`panel ${isSignIn ? 'show' : 'hide'}`}>
              <SignIn />
            </div>
            <div className={`panel ${!isSignIn ? 'show' : 'hide'}`}>
              <Signup />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

