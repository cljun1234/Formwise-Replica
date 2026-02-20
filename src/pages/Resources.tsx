import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, FileText, Link as LinkIcon, Save, X, Upload, File } from 'lucide-react';

interface Resource {
  id: number;
  name: string;
  type: 'text' | 'url';
  content: string;
  created_at: string;
}

export default function Resources() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  
  // New Resource State
  const [name, setName] = useState('');
  const [type, setType] = useState<'text' | 'url'>('text');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/resources');
      if (response.ok) {
        const data = await response.json();
        setResources(data);
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!name || !content) {
      alert('Name and Content are required.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/resources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type, content }),
      });

      if (response.ok) {
        fetchResources();
        setShowModal(false);
        setName('');
        setContent('');
        setType('text');
      } else {
        alert('Failed to save resource.');
      }
    } catch (error) {
      console.error('Error saving resource:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const response = await fetch(`/api/resources/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setResources(resources.filter((r) => r.id !== id));
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Auto-fill name if empty
    if (!name) {
      setName(file.name);
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setContent(text);
    };
    
    // Read as text (works for txt, md, json, csv, code files)
    // For PDFs/Docs, this will result in garbage characters, but 
    // implementing full PDF parsing in browser is out of scope for this turn.
    // We'll trust the user to upload text-based files for now.
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Resources Center</h1>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5" />
          Add Resource
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : resources.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No resources yet</h3>
          <p className="mt-1 text-sm text-gray-500">Add text or documents to use as knowledge for your AI tools.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resources.map((resource) => (
            <div key={resource.id} className="bg-white overflow-hidden shadow rounded-lg flex flex-col">
              <div className="px-4 py-5 sm:p-6 flex-1">
                <div className="flex items-center mb-2">
                  {resource.type === 'url' ? (
                    <LinkIcon className="h-5 w-5 text-blue-500 mr-2" />
                  ) : (
                    <FileText className="h-5 w-5 text-gray-500 mr-2" />
                  )}
                  <h3 className="text-lg font-medium text-gray-900 truncate">{resource.name}</h3>
                </div>
                <div className="relative">
                  <p className="text-sm text-gray-500 line-clamp-4 whitespace-pre-wrap font-mono bg-gray-50 p-2 rounded h-24 overflow-hidden">
                    {resource.content}
                  </p>
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-gray-50 to-transparent"></div>
                </div>
                <p className="mt-4 text-xs text-gray-400">
                  Added: {new Date(resource.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-gray-50 px-4 py-4 sm:px-6 flex justify-end">
                <button
                  onClick={() => handleDelete(resource.id)}
                  className="text-red-600 hover:text-red-900 text-sm font-medium"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Resource Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowModal(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Add New Resource</h3>
                  <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                      placeholder="e.g., Company Guidelines"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as 'text' | 'url')}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    >
                      <option value="text">Text Content / File Upload</option>
                      {/* <option value="url">URL (Web Page)</option> */}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                    
                    {/* File Upload Area */}
                    <div className="mb-2">
                       <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          className="hidden"
                          accept=".txt,.md,.json,.csv,.js,.ts,.html,.css"
                        />
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          <Upload className="-ml-0.5 mr-2 h-4 w-4" />
                          Upload Text File
                        </button>
                        <span className="ml-2 text-xs text-gray-500">Supported: .txt, .md, .json, .csv</span>
                    </div>

                    <textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={10}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border font-mono"
                      placeholder="Paste your text content here or upload a file..."
                    />
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Resource'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
