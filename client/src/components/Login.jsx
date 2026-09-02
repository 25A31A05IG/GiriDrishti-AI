import React, { useState } from 'react';
import { API } from '../App';

export default function Login({
  onLogin,
  onRegister
}) {
  const [email, setEmail] =
    useState('');

  const [password, setPassword] =
    useState('');

  const [error, setError] =
    useState('');

  const [loading, setLoading] =
    useState(false);

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
            'Content-Type':
              'application/json'
          },

          body: JSON.stringify({
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
          'Login failed'
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
          Predict. Warn. Protect.
        </p>

        <h2>
          Welcome Back
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
            placeholder="Enter your password"
            value={password}
            onChange={e =>
              setPassword(e.target.value)
            }
            required
          />

          <button
            type="submit"
            className="primary authButton"
            disabled={loading}
          >
            {loading
              ? 'Signing in...'
              : 'Login'}
          </button>

        </form>

        <p className="authSwitch">
          Don't have an account?

          <button
            type="button"
            onClick={onRegister}
          >
            Create Account
          </button>
        </p>

      </div>
    </div>
  );
}