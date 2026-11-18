import { Router } from 'express';
import {
  createUser,
  findUserByUsername,
  findUserById,
  hashPassword,
  createProject,
  getUserProjects,
  joinProjectByCode,
  getProjectById,
  isProjectMember,
  isPostgresAvailable,
  getProjectBranches,
  createBranch,
  renameBranch,
  deleteBranch,
  getBranchById
} from '../database/db';

const router = Router();

// ─── Auth helpers ─────────────────────────────────────────────────────────────

function generateToken(userId: string): string {
  return Buffer.from(JSON.stringify({ userId, time: Date.now() })).toString('base64');
}

function parseToken(tokenHeader?: string): string | null {
  if (!tokenHeader) return null;
  try {
    const raw = tokenHeader.replace('Bearer ', '');
    const decoded = JSON.parse(Buffer.from(raw, 'base64').toString('utf-8'));
    return decoded.userId || null;
  } catch {
    return null;
  }
}

function requireAuth(req: any, res: any): string | null {
  const userId = parseToken(req.headers.authorization);
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return null;
  }
  return userId;
}

// ─── Health ───────────────────────────────────────────────────────────────────

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Ochre IDE Backend',
    database: isPostgresAvailable ? 'postgresql' : 'in-memory-fallback',
    timestamp: new Date().toISOString()
  });
});

// ─── Auth ─────────────────────────────────────────────────────────────────────

// GET /api/auth/me — validate token and return current user profile
router.get('/auth/me', async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const user = await findUserById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id, username: user.username, email: user.email, color: user.color });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username?.trim()) return res.status(400).json({ error: 'Username is required' });
    if (!email?.trim() || !email.includes('@')) return res.status(400).json({ error: 'A valid email is required' });
    if (!password || password.length < 4) return res.status(400).json({ error: 'Password must be at least 4 characters' });

    const user = await createUser(username.trim(), email.trim(), password);
    const token = generateToken(user.id);
    res.status(201).json({ message: 'Account created', token, user: { id: user.id, username: user.username, email: user.email, color: user.color } });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

    const user = await findUserByUsername(username.trim());
    if (!user || hashPassword(password) !== user.password_hash) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user.id);
    res.json({ message: 'Login successful', token, user: { id: user.id, username: user.username, email: user.email, color: user.color } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Projects ─────────────────────────────────────────────────────────────────

router.get('/projects', async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const projects = await getUserProjects(userId);
    res.json(projects);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/projects', async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Project name is required' });
    const project = await createProject(name.trim(), description || '', userId);
    res.status(201).json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/projects/join', async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const { joinCode } = req.body;
    if (!joinCode?.trim()) return res.status(400).json({ error: '6-digit project code is required' });
    const project = await joinProjectByCode(userId, joinCode);
    res.json({ message: 'Joined project', project });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/projects/:id', async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const project = await getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!await isProjectMember(project.id, userId)) return res.status(403).json({ error: 'Access denied' });
    res.json(project);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── Branches ─────────────────────────────────────────────────────────────────

// GET /api/projects/:id/branches
router.get('/projects/:id/branches', async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const project = await getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!await isProjectMember(project.id, userId)) return res.status(403).json({ error: 'Access denied' });
    const branches = await getProjectBranches(project.id);
    res.json(branches);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/projects/:id/branches
router.post('/projects/:id/branches', async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const project = await getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    if (!await isProjectMember(project.id, userId)) return res.status(403).json({ error: 'Access denied' });

    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Branch name is required' });

    const branch = await createBranch(project.id, name.trim(), userId);
    res.status(201).json(branch);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PATCH /api/branches/:branchId — rename
router.patch('/branches/:branchId', async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const branch = await getBranchById(req.params.branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    if (!await isProjectMember(branch.project_id, userId)) return res.status(403).json({ error: 'Access denied' });

    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'New branch name is required' });

    const updated = await renameBranch(branch.id, name.trim(), branch.project_id);
    res.json(updated);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/branches/:branchId
router.delete('/branches/:branchId', async (req, res) => {
  const userId = requireAuth(req, res);
  if (!userId) return;
  try {
    const branch = await getBranchById(req.params.branchId);
    if (!branch) return res.status(404).json({ error: 'Branch not found' });
    if (!await isProjectMember(branch.project_id, userId)) return res.status(403).json({ error: 'Access denied' });

    await deleteBranch(branch.id);
    res.json({ message: 'Branch deleted' });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
