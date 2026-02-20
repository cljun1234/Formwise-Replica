import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Copy, Check, Settings } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface Field {
  id: number;
  name: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
}

interface Form {
  id: number;
  title: string;
  description: string;
  fields: Field[];
}

export default function FormRunner() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<Form | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState('');

  useEffect(() => {
    fetchForm();
  }, [id]);

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${id}`);
      if (response.ok) {
        const data = await response.json();
        setForm(data);
        // Initialize inputs
        const initialInputs: Record<string, string> = {};
        data.fields.forEach((field: Field) => {
          initialInputs[field.name] = '';
        });
        setInputs(initialInputs);
      }
    } catch (error) {
      console.error('Error fetching form:', error);
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    // Get API key from local storage based on the form's configured provider
    const storedKeys = localStorage.getItem('ai_api_keys');
    const keys = storedKeys ? JSON.parse(storedKeys) : {};
    
    // @ts-ignore - provider exists on form object from backend
    const provider = form?.provider || 'gemini';
    const apiKey = keys[provider];

    // If no key for selected provider (except Gemini which might use env), warn user
    if (!apiKey && provider !== 'gemini') {
      alert(`Please configure your ${provider} API Key in Settings.`);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`/api/forms/${id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          inputs,
          config: {
            apiKey, // Send the key (backend will use env for Gemini if this is empty)
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.result);
      } else {
        const errorData = await response.json();
        alert(`Failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error executing form:', error);
      alert('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!form) return <div className="flex justify-center items-center h-64">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => navigate('/')}
        className="mb-6 inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Dashboard
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white shadow sm:rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">{form.title}</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">{form.description}</p>
            </div>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Provider Selection */}
              <div className="bg-blue-50 p-3 rounded-md border border-blue-100 mb-4">
                <label className="block text-xs font-medium text-blue-700 mb-1">AI Model Provider</label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-blue-600"
                      name="provider"
                      value="gemini"
                      checked={provider === 'gemini'}
                      onChange={(e) => setProvider(e.target.value)}
                    />
                    <span className="ml-2 text-sm text-gray-700">Gemini</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-blue-600"
                      name="provider"
                      value="openai"
                      checked={provider === 'openai'}
                      onChange={(e) => setProvider(e.target.value)}
                    />
                    <span className="ml-2 text-sm text-gray-700">OpenAI</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio text-blue-600"
                      name="provider"
                      value="deepseek"
                      checked={provider === 'deepseek'}
                      onChange={(e) => setProvider(e.target.value)}
                    />
                    <span className="ml-2 text-sm text-gray-700">DeepSeek</span>
                  </label>
                </div>
                <div className="mt-2 text-xs text-gray-500 flex items-center">
                  <Settings className="h-3 w-3 mr-1" />
                  <span className="cursor-pointer hover:underline" onClick={() => navigate('/settings')}>
                    Configure API Keys in Settings
                  </span>
                </div>
              </div>

              {form.fields.map((field) => (
                <div key={field.id}>
                  <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
                    {field.label} {field.required && <span className="text-red-500">*</span>}
                  </label>
                  <div className="mt-1">
                    {field.type === 'textarea' ? (
                      <textarea
                        id={field.name}
                        name={field.name}
                        rows={3}
                        required={field.required}
                        placeholder={field.placeholder}
                        value={inputs[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      />
                    ) : (
                      <input
                        type={field.type}
                        id={field.name}
                        name={field.name}
                        required={field.required}
                        placeholder={field.placeholder}
                        value={inputs[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-2 border"
                      />
                    )}
                  </div>
                </div>
              ))}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="-ml-1 mr-2 h-5 w-5" />
                      Generate Content
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Result Section */}
        <div className="bg-white shadow sm:rounded-lg overflow-hidden flex flex-col h-full">
          <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-gray-900">AI Output</h3>
            {result && (
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {copied ? <Check className="h-4 w-4 mr-1 text-green-500" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
            )}
          </div>
          <div className="px-4 py-5 sm:p-6 flex-1 overflow-y-auto min-h-[300px]">
            {result ? (
              <div className="prose prose-sm max-w-none">
                <ReactMarkdown>{result}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Sparkles className="h-12 w-12 mb-2 opacity-20" />
                <p>Fill out the form and click Generate to see results here.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
