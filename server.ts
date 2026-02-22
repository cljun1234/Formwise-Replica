import 'dotenv/config';
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { getDb } from './src/db.ts';
import { GoogleGenAI } from '@google/genai';
import OpenAI from 'openai';

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API Routes

// Get all forms
app.get('/api/forms', async (req, res) => {
  try {
    const db = await getDb();
    const forms = await db.all('SELECT * FROM forms ORDER BY created_at DESC');
    res.json(forms);
  } catch (error) {
    console.error('Error fetching forms:', error);
    res.status(500).json({ error: 'Failed to fetch forms' });
  }
});

// Get a single form with fields and resources
app.get('/api/forms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    const form = await db.get('SELECT * FROM forms WHERE id = ?', id);
    
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    const fields = await db.all('SELECT * FROM fields WHERE form_id = ? ORDER BY order_index ASC', id);
    const resources = await db.all(`
      SELECT r.* FROM resources r
      JOIN form_resources fr ON r.id = fr.resource_id
      WHERE fr.form_id = ?
    `, id);

    res.json({ ...form, fields, resources });
  } catch (error) {
    console.error('Error fetching form:', error);
    res.status(500).json({ error: 'Failed to fetch form' });
  }
});

// Create a new form
app.post('/api/forms', async (req, res) => {
  try {
    const { title, description, prompt_template, fields, provider, model, resource_ids } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const db = await getDb();
    const result = await db.run(
      'INSERT INTO forms (title, description, prompt_template, provider, model) VALUES (?, ?, ?, ?, ?)',
      title, 
      description || '', 
      prompt_template || '',
      provider || 'gemini',
      model || 'gemini-2.5-flash-latest'
    );
    const formId = result.lastID;

    if (fields && Array.isArray(fields)) {
      for (let index = 0; index < fields.length; index++) {
        const field = fields[index];
        await db.run(
          'INSERT INTO fields (form_id, name, label, type, placeholder, required, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
          formId, field.name, field.label, field.type, field.placeholder || '', field.required ? 1 : 0, index
        );
      }
    }

    if (resource_ids && Array.isArray(resource_ids)) {
      for (const resourceId of resource_ids) {
        await db.run('INSERT INTO form_resources (form_id, resource_id) VALUES (?, ?)', formId, resourceId);
      }
    }

    res.status(201).json({ id: formId, message: 'Form created successfully' });
  } catch (error) {
    console.error('Error creating form:', error);
    res.status(500).json({ error: 'Failed to create form' });
  }
});

// Update a form
app.put('/api/forms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, prompt_template, fields, provider, model, resource_ids } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const db = await getDb();
    await db.run(
      'UPDATE forms SET title = ?, description = ?, prompt_template = ?, provider = ?, model = ? WHERE id = ?',
      title, 
      description || '', 
      prompt_template || '', 
      provider || 'gemini',
      model || 'gemini-2.5-flash-latest',
      id
    );

    // Update fields
    await db.run('DELETE FROM fields WHERE form_id = ?', id);
    if (fields && Array.isArray(fields)) {
      for (let index = 0; index < fields.length; index++) {
        const field = fields[index];
        await db.run(
          'INSERT INTO fields (form_id, name, label, type, placeholder, required, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)',
          id, field.name, field.label, field.type, field.placeholder || '', field.required ? 1 : 0, index
        );
      }
    }

    // Update resources
    await db.run('DELETE FROM form_resources WHERE form_id = ?', id);
    if (resource_ids && Array.isArray(resource_ids)) {
      for (const resourceId of resource_ids) {
        await db.run('INSERT INTO form_resources (form_id, resource_id) VALUES (?, ?)', id, resourceId);
      }
    }

    res.json({ message: 'Form updated successfully' });
  } catch (error) {
    console.error('Error updating form:', error);
    res.status(500).json({ error: 'Failed to update form' });
  }
});

