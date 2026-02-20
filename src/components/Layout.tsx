import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, Box, Settings, Search, Users, FileText, Info } from 'lucide-react';

export default function Layout() {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900';
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-6 mb-8">
                  <span className="text-2xl font-bold tracking-tight text-indigo-600">FormWise</span>
                </div>
                
                <nav className="flex-1 px-4 space-y-1">
                  <Link
                    to="/"
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${isActive('/')}`}
                  >
                    <LayoutDashboard className="mr-3 h-5 w-5 flex-shrink-0" />
                    All Tools
                  </Link>
                  <div className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer">
                    <Search className="mr-3 h-5 w-5 flex-shrink-0" />
                    Search Tools
                  </div>
                  <div className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 cursor-pointer">
                    <Box className="mr-3 h-5 w-5 flex-shrink-0" />
                    Toolsets
                  </div>
                  <Link
                    to="/resources"
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${isActive('/resources')}`}
                  >
                    <FileText className="mr-3 h-5 w-5 flex-shrink-0" />
                    Resources Center
                  </Link>
                  <Link
                    to="/settings"
                    className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-md ${isActive('/settings')}`}
                  >
                    <Settings className="mr-3 h-5 w-5 flex-shrink-0" />
                    Settings
                  </Link>
                </nav>
              </div>
              
              {/* Platform Updates Banner */}
              <div className="p-4">
                <div className="bg-gray-900 rounded-lg p-4 text-white">
                  <div className="flex items-center space-x-2">
                    <Info className="h-5 w-5 text-blue-400" />
                    <span className="font-medium">Platform Updates</span>
                  </div>
                </div>
              </div>

              {/* User Profile */}
              <div className="border-t border-gray-200 p-4">
                <div className="flex items-center">
                  <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold">
                    I
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                      Info T
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex flex-col w-0 flex-1 overflow-hidden bg-gray-50">
          <main className="flex-1 relative z-0 overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
