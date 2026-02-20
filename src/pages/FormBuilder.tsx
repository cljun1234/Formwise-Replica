import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, Settings, MessageSquare, Layout, X, GripVertical, Video, HelpCircle, FileText } from 'lucide-react';

interface Field {
  id?: number;
  name: string;
  label: string;
  type: string;
  placeholder: string;
  required: boolean;
}

interface Resource {
  id: number;
  name: string;
  content: string;
}

export default function FormBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [promptTemplate, setPromptTemplate] = useState('');
  const [fields, setFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'questions' | 'design' | 'settings'>('questions');
  const [selectedFieldIndex, setSelectedFieldIndex] = useState<number | null>(null);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  
  // AI Settings
  const [provider, setProvider] = useState('gemini');
  const [model, setModel] = useState('gemini-2.5-flash-latest');
  
  // Resources
  const [availableResources, setAvailableResources] = useState<Resource[]>([]);
  const [selectedResourceIds, setSelectedResourceIds] = useState<number[]>([]);

  useEffect(() => {
    fetchResources();
    if (isEditing) {
      fetchForm();
    }
  }, [id]);

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/resources');
      if (response.ok) {
        setAvailableResources(await response.json());
      }
    } catch (error) {
      console.error('Error fetching resources:', error);
    }
  };

  const fetchForm = async () => {
    try {
      const response = await fetch(`/api/forms/${id}`);
      if (response.ok) {
        const data = await response.json();
        setTitle(data.title);
        setDescription(data.description);
        setPromptTemplate(data.prompt_template);
        setFields(data.fields || []);
        setProvider(data.provider || 'gemini');
        setModel(data.model || 'gemini-2.5-flash-latest');
        
        if (data.resources) {
          setSelectedResourceIds(data.resources.map((r: Resource) => r.id));
        }

        if (data.fields && data.fields.length > 0) {
          setSelectedFieldIndex(0);
        }
      }
    } catch (error) {
      console.error('Error fetching form:', error);
    }
  };

  const addField = () => {
    const newField = {
      name: `field_${fields.length + 1}`,
      label: 'New Question',
      type: 'text',
      placeholder: 'Enter your description here...',
      required: false,
    };
    setFields([...fields, newField]);
    setSelectedFieldIndex(fields.length);
  };

  const removeField = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
    if (selectedFieldIndex === index) {
      setSelectedFieldIndex(null);
    } else if (selectedFieldIndex !== null && selectedFieldIndex > index) {
      setSelectedFieldIndex(selectedFieldIndex - 1);
    }
  };

  const updateField = (index: number, key: keyof Field, value: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };
    setFields(newFields);
  };

  const toggleResource = (resourceId: number) => {
    if (selectedResourceIds.includes(resourceId)) {
      setSelectedResourceIds(selectedResourceIds.filter(id => id !== resourceId));
    } else {
      setSelectedResourceIds([...selectedResourceIds, resourceId]);
    }
  };

  const handleSave = async () => {
    if (!title) {
      alert('Title is required.');
      return;
    }

    setLoading(true);
    try {
      const url = isEditing ? `/api/forms/${id}` : '/api/forms';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          description,
          prompt_template: promptTemplate,
          fields,
          provider,
          model,
          resource_ids: selectedResourceIds
        }),
      });

      if (response.ok) {
        navigate('/');
      } else {
        alert('Failed to save form.');
      }
    } catch (error) {
      console.error('Error saving form:', error);
      alert('An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  const insertVariable = (fieldName: string) => {
    setPromptTemplate((prev) => prev + `{{${fieldName}}}`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 border-2 border-dashed border-gray-300 rounded flex items-center justify-center">
              <Plus className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-bold text-gray-900 border-none focus:ring-0 p-0"
              placeholder="Untitled Form"
            />
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPromptEditor(true)}
            className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Test Tool
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Publish to Live'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Toolbox */}
        <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <button
              onClick={addField}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-700 bg-indigo-50 hover:bg-indigo-100"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add question
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {fields.map((field, index) => (
              <div
                key={index}
                onClick={() => setSelectedFieldIndex(index)}
                className={`group flex items-center p-3 rounded-md cursor-pointer border ${
                  selectedFieldIndex === index
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className={`flex-shrink-0 h-6 w-6 flex items-center justify-center rounded text-xs font-medium mr-3 ${
                  selectedFieldIndex === index ? 'bg-yellow-200 text-yellow-800' : 'bg-gray-100 text-gray-500'
                }`}>
                  {index + 1}
                </div>
                <span className="flex-1 text-sm text-gray-700 truncate">{field.label}</span>
                <button
                  onClick={(e) => removeField(index, e)}
                  className="hidden group-hover:block p-1 text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          
          {/* Bottom Actions */}
          <div className="p-4 border-t border-gray-200 space-y-2">
             <div className="flex items-center text-sm text-gray-600 cursor-pointer hover:text-gray-900">
               <Layout className="mr-2 h-4 w-4" />
               Ending Action
             </div>
             <button
               onClick={() => setShowPromptEditor(true)}
               className="w-full flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-gray-100 border border-gray-200"
             >
               <MessageSquare className="mr-2 h-4 w-4 text-gray-500" />
               Display Results to User
             </button>
             <div className="bg-blue-50 p-2 rounded text-xs text-blue-700">
               ✨ Ending Actions change what happens after a user submits a form
             </div>
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 bg-gray-50 overflow-y-auto p-8 flex justify-center">
          <div className="w-full max-w-2xl bg-white shadow-sm rounded-lg min-h-[500px] p-8 space-y-8">
            {fields.length === 0 ? (
              <div className="text-center text-gray-400 py-20">
                <p>Add questions from the left sidebar to build your form.</p>
              </div>
            ) : (
              fields.map((field, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedFieldIndex(index)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedFieldIndex === index
                      ? 'border-blue-500 ring-4 ring-blue-50'
                      : 'border-transparent hover:border-gray-200'
                  }`}
                >
                  <div className="mb-2">
                    <label className="block text-lg font-medium text-gray-900">
                      {index + 1}. {field.label}
                    </label>
                    <p className="text-sm text-gray-400 mt-1">Enter your description here, this is optional...</p>
                  </div>
                  {field.type === 'textarea' ? (
                    <textarea
                      disabled
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50"
                      placeholder={field.placeholder}
                      rows={3}
                    />
                  ) : (
                    <input
                      type={field.type}
                      disabled
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-gray-50"
                      placeholder={field.placeholder}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Sidebar: Properties */}
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col overflow-y-auto">
          {selectedFieldIndex !== null && fields[selectedFieldIndex] ? (
            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question ID</label>
                <div className="flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                    @
                  </span>
                  <input
                    type="text"
                    value={fields[selectedFieldIndex].name}
                    onChange={(e) => updateField(selectedFieldIndex, 'name', e.target.value)}
                    className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border"
                  />
                </div>
                <div className="mt-2 bg-blue-50 p-2 rounded text-xs text-blue-700">
                  ✨ The Question ID is how you will reference this question in your prompts.
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Label</label>
                <input
                  type="text"
                  value={fields[selectedFieldIndex].label}
                  onChange={(e) => updateField(selectedFieldIndex, 'label', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Question Type</label>
                <select
                  value={fields[selectedFieldIndex].type}
                  onChange={(e) => updateField(selectedFieldIndex, 'type', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                >
                  <option value="text">Short Text</option>
                  <option value="textarea">Long Text</option>
                  <option value="number">Number</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Placeholder</label>
                <input
                  type="text"
                  value={fields[selectedFieldIndex].placeholder}
                  onChange={(e) => updateField(selectedFieldIndex, 'placeholder', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700">Required</label>
                  <div className="flex items-center border border-gray-300 rounded-md overflow-hidden">
                    <button
                      onClick={() => updateField(selectedFieldIndex, 'required', true)}
                      className={`px-3 py-1 text-xs font-medium ${
                        fields[selectedFieldIndex].required ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-500'
                      }`}
                    >
                      Yes
                    </button>
                    <div className="w-px h-full bg-gray-300"></div>
                    <button
                      onClick={() => updateField(selectedFieldIndex, 'required', false)}
                      className={`px-3 py-1 text-xs font-medium ${
                        !fields[selectedFieldIndex].required ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-500'
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              <div className="bg-blue-600 rounded-lg p-6 text-white mb-6">
                <h3 className="text-lg font-bold mb-2">Building your first AI tool</h3>
                <div className="aspect-w-16 aspect-h-9 bg-blue-800 rounded mb-4 flex items-center justify-center">
                  <Video className="h-8 w-8 text-white opacity-50" />
                </div>
              </div>
              
              {/* AI Model Settings */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">AI Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Provider</label>
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    >
                      <option value="gemini">Gemini</option>
                      <option value="openai">OpenAI</option>
                      <option value="deepseek">DeepSeek</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Model</label>
                    <select
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    >
                      {provider === 'gemini' && (
                        <>
                          <option value="gemini-2.5-flash-latest">Gemini 2.5 Flash</option>
                          <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro</option>
                        </>
                      )}
                      {provider === 'openai' && (
                        <>
                          <option value="gpt-4o">GPT-4o</option>
                          <option value="gpt-4o-mini">GPT-4o Mini</option>
                        </>
                      )}
                      {provider === 'deepseek' && (
                        <>
                          <option value="deepseek-chat">DeepSeek Chat</option>
                          <option value="deepseek-coder">DeepSeek Coder</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Knowledge Base */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Knowledge Base</h3>
                <p className="text-sm text-gray-500 mb-4">Select resources to attach to this tool.</p>
                {availableResources.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">No resources available. Add them in Resources Center.</p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {availableResources.map((resource) => (
                      <div key={resource.id} className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id={`resource-${resource.id}`}
                            type="checkbox"
                            checked={selectedResourceIds.includes(resource.id)}
                            onChange={() => toggleResource(resource.id)}
                            className="focus:ring-indigo-500 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor={`resource-${resource.id}`} className="font-medium text-gray-700">
                            {resource.name}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prompt Editor Modal */}
      {showPromptEditor && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={() => setShowPromptEditor(false)}></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-start mb-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Prompt Editor
                  </h3>
                  <button onClick={() => setShowPromptEditor(false)} className="text-gray-400 hover:text-gray-500">
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                      <label className="block text-sm font-bold text-gray-700">Prompt name</label>
                    </div>
                    <div className="mt-1 flex rounded-md shadow-sm">
                      <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                        <MessageSquare className="h-4 w-4" />
                      </span>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="flex-1 min-w-0 block w-full px-3 py-2 rounded-none rounded-r-md border-gray-300 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm border"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center space-x-2 mb-1">
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                      <label className="block text-sm font-bold text-gray-700">Instructions</label>
                    </div>
                    <p className="text-sm text-gray-500 mb-2">
                      (Use the @ symbol to call on the Response ID from your form's questions)
                    </p>
                    
                    <div className="border border-gray-300 rounded-md p-2">
                      <div className="flex flex-wrap gap-2 mb-2 p-2 bg-gray-50 rounded border border-gray-200">
                        <span className="text-xs font-medium text-gray-500 uppercase">Insert Variable:</span>
                        {fields.map((field, index) => (
                          <button
                            key={index}
                            onClick={() => insertVariable(field.name)}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 hover:bg-blue-200"
                          >
                            {field.name}
                          </button>
                        ))}
                      </div>
                      <textarea
                        value={promptTemplate}
                        onChange={(e) => setPromptTemplate(e.target.value)}
                        rows={12}
                        className="block w-full border-0 focus:ring-0 sm:text-sm font-mono resize-none"
                        placeholder="# Task: You are a professional market manager..."
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => setShowPromptEditor(false)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Save Prompt
                </button>
                <button
                  type="button"
                  onClick={() => setShowPromptEditor(false)}
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
