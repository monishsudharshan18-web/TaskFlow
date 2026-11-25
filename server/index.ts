import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dbService } from './supabase.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req: Request, _res: Response, next: NextFunction) => {
  if (req.path.startsWith('/api')) {
    console.log(`[API] ${req.method} ${req.path}`);
  }
  next();
});

// ==========================================
// Health & Supabase Status Endpoints
// ==========================================

app.get('/api/health', async (_req: Request, res: Response) => {
  const isSupabase = dbService.isSupabaseConfigured();
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: isSupabase ? 'supabase' : 'local-in-memory',
    supabaseConfigured: isSupabase,
  });
});

app.get('/api/supabase/status', async (_req: Request, res: Response) => {
  const result = await dbService.testConnection();
  res.json({
    configured: dbService.isSupabaseConfigured(),
    ...result,
  });
});

app.post('/api/supabase/seed', async (_req: Request, res: Response) => {
  try {
    const result = await dbService.seedData();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// Projects & Team Endpoints
// ==========================================

app.get('/api/projects', async (_req: Request, res: Response) => {
  try {
    const projects = await dbService.getProjects();
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/team', async (_req: Request, res: Response) => {
  try {
    const team = await dbService.getTeam();
    res.json(team);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// Tasks CRUD Endpoints
// ==========================================

// 1. READ: Get all tasks (with optional filter by projectId and search query)
app.get('/api/tasks', async (req: Request, res: Response) => {
  try {
    const projectId = req.query.projectId as string | undefined;
    const search = req.query.search as string | undefined;
    const tasks = await dbService.getTasks(projectId, search);
    res.json(tasks);
  } catch (err: any) {
    console.error('Error fetching tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks', details: err.message });
  }
});

// 2. READ: Get single task by ID
app.get('/api/tasks/:id', async (req: Request, res: Response) => {
  try {
    const task = await dbService.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(task);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch task', details: err.message });
  }
});

// 3. CREATE: Create new task
app.post('/api/tasks', async (req: Request, res: Response) => {
  try {
    const { title, key, status, priority, projectId, assigneeId, dueDate, estimateHours, description, subtasks, comments } = req.body;

    if (!title || !key) {
      return res.status(400).json({ error: 'Title and key are required fields' });
    }

    const newTask = {
      id: req.body.id || `t_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      key,
      title,
      description: description || '',
      status: status || 'backlog',
      priority: priority || 'medium',
      projectId: projectId || 'p1',
      assigneeId: assigneeId || 'm1',
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      estimateHours: Number(estimateHours ?? 0),
      subtasks: Array.isArray(subtasks) ? subtasks : [],
      comments: Array.isArray(comments) ? comments : [],
      updatedAt: new Date().toISOString(),
    };

    const created = await dbService.createTask(newTask);
    res.status(201).json(created);
  } catch (err: any) {
    console.error('Error creating task:', err);
    res.status(500).json({ error: 'Failed to create task', details: err.message });
  }
});

// 4. UPDATE: Update existing task by ID
app.put('/api/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await dbService.updateTask(id, updates);
    if (!updated) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(updated);
  } catch (err: any) {
    console.error('Error updating task:', err);
    res.status(500).json({ error: 'Failed to update task', details: err.message });
  }
});

// 5. DELETE: Delete task by ID
app.delete('/api/tasks/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const success = await dbService.deleteTask(id);
    if (!success) {
      return res.status(404).json({ error: 'Task not found or already deleted' });
    }
    res.json({ success: true, message: `Task ${id} deleted successfully` });
  } catch (err: any) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task', details: err.message });
  }
});

// 6. BULK: Update status for multiple tasks
app.post('/api/tasks/bulk-status', async (req: Request, res: Response) => {
  try {
    const { taskIds, status } = req.body;
    if (!Array.isArray(taskIds) || !status) {
      return res.status(400).json({ error: 'taskIds array and status are required' });
    }
    const count = await dbService.bulkUpdateStatus(taskIds, status);
    res.json({ success: true, updatedCount: count });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to bulk update tasks', details: err.message });
  }
});

// 7. BULK: Delete multiple tasks
app.post('/api/tasks/bulk-delete', async (req: Request, res: Response) => {
  try {
    const { taskIds } = req.body;
    if (!Array.isArray(taskIds)) {
      return res.status(400).json({ error: 'taskIds array is required' });
    }
    const count = await dbService.bulkDelete(taskIds);
    res.json({ success: true, deletedCount: count });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to bulk delete tasks', details: err.message });
  }
});

// ==========================================
// Static Files & Production SPA Serving
// ==========================================

const possibleDistDirs = [
  path.resolve(__dirname, '../dist'),
  path.resolve(__dirname, './dist'),
  path.resolve(process.cwd(), 'dist'),
];

let distDir = possibleDistDirs.find((dir) => fs.existsSync(dir));

if (distDir) {
  console.log(`[Server] Serving production frontend build from: ${distDir}`);
  app.use(express.static(distDir));

  // SPA client-side fallback
  app.get('*', (req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir!, 'index.html'));
  });
} else {
  app.get('/', (_req: Request, res: Response) => {
    res.json({
      message: 'TaskFlow API Server is running.',
      environment: process.env.NODE_ENV || 'development',
      endpoints: {
        health: '/api/health',
        supabaseStatus: '/api/supabase/status',
        tasks: '/api/tasks',
        projects: '/api/projects',
        team: '/api/team',
      },
    });
  });
}

// Start Server
export function startServer(port: number | string = PORT) {
  return app.listen(port, () => {
    console.log(`===============================================`);
    console.log(` TaskFlow Server running on port ${port}`);
    console.log(` Health check: http://localhost:${port}/api/health`);
    console.log(` Database: ${dbService.isSupabaseConfigured() ? 'Supabase' : 'Local Fallback'}`);
    console.log(`===============================================`);
  });
}

const isDirectExecution =
  process.argv[1] &&
  !process.argv[1].includes('test') &&
  (/\b(dist-server[\\/])?server\.[jt]s$/i.test(process.argv[1]) ||
    /\bserver[\\/]index\.[jt]s$/i.test(process.argv[1]));

if (isDirectExecution && process.env.NO_SERVER_AUTOSTART !== 'true') {
  startServer(PORT);
}

export default app;
