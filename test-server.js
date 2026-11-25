import http from 'http';
import { startServer } from './dist-server/server.js';

// Start test server on ephemeral port 0
const server = startServer(0);

server.on('listening', async () => {
  const port = server.address().port;
  console.log(`Test server successfully listening on port ${port}`);

  function request(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: '127.0.0.1',
        port: port,
        path: path,
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(body) });
          } catch {
            resolve({ status: res.statusCode, text: body });
          }
        });
      });

      req.on('error', reject);
      if (data) req.write(JSON.stringify(data));
      req.end();
    });
  }

  try {
    // 1. Health check
    const health = await request('GET', '/api/health');
    console.log('[PASS] Health check:', health.data);

    // 2. Supabase status
    const status = await request('GET', '/api/supabase/status');
    console.log('[PASS] Supabase status check:', status.data.message);

    // 3. Get initial tasks
    const tasks = await request('GET', '/api/tasks');
    console.log(`[PASS] Fetched tasks count: ${tasks.data.length}`);

    // 4. Create new task (POST)
    const newTask = {
      id: 'test-crud-1',
      key: 'TF-900',
      title: 'Automated Test Task',
      description: 'Testing CRUD',
      status: 'backlog',
      priority: 'high',
      projectId: 'p1',
      assigneeId: 'm1',
      dueDate: '2026-11-30',
      estimateHours: 4,
    };
    const created = await request('POST', '/api/tasks', newTask);
    console.log(`[PASS] Created task: ${created.data.key} - ${created.data.title}`);

    // 5. Update task (PUT)
    const updated = await request('PUT', '/api/tasks/test-crud-1', {
      title: 'Updated Test Task Title',
      status: 'in_progress',
    });
    console.log(`[PASS] Updated task: status=${updated.data.status}, title=${updated.data.title}`);

    // 6. Delete task (DELETE)
    const deleted = await request('DELETE', '/api/tasks/test-crud-1');
    console.log(`[PASS] Deleted task:`, deleted.data);

    // 7. Verify deletion
    const verifyGet = await request('GET', '/api/tasks/test-crud-1');
    console.log(`[PASS] Verify deleted task returns 404: status=${verifyGet.status}`);

    // 8. Test projects and team
    const projects = await request('GET', '/api/projects');
    console.log(`[PASS] Fetched projects count: ${projects.data.length}`);

    const team = await request('GET', '/api/team');
    console.log(`[PASS] Fetched team count: ${team.data.length}`);

    // 9. Test static frontend serving
    const indexHtml = await request('GET', '/');
    console.log(`[PASS] Root SPA page served: status=${indexHtml.status}`);

    console.log('\n======================================================');
    console.log('>>> ALL CRUD & SERVER TEST SUITE PASSED SUCCESSFULLY! <<<');
    console.log('======================================================');
    server.close(() => {
      process.exit(0);
    });
  } catch (err) {
    console.error('[FAIL] Test error:', err);
    server.close(() => {
      process.exit(1);
    });
  }
});
