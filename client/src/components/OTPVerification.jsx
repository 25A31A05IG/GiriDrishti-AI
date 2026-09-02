import React, { useState } from 'react';
import {
  Mountain,
  Mail,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';

import { API } from '../App';

export default function OTPVerification({
  email,
  onVerified,
  onBack
}) {
  const [otp, setOtp] = useState('');

  const [error, setError] = useState('');
  const [message, setMessage] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const [resending, setResending] =
    useState(false);

  const verify = async e => {
    e.preventDefault();

    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(
        `${API}/auth/verify-otp`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            email,
            otp
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          'Invalid OTP'
        );
      }

      setMessage(
        'Email verified successfully!'
      );

      setTimeout(() => {
        onVerified();
      }, 800);

    } catch (err) {
      setError(
        err.message ||
        'Unable to verify OTP'
      );
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    setError('');
    setMessage('');
    setResending(true);

    try {
      const response = await fetch(
        `${API}/auth/resend-otp`,
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            email
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          'Unable to resend OTP'
        );
      }

      setMessage(
        'New OTP sent to your email.'
      );

    } catch (err) {
      setError(
        err.message ||
        'Unable to resend OTP'
      );
    } finally {
      setResending(false);
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
            Secure Account Verification
          </div>

          <h1>
            One Step
            <br />
            <span>Closer to Safety</span>
          </h1>

          <p>
            Verify your email address to
            activate your GiriDrishti AI
            monitoring account.
          </p>

          <div className="authVerifyInfo">

            <ShieldCheck size={22} />

            <div>
              <b>Why verify your email?</b>

              <span>
                Important landslide alerts and
                account notifications can be
                delivered securely.
              </span>
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
              <Mail size={22} />
            </div>

            <div>

              <h2>Verify Email</h2>

              <p>
                Enter the verification code
              </p>

            </div>

          </div>

          <div className="otpEmailBox">

            <Mail size={18} />

            <div>

              <span>OTP sent to</span>

              <strong>{email}</strong>

            </div>

          </div>

          {error && (
            <div className="authError">
              {error}
            </div>
          )}

          {message && (
            <div className="authSuccess">
              {message}
            </div>
          )}

          <form onSubmit={verify}>

            <div className="authField">

              <label>Verification Code</label>

              <input
                className="otpInput"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                placeholder="000000"
                value={otp}
                onChange={e =>
                  setOtp(
                    e.target.value
                      .replace(/\D/g, '')
                  )
                }
                required
              />

              <small className="otpHint">
                Enter the 6-digit code
                sent to your email
              </small>

            </div>

            <button
              type="submit"
              className="primary authButton"
              disabled={
                loading ||
                otp.length !== 6
              }
            >
              {loading
                ? 'Verifying...'
                : 'Verify Email'}
            </button>

          </form>

          <button
            type="button"
            className="secondaryAuthButton"
            onClick={resend}
            disabled={resending}
          >
            {resending
              ? 'Sending...'
              : 'Resend OTP'}
          </button>

          <div className="authDivider">
            <span />
            <small>SECURE VERIFICATION</small>
            <span />
          </div>

          <button
            type="button"
            className="backButton"
            onClick={onBack}
          >
            <ArrowLeft size={16} />
            Back to Register
          </button>

          <div className="authSecurity">

            <ShieldCheck size={16} />

            <span>
              OTP expires after 10 minutes
            </span>

          </div>

        </div>

      </div>

    </div>
  );
}
