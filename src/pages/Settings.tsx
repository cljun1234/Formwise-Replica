import React, { useState, useEffect } from 'react';
import { Save, Eye, EyeOff } from 'lucide-react';

export default function Settings() {
  const [keys, setKeys] = useState({
    gemini: '',
    openai: '',
    deepseek: '',
  });
  const [showKeys, setShowKeys] = useState({
    gemini: false,
    openai: false,
    deepseek: false,
  });

  useEffect(() => {
    const storedKeys = localStorage.getItem('ai_api_keys');
    if (storedKeys) {
      setKeys(JSON.parse(storedKeys));
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('ai_api_keys', JSON.stringify(keys));
    alert('API Keys saved successfully!');
  };

  const handleChange = (provider: keyof typeof keys, value: string) => {
    setKeys((prev) => ({ ...prev, [provider]: value }));
  };

  const toggleShow = (provider: keyof typeof showKeys) => {
    setShowKeys((prev) => ({ ...prev, [provider]: !prev[provider] }));
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      <div className="bg-white shadow sm:rounded-lg p-6">
        <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">AI Provider API Keys</h3>
        <p className="text-sm text-gray-500 mb-6">
          Enter your API keys below. These are stored locally in your browser and used to make requests to the respective AI providers.
        </p>

        <div className="space-y-4">
          {/* Gemini */}
          <div>
            <label className="block text-sm font-medium text-gray-700">Gemini API Key</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type={showKeys.gemini ? 'text' : 'password'}
                value={keys.gemini}
                onChange={(e) => handleChange('gemini', e.target.value)}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder="AIza..."
              />
              <button
                type="button"
                onClick={() => toggleShow('gemini')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
              >
                {showKeys.gemini ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
          </div>

          {/* OpenAI */}
          <div>
            <label className="block text-sm font-medium text-gray-700">OpenAI API Key</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type={showKeys.openai ? 'text' : 'password'}
                value={keys.openai}
                onChange={(e) => handleChange('openai', e.target.value)}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder="sk-..."
              />
              <button
                type="button"
                onClick={() => toggleShow('openai')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
              >
                {showKeys.openai ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
          </div>

          {/* DeepSeek */}
          <div>
            <label className="block text-sm font-medium text-gray-700">DeepSeek API Key</label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type={showKeys.deepseek ? 'text' : 'password'}
                value={keys.deepseek}
                onChange={(e) => handleChange('deepseek', e.target.value)}
                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md p-2 border"
                placeholder="sk-..."
              />
              <button
                type="button"
                onClick={() => toggleShow('deepseek')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer"
              >
                {showKeys.deepseek ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <button
            onClick={handleSave}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Save className="-ml-1 mr-2 h-5 w-5" />
            Save Keys
          </button>
        </div>
      </div>
    </div>
  );
}