// Delete a form
app.delete('/api/forms/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await db.run('DELETE FROM fields WHERE form_id = ?', id);
    await db.run('DELETE FROM form_resources WHERE form_id = ?', id);
    await db.run('DELETE FROM forms WHERE id = ?', id);
    res.json({ message: 'Form deleted successfully' });
  } catch (error) {
    console.error('Error deleting form:', error);
    res.status(500).json({ error: 'Failed to delete form' });
  }
});

// Resources API
app.get('/api/resources', async (req, res) => {
  try {
    const db = await getDb();
    const resources = await db.all('SELECT * FROM resources ORDER BY created_at DESC');
    res.json(resources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

app.post('/api/resources', async (req, res) => {
  try {
    const { name, type, content } = req.body;
    if (!name || !content) {
      return res.status(400).json({ error: 'Name and content are required' });
    }
    const db = await getDb();
    await db.run('INSERT INTO resources (name, type, content) VALUES (?, ?, ?)', name, type || 'text', content);
    res.status(201).json({ message: 'Resource created' });
  } catch (error) {
    console.error('Error creating resource:', error);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

app.delete('/api/resources/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = await getDb();
    await db.run('DELETE FROM resources WHERE id = ?', id);
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

    const db = await getDb();
    const form = await db.get('SELECT * FROM forms WHERE id = ?', id) as any;
    if (!form) {
      return res.status(404).json({ error: 'Form not found' });
    }

    // Fetch attached resources
    const resources = await db.all(`
      SELECT r.content, r.name FROM resources r
      JOIN form_resources fr ON r.id = fr.resource_id
      WHERE fr.form_id = ?
    `, id) as any[];

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
    appType: 'custom',
  });

  app.use((req, res, next) => {
    const url = req.originalUrl.split('?')[0];
    if (url.endsWith('.tsx') || url.endsWith('.ts') || url.endsWith('.jsx')) {
      res.setHeader('Content-Type', 'application/javascript');
    }

    const originalSetHeader = res.setHeader;
    res.setHeader = function(name: string, value: string | number | readonly string[]) {
      if (name.toLowerCase() === 'content-type') {
        if (url.endsWith('.tsx') || url.endsWith('.ts') || url.endsWith('.jsx')) {
          // If the value is text/plain, force it to application/javascript
          if (String(value).includes('text/plain')) {
            value = 'application/javascript';
          }
        }
      }
      return originalSetHeader.call(this, name, value);
    };

    const originalWriteHead = res.writeHead;
    res.writeHead = function(statusCode: number, statusMessage?: string | any, headers?: any) {
      if (typeof statusMessage === 'object' && !headers) {
        headers = statusMessage;
        statusMessage = undefined;
      }

      if (url.endsWith('.tsx') || url.endsWith('.ts') || url.endsWith('.jsx')) {
         // Check if headers object contains Content-Type and patch it
         if (headers && typeof headers === 'object') {
             for (const key in headers) {
                 if (key.toLowerCase() === 'content-type') {
                    if (String(headers[key]).includes('text/plain')) {
                        headers[key] = 'application/javascript';
                    }
                 }
             }
         }
         // Also check if setHeader was already called (which is stored in internal headers)
         // Node's getHeader might return it.
         const existingType = res.getHeader('Content-Type');
         if (existingType && String(existingType).includes('text/plain')) {
             res.setHeader('Content-Type', 'application/javascript');
         }
      }
      return originalWriteHead.call(this, statusCode, statusMessage, headers);
    };

    next();
  });

  app.use(vite.middlewares);
  
  // Handle SPA routing in dev mode - this is crucial!
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      // 1. Read index.html
      const fs = await import('fs');
      const path = await import('path');
      const template = fs.readFileSync(path.resolve(process.cwd(), 'index.html'), 'utf-8');
      
      // 2. Apply Vite HTML transforms. This injects the HMR client.
      const html = await vite.transformIndexHtml(url, template);
      
      // 3. Send back the transformed HTML
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
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
