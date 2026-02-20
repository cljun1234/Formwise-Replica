import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Edit2, Play, Trash2, Plus, FileText, MoreVertical, Sparkles } from 'lucide-react';

interface Form {
  id: number;
  title: string;
  description: string;
  created_at: string;
}

export default function Dashboard() {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      const response = await fetch('/api/forms');
      if (response.ok) {
        const data = await response.json();
        setForms(data);
      }
    } catch (error) {
      console.error('Error fetching forms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this form?')) return;

    try {
      const response = await fetch(`/api/forms/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setForms(forms.filter((form) => form.id !== id));
      }
    } catch (error) {
      console.error('Error deleting form:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🌙</span>
          <h1 className="text-2xl font-semibold text-gray-900">Welcome, Night Owl!</h1>
        </div>
        <div className="flex space-x-3">
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-500 hover:bg-indigo-600 shadow-sm">
            <Sparkles className="mr-2 h-4 w-4" />
            Starter Packs
          </button>
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 shadow-sm">
            <Sparkles className="mr-2 h-4 w-4" />
            AI Tool Builder
          </button>
          <Link
            to="/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create a New Tool
          </Link>
        </div>
      </div>

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <span className="text-xl">🧰</span>
          <h2 className="text-xl font-medium text-gray-700">Your tools</h2>
        </div>
        <div className="flex items-center">
          <span className="text-sm text-gray-500 mr-2">Sort by</span>
          <select className="form-select block w-full pl-3 pr-10 py-1 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md">
            <option>Last Modified</option>
            <option>Name</option>
            <option>Date Created</option>
          </select>
        </div>
      </div>

      {forms.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
          <h3 className="mt-2 text-sm font-medium text-gray-900">No tools yet</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new AI tool.</p>
          <div className="mt-6">
            <Link
              to="/create"
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Create Tool
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <div
              key={form.id}
              className="relative bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-48"
            >
              <div className="p-4 flex-1">
                <div className="flex justify-between items-start mb-4">
                  <div className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                    <Sparkles className="mr-1 h-3 w-3" />
                    SmartForm
                  </div>
                  <div className="text-xs text-gray-400">
                    Date Modified: {new Date(form.created_at).toLocaleDateString()}
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                    <FileText className="h-6 w-6 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link to={`/edit/${form.id}`} className="focus:outline-none">
                      <span className="absolute inset-0" aria-hidden="true" />
                      <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1 line-clamp-2">
                        {form.title}
                      </h3>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-100 px-4 py-3 bg-gray-50 rounded-b-lg flex justify-between items-center">
                <span className="text-xs text-gray-500">0 Responses</span>
                <div className="flex space-x-1 relative z-10">
                  <Link
                    to={`/edit/${form.id}`}
                    className="p-1.5 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors"
                    title="Edit"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Link>
                  <Link
                    to={`/run/${form.id}`}
                    className="p-1.5 text-gray-400 hover:text-green-600 rounded-full hover:bg-green-50 transition-colors"
                    title="Run"
                  >
                    <Play className="h-4 w-4" />
                  </Link>
                  <button
                    onClick={(e) => handleDelete(form.id, e)}
                    className="p-1.5 text-gray-400 hover:text-red-600 rounded-full hover:bg-red-50 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
