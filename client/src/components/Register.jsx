import React, { useState } from 'react';
import { API } from '../App';

export default function Register({
  onOTP,
  onLogin
}) {
  const [name, setName] =
    useState('');

  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [confirmPassword, setConfirmPassword] =
    useState('');

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

  const handleSubmit = async e => {
    e.preventDefault();

    setError('');

    if (
      password !== confirmPassword
    ) {
      setError(
        'Passwords do not match'
      );
      return;
    }

    if (password.length < 6) {
      setError(
        'Password must be at least 6 characters'
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API}/auth/register`,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
            name,
            email,
            password
          })
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          'Registration failed'
        );
      }

      onOTP(data.email);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="authPage">

      <div className="authCard">

        <div className="authLogo">
          🌄
        </div>

        <h1>
          GiriDrishti AI
        </h1>

        <p>
          Create your monitoring account
        </p>

        <h2>
          Register
        </h2>

        {error && (
          <div className="authError">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
        >

          <label>
            Full Name
          </label>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={e =>
              setName(e.target.value)
            }
            required
          />

          <label>
            Email
          </label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={e =>
              setEmail(e.target.value)
            }
            required
          />

          <label>
            Password
          </label>

          <input
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={e =>
              setPassword(e.target.value)
            }
            required
          />

          <label>
            Confirm Password
          </label>

          <input
            type="password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={e =>
              setConfirmPassword(
                e.target.value
              )
            }
            required
          />

          <button
            type="submit"
            className="primary authButton"
            disabled={loading}
          >
            {loading
              ? 'Creating Account...'
              : 'Register'}
          </button>

        </form>

        <p className="authSwitch">
          Already have an account?

          <button
            type="button"
            onClick={onLogin}
          >
            Login
          </button>
        </p>

      </div>

    </div>
  );
}