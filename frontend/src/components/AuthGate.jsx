/**
 * Authentication Gate Component
 *
 * Displays a login form and blocks access to the app until authenticated.
 * Features a clean, modern UI consistent with the stepback.dev design.
 */

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { GitGraph, Lock, ArrowRight, AlertCircle } from 'lucide-react';

const AuthGate = () => {
  const { login, error, clearError, isLoading } = useAuth();
  const [code, setCode] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    // Basic validation
    if (!code.trim()) {
      setLocalError('Please enter an authentication code');
      return;
    }

    if (code.length !== 16) {
      setLocalError('Authentication code must be 16 characters');
      return;
    }

    await login(code);
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-claude-light flex flex-col items-center justify-center p-6">
      {/* Background pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-claude-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-claude-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-lg shadow-claude-primary/30 mb-4">
            <GitGraph size={32} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-claude-text">
            stepback.dev
          </h1>
          <p className="text-sm text-claude-secondary mt-1">
            Git-Style LLM Interface
          </p>
        </div>

        {/* Card */}
        <div className="bg-claude-white rounded-2xl shadow-xl shadow-claude-secondary/10 border border-claude-secondary/20 p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-claude-light flex items-center justify-center">
              <Lock size={20} className="text-claude-primary" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-claude-text">
                Authentication Required
              </h2>
              <p className="text-sm text-claude-secondary">
                Enter your access code to continue
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Code Input */}
            <div>
              <label
                htmlFor="auth-code"
                className="block text-sm font-medium text-claude-text mb-2"
              >
                Access Code
              </label>
              <input
                id="auth-code"
                type="password"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setLocalError('');
                  clearError();
                }}
                placeholder="Enter 16-character code"
                maxLength={16}
                className="w-full px-4 py-3 rounded-xl border border-claude-secondary/40
                  bg-claude-white text-claude-text placeholder:text-claude-secondary/60
                  focus:outline-none focus:ring-2 focus:ring-claude-primary/40 focus:border-claude-primary/60
                  transition-all duration-200 font-mono tracking-wider"
                disabled={isLoading}
                autoFocus
              />
              <div className="mt-2 flex justify-between items-center">
                <span className="text-xs text-claude-secondary">
                  {code.length}/16 characters
                </span>
                {code.length === 16 && (
                  <span className="text-xs text-green-600 font-medium">
                    ✓ Ready
                  </span>
                )}
              </div>
            </div>

            {/* Error Message */}
            {displayError && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                <AlertCircle size={16} className="shrink-0" />
                <span className="text-sm">{displayError}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || code.length !== 16}
              className="w-full gradient-primary text-white font-medium py-3 px-4 rounded-xl
                flex items-center justify-center gap-2
                hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-200 shadow-lg shadow-claude-primary/20
                active:scale-[0.98]"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <span>Continue</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-claude-secondary mt-6">
          Your session will persist until you close the browser.
        </p>
      </div>
    </div>
  );
};

export default AuthGate;

