"use client";

import { useState, useEffect } from 'react';

interface AuthSettings {
  saml: {
    enabled: boolean;
    entryPoint?: string;
    issuer?: string;
    cert?: string;
  };
  microsoft: {
    enabled: boolean;
    clientId?: string;
    clientSecret?: string;
    tenantId?: string;
  };
  allowedMethods: ('passkey' | 'google' | 'apple' | 'microsoft' | 'saml')[];
  requireMFA: boolean;
}

const defaultSettings: AuthSettings = {
  saml: {
    enabled: false
  },
  microsoft: {
    enabled: false
  },
  allowedMethods: ['passkey', 'google', 'apple'],
  requireMFA: false
};

export default function AuthenticationSettings() {
  const [settings, setSettings] = useState<AuthSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/organizations/current/settings');
        if (!response.ok) throw new Error('Failed to fetch settings');
        const data = await response.json();
        setSettings(data);
      } catch (err) {
        setError('Failed to load authentication settings');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const response = await fetch('/api/organizations/current/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });
      
      if (!response.ok) throw new Error('Failed to save settings');
      
      // Refresh settings
      const data = await response.json();
      setSettings(data);
    } catch (err) {
      setError('Failed to save settings');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">Loading...</div>
        </div>
      </div>
    );
  }

  const currentSettings = settings || defaultSettings;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Authentication Settings
              </h2>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className="mt-8 space-y-6">
            {/* General Settings */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  General Settings
                </h3>
                <div className="mt-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-base font-medium text-gray-900">
                        Require Multi-Factor Authentication
                      </label>
                      <p className="text-sm text-gray-500">
                        Enforce MFA for all users in your organization
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSettings({
                        ...currentSettings,
                        requireMFA: !currentSettings.requireMFA
                      })}
                      className={`${
                        currentSettings.requireMFA
                          ? 'bg-blue-600'
                          : 'bg-gray-200'
                      } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                    >
                      <span className="sr-only">Require MFA</span>
                      <span
                        className={`${
                          currentSettings.requireMFA ? 'translate-x-5' : 'translate-x-0'
                        } pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* SAML Settings */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      SAML Single Sign-On
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Configure SAML SSO for your organization
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({
                      ...currentSettings,
                      saml: {
                        ...currentSettings.saml,
                        enabled: !currentSettings.saml.enabled
                      }
                    })}
                    className={`${
                      currentSettings.saml.enabled
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    <span className="sr-only">Enable SAML</span>
                    <span
                      className={`${
                        currentSettings.saml.enabled ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                    />
                  </button>
                </div>

                {currentSettings.saml.enabled && (
                  <div className="mt-6 space-y-6">
                    <div>
                      <label htmlFor="entryPoint" className="block text-sm font-medium text-gray-700">
                        Identity Provider Entry Point
                      </label>
                      <input
                        type="url"
                        name="entryPoint"
                        id="entryPoint"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={currentSettings.saml.entryPoint || ''}
                        onChange={e => setSettings({
                          ...currentSettings,
                          saml: {
                            ...currentSettings.saml,
                            entryPoint: e.target.value
                          }
                        })}
                      />
                    </div>

                    <div>
                      <label htmlFor="issuer" className="block text-sm font-medium text-gray-700">
                        Issuer
                      </label>
                      <input
                        type="text"
                        name="issuer"
                        id="issuer"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={currentSettings.saml.issuer || ''}
                        onChange={e => setSettings({
                          ...currentSettings,
                          saml: {
                            ...currentSettings.saml,
                            issuer: e.target.value
                          }
                        })}
                      />
                    </div>

                    <div>
                      <label htmlFor="cert" className="block text-sm font-medium text-gray-700">
                        X.509 Certificate
                      </label>
                      <textarea
                        name="cert"
                        id="cert"
                        rows={4}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={currentSettings.saml.cert || ''}
                        onChange={e => setSettings({
                          ...currentSettings,
                          saml: {
                            ...currentSettings.saml,
                            cert: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Microsoft Entra ID Settings */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Microsoft Entra ID
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Configure Microsoft Entra ID (formerly Azure AD) integration
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSettings({
                      ...currentSettings,
                      microsoft: {
                        ...currentSettings.microsoft,
                        enabled: !currentSettings.microsoft.enabled
                      }
                    })}
                    className={`${
                      currentSettings.microsoft.enabled
                        ? 'bg-blue-600'
                        : 'bg-gray-200'
                    } relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                  >
                    <span className="sr-only">Enable Microsoft Entra ID</span>
                    <span
                      className={`${
                        currentSettings.microsoft.enabled ? 'translate-x-5' : 'translate-x-0'
                      } pointer-events-none relative inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200`}
                    />
                  </button>
                </div>

                {currentSettings.microsoft.enabled && (
                  <div className="mt-6 space-y-6">
                    <div>
                      <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
                        Client ID
                      </label>
                      <input
                        type="text"
                        name="clientId"
                        id="clientId"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={currentSettings.microsoft.clientId || ''}
                        onChange={e => setSettings({
                          ...currentSettings,
                          microsoft: {
                            ...currentSettings.microsoft,
                            clientId: e.target.value
                          }
                        })}
                      />
                    </div>

                    <div>
                      <label htmlFor="clientSecret" className="block text-sm font-medium text-gray-700">
                        Client Secret
                      </label>
                      <input
                        type="password"
                        name="clientSecret"
                        id="clientSecret"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={currentSettings.microsoft.clientSecret || ''}
                        onChange={e => setSettings({
                          ...currentSettings,
                          microsoft: {
                            ...currentSettings.microsoft,
                            clientSecret: e.target.value
                          }
                        })}
                      />
                    </div>

                    <div>
                      <label htmlFor="tenantId" className="block text-sm font-medium text-gray-700">
                        Tenant ID
                      </label>
                      <input
                        type="text"
                        name="tenantId"
                        id="tenantId"
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        value={currentSettings.microsoft.tenantId || ''}
                        onChange={e => setSettings({
                          ...currentSettings,
                          microsoft: {
                            ...currentSettings.microsoft,
                            tenantId: e.target.value
                          }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 