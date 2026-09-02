import React, { useState } from 'react';
import { API } from '../App';

export default function OTPVerification({
  email,
  onVerified,
  onBack
}) {
  const [otp, setOtp] =
    useState('');

  const [error, setError] =
    useState('');

  const [message, setMessage] =
    useState('');

  const [loading, setLoading] =
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
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            email,
            otp
          })
        }
      );

      const data =
        await response.json();

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };


  const resend = async () => {
    setError('');
    setMessage('');

    try {
      const response = await fetch(
        `${API}/auth/resend-otp`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            email
          })
        }
      );

      const data =
        await response.json();

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
      setError(err.message);
    }
  };


  return (
    <div className="authPage">

      <div className="authCard">

        <div className="authLogo">
          ✉️
        </div>

        <h1>
          Verify Email
        </h1>

        <p>
          We sent a 6-digit OTP to
        </p>

        <strong>
          {email}
        </strong>

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

        <form
          onSubmit={verify}
        >

          <label>
            Verification OTP
          </label>

          <input
            className="otpInput"
            type="text"
            inputMode="numeric"
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
              : 'Verify OTP'}
          </button>

        </form>

        <button
          type="button"
          className="secondaryAuthButton"
          onClick={resend}
        >
          Resend OTP
        </button>

        <button
          type="button"
          className="backButton"
          onClick={onBack}
        >
          Back to Register
        </button>

      </div>

    </div>
  );
}