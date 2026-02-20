import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import db from './src/db.ts';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// API Routes

// Get all forms
app.get('/api/forms', (req, res) => {
  try {
    const forms = db.prepare('SELECT * FROM forms ORDER BY created_at DESC').all();
    res.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// Get a single form with fields and resources
app.get('/api/forms/:id', (req, res) => {
  try {
    const { id } = req.params;
    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(id);
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const fields = db.prepare('SELECT * FROM fields WHERE form_id = ? ORDER BY order_index ASC').all(id);
    const resources = db.prepare(`
      SELECT r.* FROM resources r
      JOIN form_resources fr ON r.id = fr.resource_id
      WHERE fr.form_id = ?
    `).all(id);

    res.json({ ...form, fields, resources });
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

// Create a new form
app.post('/api/forms', (req, res) => {
  try {
    const { title, description, prompt_template, fields, provider, model, resource_ids } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const insertForm = db.prepare('INSERT INTO forms (title, description, prompt_template, provider, model) VALUES (?, ?, ?, ?, ?)');
    const info = insertForm.run(
      title, 
      description || '', 
      prompt_template || '',
      provider || 'gemini',
      model || 'gemini-2.5-flash-latest'
    );
    const formId = info.lastInsertRowid;

    if (fields && Array.isArray(fields)) {
      const insertField = db.prepare('INSERT INTO fields (form_id, name, label, type, placeholder, required, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)');
      fields.forEach((field: any, index: number) => {
        insertField.run(formId, field.name, field.label, field.type, field.placeholder || '', field.required ? 1 : 0, index);
      });
    }

    if (resource_ids && Array.isArray(resource_ids)) {
      const insertResource = db.prepare('INSERT INTO form_resources (form_id, resource_id) VALUES (?, ?)');
      resource_ids.forEach((resourceId: number) => {
        insertResource.run(formId, resourceId);
      });
    }

    res.status(201).json({ id: formId, message: 'Form created successfully' });
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// Update a form
app.put('/api/forms/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, prompt_template, fields, provider, model, resource_ids } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const updateForm = db.prepare('UPDATE forms SET title = ?, description = ?, prompt_template = ?, provider = ?, model = ? WHERE id = ?');
    updateForm.run(
      title, 
      description || '', 
      prompt_template || '', 
      provider || 'gemini',
      model || 'gemini-2.5-flash-latest',
      id
    );

    // Update fields
    db.prepare('DELETE FROM fields WHERE form_id = ?').run(id);
    if (fields && Array.isArray(fields)) {
      const insertField = db.prepare('INSERT INTO fields (form_id, name, label, type, placeholder, required, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)');
      fields.forEach((field: any, index: number) => {
        insertField.run(id, field.name, field.label, field.type, field.placeholder || '', field.required ? 1 : 0, index);
      });
    }

    // Update resources
    db.prepare('DELETE FROM form_resources WHERE form_id = ?').run(id);
    if (resource_ids && Array.isArray(resource_ids)) {
      const insertResource = db.prepare('INSERT INTO form_resources (form_id, resource_id) VALUES (?, ?)');
      resource_ids.forEach((resourceId: number) => {
        insertResource.run(id, resourceId);
      });
    }

    res.json({ message: 'Form updated successfully' });
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

// Delete a form
app.delete('/api/forms/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM fields WHERE form_id = ?').run(id);
    db.prepare('DELETE FROM form_resources WHERE form_id = ?').run(id);
    db.prepare('DELETE FROM forms WHERE id = ?').run(id);
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// Resources API
app.get('/api/resources', (req, res) => {
  try {
    const resources = db.prepare('SELECT * FROM resources ORDER BY created_at DESC').all();
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

app.post('/api/resources', (req, res) => {
  try {
    const { name, type, content } = req.body;
    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }
    const insert = db.prepare('INSERT INTO resources (name, type, content) VALUES (?, ?, ?)');
    insert.run(name, type || 'text', content);
    res.status(201).json({ message: 'Resource created' });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

app.delete('/api/resources/:id', (req, res) => {
  try {
    const { id } = req.params;
    db.prepare('DELETE FROM resources WHERE id = ?').run(id);
    res.json({ message: 'Resource deleted' });
  } catch (error) {
    console.error('Error deleting resource:', error);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

// Execute a form (Generate AI response)
app.post('/api/forms/:id/execute', async (req, res) => {
  try {
    const { id } = req.params;
    const { inputs, config } = req.body; // config contains { apiKey } (provider/model come from DB now)

    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(id) as any;
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Fetch attached resources
    const resources = db.prepare(`
      SELECT r.content, r.name FROM resources r
      JOIN form_resources fr ON r.id = fr.resource_id
      WHERE fr.form_id = ?
    `).all(id) as any[];

    let prompt = form.prompt_template;
    
    // Inject resources into prompt (simple concatenation for now)
    if (resources.length > 0) {
      let context = "\n\n# Reference Knowledge:\n";
      resources.forEach(r => {
        context += `\n--- Source: ${r.name} ---\n${r.content}\n`;
      });
      prompt += context;
    }

    // Replace placeholders in the prompt
    for (const [key, value] of Object.entries(inputs)) {
      const placeholder = `{{${key}}}`;
      prompt = prompt.replace(new RegExp(placeholder, 'g'), String(value));
    }

    const provider = form.provider || 'gemini';
    const apiKey = config?.apiKey || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(400).json({ error: `API key for ${provider} is missing` });
    }

    let resultText = '';

    if (provider === 'gemini') {
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: form.model || 'gemini-2.5-flash-latest',
        contents: prompt,
      });
      resultText = response.text || '';
    } else if (provider === 'openai' || provider === 'deepseek') {
      const baseURL = provider === 'deepseek' ? 'https://api.deepseek.com/v1' : undefined;
      const openai = new OpenAI({
        apiKey: apiKey,
        baseURL: baseURL,
      });

      const completion = await openai.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: form.model || (provider === 'deepseek' ? 'deepseek-chat' : 'gpt-4o'),
      });

      resultText = completion.choices[0]?.message?.content || '';
    } else {
      return res.status(400).json({ error: 'Invalid provider' });
    }
    
    res.json({ result: resultText });

  } catch (error: any) {
    console.error('Error executing form:', error);
    res.status(500).json({ error: error.message || 'Failed to execute form' });
  }
});


// Vite middleware setup
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  // Serve static files in production (if built)
  app.use(express.static('dist'));
  
  // Handle SPA routing for static files
  app.get('*', (req, res) => {
    // Check if request is for API
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile('index.html', { root: 'dist' });
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
