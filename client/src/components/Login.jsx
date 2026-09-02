import React, { useState } from 'react';
import {
  Mountain,
  Mail,
  Lock,
  ShieldCheck,
  Activity
} from 'lucide-react';

import { API } from '../App';

export default function Login({
  onLogin,
  onRegister
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async e => {
    e.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await fetch(
        `${API}/auth/login`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Login failed'
        );
      }

      localStorage.setItem(
        'giridrishti_token',
        data.token
      );

      localStorage.setItem(
        'giridrishti_user',
        JSON.stringify(data.user)
      );

      onLogin(data.user);

    } catch (err) {
      setError(
        err.message || 'Unable to login'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPage">

      <div className="authBackground">

        <div className="authBrand">

          <div className="authBrandLogo">
            <Mountain size={30} />
          </div>

          <div>
            <b>GiriDrishti AI</b>

            <span>
              Predict. Warn. Protect.
            </span>
          </div>

        </div>

        <div className="authHero">

          <div className="authLiveBadge">
            <span className="liveDot" />
            Live Landslide Risk Monitoring
          </div>

          <h1>
            Intelligent
            <br />
            <span>Early Warning</span>
            <br />
            for Safer Communities
          </h1>

          <p>
            Monitor landslide risk across
            Northeast India using AI,
            environmental conditions and
            historical landslide evidence.
          </p>

          <div className="authFeatures">

            <div className="authFeature">
              <div className="authFeatureIcon">
                <Activity size={18} />
              </div>

              <div>
                <b>Live Risk Monitoring</b>
                <span>
                  Continuous environmental assessment
                </span>
              </div>
            </div>

            <div className="authFeature">
              <div className="authFeatureIcon">
                <ShieldCheck size={18} />
              </div>

              <div>
                <b>AI-Powered Assessment</b>
                <span>
                  Data-driven landslide risk detection
                </span>
              </div>
            </div>

          </div>

        </div>

        <div className="authFooter">
          <span>
            GiriDrishti AI
          </span>

          <span>
            Intelligent Landslide Risk Monitoring
          </span>
        </div>

      </div>

      <div className="authFormSide">

        <div className="authCard">

          <div className="authMobileBrand">

            <div className="authLogo">
              <Mountain size={27} />
            </div>

            <div>
              <b>GiriDrishti AI</b>

              <span>
                Predict. Warn. Protect.
              </span>
            </div>

          </div>

          <div className="authHeading">

            <div className="authIconCircle">
              <ShieldCheck size={22} />
            </div>

            <div>
              <h2>Welcome Back</h2>

              <p>
                Sign in to your monitoring dashboard
              </p>
            </div>

          </div>

          {error && (
            <div className="authError">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <div className="authField">

              <label>Email Address</label>

              <div className="authInputWrap">

                <Mail size={18} />

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={e =>
                    setEmail(e.target.value)
                  }
                  required
                />

              </div>

            </div>

            <div className="authField">

              <label>Password</label>

              <div className="authInputWrap">

                <Lock size={18} />

                <input
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e =>
                    setPassword(e.target.value)
                  }
                  required
                />

              </div>

            </div>

            <button
              type="submit"
              className="primary authButton"
              disabled={loading}
            >
              {loading
                ? 'Signing in...'
                : 'Sign In to Dashboard'}
            </button>

          </form>

          <div className="authDivider">
            <span />
            <small>SECURE ACCESS</small>
            <span />
          </div>

          <p className="authSwitch">

            Don't have an account?

            <button
              type="button"
              onClick={onRegister}
            >
              Create Account
            </button>

          </p>

          <div className="authSecurity">

            <ShieldCheck size={16} />

            <span>
              Protected access to GiriDrishti
              monitoring services
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}
