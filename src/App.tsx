/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import FormBuilder from './pages/FormBuilder';
import FormRunner from './pages/FormRunner';
import Settings from './pages/Settings';
import Resources from './pages/Resources';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="create" element={<FormBuilder />} />
        <Route path="edit/:id" element={<FormBuilder />} />
        <Route path="run/:id" element={<FormRunner />} />
        <Route path="settings" element={<Settings />} />
        <Route path="resources" element={<Resources />} />
      </Route>
    </Routes>
  );
}
