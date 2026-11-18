import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/ochre';

export let isPostgresAvailable = false;
let pool: Pool | null = null;

const DEVELOPER_COLORS = ['#3b82f6', '#22c55e', '#f97316', '#a855f7', '#14b8a6', '#ec4899'];

// ─── Record types ─────────────────────────────────────────────────────────────

export interface UserRecord {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  color: string;
  created_at: string; // stored as ISO string for JSON serialisation
}

export interface ProjectRecord {
  id: string;
  name: string;
  description: string;
  owner_id: string;
  join_code: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectMemberRecord {
  id: string;
  project_id: string;
  user_id: string;
  joined_at: string;
}

export interface BranchRecord {
  id: string;
  project_id: string;
  name: string;
  is_default: boolean;
  created_by: string | null;
  created_at: string;
}

// ─── File-backed in-memory fallback ──────────────────────────────────────────
// When PostgreSQL is unavailable, data is stored in a JSON file next to the
// process so it survives server restarts. The file is written synchronously
// (after every mutation) to avoid data loss on crash.

const FALLBACK_DB_PATH = process.env.OCHRE_FALLBACK_DB
  || path.join(process.cwd(), 'ochre_fallback_db.json');

interface FallbackDb {
  users: UserRecord[];
  projects: ProjectRecord[];
  projectMembers: ProjectMemberRecord[];
  branches: BranchRecord[];
}

function loadFallbackDb(): FallbackDb {
  if (fs.existsSync(FALLBACK_DB_PATH)) {
    try {
      const raw = fs.readFileSync(FALLBACK_DB_PATH, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<FallbackDb>;
      return {
        users: parsed.users ?? [],
        projects: parsed.projects ?? [],
        projectMembers: parsed.projectMembers ?? [],
        branches: parsed.branches ?? []
      };
    } catch (err) {
      console.warn('⚠️  Could not parse fallback DB file, starting fresh:', err);
    }
  }
  return { users: [], projects: [], projectMembers: [], branches: [] };
}

function saveFallbackDb(db: FallbackDb): void {
  try {
    fs.writeFileSync(FALLBACK_DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.warn('⚠️  Could not write fallback DB file:', err);
  }
}

// Singleton in-process store — loaded once from disk on startup
let memoryDb: FallbackDb = loadFallbackDb();

// Helper to persist after every write operation
function persist() {
  saveFallbackDb(memoryDb);
}

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initDatabase(): Promise<void> {
  try {
    pool = new Pool({
      connectionString,
      connectionTimeoutMillis: 3000,
      idleTimeoutMillis: 30000,
      max: 20
    });

    const client = await pool.connect();
    client.release();
    isPostgresAvailable = true;
    console.log('✅ Connected to PostgreSQL database.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const sql = fs.readFileSync(schemaPath, 'utf-8');
      await pool.query(sql);
      console.log('✅ PostgreSQL schema initialized.');
    }
  } catch (err: any) {
    isPostgresAvailable = false;
    // Reload from disk in case the file was written by a previous run
    memoryDb = loadFallbackDb();
    console.warn(
      `⚠️  PostgreSQL not available (${err.message}).\n` +
      `   Using file-backed fallback DB → ${FALLBACK_DB_PATH}`
    );
    console.log(
      `   Fallback DB loaded: ${memoryDb.users.length} users, ` +
      `${memoryDb.projects.length} projects, ` +
      `${memoryDb.projectMembers.length} memberships, ` +
      `${memoryDb.branches.length} branches`
    );
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function hashPassword(password: string): string {
  const salt = 'ochre_secure_salt_2026';
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

export function generate6DigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function newId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function createUser(username: string, email: string, passwordRaw: string): Promise<UserRecord> {
  if (await findUserByUsername(username)) throw new Error('Username is already taken');
  if (await findUserByEmail(email)) throw new Error('Email is already registered');

  const id = newId('usr');
  const password_hash = hashPassword(passwordRaw);
  const color = DEVELOPER_COLORS[Math.floor(Math.random() * DEVELOPER_COLORS.length)];
  const now = nowIso();

  if (isPostgresAvailable && pool) {
    const res = await pool.query(
      'INSERT INTO users (id, username, email, password_hash, color, created_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [id, username, email, password_hash, color, now]
    );
    return _pgRowToUser(res.rows[0]);
  }

  const user: UserRecord = { id, username, email, password_hash, color, created_at: now };
  memoryDb.users.push(user);
  persist();
  return user;
}

export async function findUserByUsername(username: string): Promise<UserRecord | null> {
  if (isPostgresAvailable && pool) {
    const res = await pool.query('SELECT * FROM users WHERE LOWER(username)=LOWER($1)', [username]);
    return res.rows[0] ? _pgRowToUser(res.rows[0]) : null;
  }
  return memoryDb.users.find(u => u.username.toLowerCase() === username.toLowerCase()) ?? null;
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  if (isPostgresAvailable && pool) {
    const res = await pool.query('SELECT * FROM users WHERE LOWER(email)=LOWER($1)', [email]);
    return res.rows[0] ? _pgRowToUser(res.rows[0]) : null;
  }
  return memoryDb.users.find(u => u.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function findUserById(id: string): Promise<UserRecord | null> {
  if (isPostgresAvailable && pool) {
    const res = await pool.query('SELECT * FROM users WHERE id=$1', [id]);
    return res.rows[0] ? _pgRowToUser(res.rows[0]) : null;
  }
  return memoryDb.users.find(u => u.id === id) ?? null;
}

// Postgres rows return Date objects; normalise them to ISO strings for a
// uniform interface regardless of backend.
function _pgRowToUser(row: any): UserRecord {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    password_hash: row.password_hash,
    color: row.color,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}

function _pgRowToProject(row: any): ProjectRecord {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    owner_id: row.owner_id,
    join_code: row.join_code,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
    updated_at: row.updated_at instanceof Date ? row.updated_at.toISOString() : row.updated_at
  };
}

function _pgRowToBranch(row: any): BranchRecord {
  return {
    id: row.id,
    project_id: row.project_id,
    name: row.name,
    is_default: row.is_default,
    created_by: row.created_by ?? null,
    created_at: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at
  };
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function createProject(name: string, description: string, ownerId: string): Promise<ProjectRecord> {
  const id = newId('proj');
  const join_code = generate6DigitCode();
  const now = nowIso();

  if (isPostgresAvailable && pool) {
    const res = await pool.query(
      'INSERT INTO projects (id, name, description, owner_id, join_code, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$6) RETURNING *',
      [id, name, description, ownerId, join_code, now]
    );
    const project = _pgRowToProject(res.rows[0]);
    await pool.query(
      'INSERT INTO project_members (id, project_id, user_id, joined_at) VALUES ($1,$2,$3,$4)',
      [newId('pm'), id, ownerId, now]
    );
    await _createBranch(id, 'main', true, ownerId);
    return project;
  }

  const project: ProjectRecord = { id, name, description, owner_id: ownerId, join_code, created_at: now, updated_at: now };
  memoryDb.projects.push(project);
  memoryDb.projectMembers.push({ id: newId('pm'), project_id: id, user_id: ownerId, joined_at: now });
  persist(); // write before branch so even partial success is saved
  await _createBranch(id, 'main', true, ownerId);
  return project;
}

export async function getUserProjects(userId: string): Promise<ProjectRecord[]> {
  if (isPostgresAvailable && pool) {
    const res = await pool.query(
      `SELECT p.* FROM projects p
       JOIN project_members pm ON p.id=pm.project_id
       WHERE pm.user_id=$1
       ORDER BY p.updated_at DESC`,
      [userId]
    );
    return res.rows.map(_pgRowToProject);
  }
  const ids = new Set(
    memoryDb.projectMembers.filter(pm => pm.user_id === userId).map(pm => pm.project_id)
  );
  return memoryDb.projects
    .filter(p => ids.has(p.id))
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
}

export async function joinProjectByCode(userId: string, joinCode: string): Promise<ProjectRecord> {
  let project: ProjectRecord | null = null;

  if (isPostgresAvailable && pool) {
    const res = await pool.query('SELECT * FROM projects WHERE join_code=$1', [joinCode.trim()]);
    project = res.rows[0] ? _pgRowToProject(res.rows[0]) : null;
  } else {
    project = memoryDb.projects.find(p => p.join_code === joinCode.trim()) ?? null;
  }

  if (!project) throw new Error('Invalid project code. Please check the 6-digit code and try again.');

  const already = await isProjectMember(project.id, userId);
  if (!already) {
    const now = nowIso();
    if (isPostgresAvailable && pool) {
      await pool.query(
        'INSERT INTO project_members (id, project_id, user_id, joined_at) VALUES ($1,$2,$3,$4) ON CONFLICT DO NOTHING',
        [newId('pm'), project.id, userId, now]
      );
    } else {
      memoryDb.projectMembers.push({ id: newId('pm'), project_id: project.id, user_id: userId, joined_at: now });
      persist();
    }
  }

  return project;
}

export async function getProjectById(projectId: string): Promise<ProjectRecord | null> {
  if (isPostgresAvailable && pool) {
    const res = await pool.query('SELECT * FROM projects WHERE id=$1', [projectId]);
    return res.rows[0] ? _pgRowToProject(res.rows[0]) : null;
  }
  return memoryDb.projects.find(p => p.id === projectId) ?? null;
}

export async function isProjectMember(projectId: string, userId: string): Promise<boolean> {
  if (isPostgresAvailable && pool) {
    const res = await pool.query(
      'SELECT 1 FROM project_members WHERE project_id=$1 AND user_id=$2',
      [projectId, userId]
    );
    return res.rows.length > 0;
  }
  return memoryDb.projectMembers.some(pm => pm.project_id === projectId && pm.user_id === userId);
}

// ─── Branches ─────────────────────────────────────────────────────────────────

async function _createBranch(projectId: string, name: string, isDefault: boolean, createdBy: string): Promise<BranchRecord> {
  const id = newId('br');
  const now = nowIso();

  if (isPostgresAvailable && pool) {
    const res = await pool.query(
      'INSERT INTO branches (id, project_id, name, is_default, created_by, created_at) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [id, projectId, name, isDefault, createdBy, now]
    );
    return _pgRowToBranch(res.rows[0]);
  }
  const branch: BranchRecord = { id, project_id: projectId, name, is_default: isDefault, created_by: createdBy, created_at: now };
  memoryDb.branches.push(branch);
  persist();
  return branch;
}

export async function getProjectBranches(projectId: string): Promise<BranchRecord[]> {
  if (isPostgresAvailable && pool) {
    const res = await pool.query(
      'SELECT * FROM branches WHERE project_id=$1 ORDER BY is_default DESC, created_at ASC',
      [projectId]
    );
    return res.rows.map(_pgRowToBranch);
  }
  return memoryDb.branches
    .filter(b => b.project_id === projectId)
    .sort((a, b) => (b.is_default ? 1 : 0) - (a.is_default ? 1 : 0));
}

export async function createBranch(projectId: string, name: string, userId: string): Promise<BranchRecord> {
  const existing = await getBranchByName(projectId, name);
  if (existing) throw new Error(`Branch "${name}" already exists`);
  return _createBranch(projectId, name, false, userId);
}

export async function renameBranch(branchId: string, newName: string, projectId: string): Promise<BranchRecord> {
  const branch = await getBranchById(branchId);
  if (!branch) throw new Error('Branch not found');
  if (branch.is_default) throw new Error('Cannot rename the default branch');

  const conflict = await getBranchByName(projectId, newName);
  if (conflict) throw new Error(`Branch "${newName}" already exists`);

  if (isPostgresAvailable && pool) {
    const res = await pool.query('UPDATE branches SET name=$1 WHERE id=$2 RETURNING *', [newName, branchId]);
    return _pgRowToBranch(res.rows[0]);
  }
  const b = memoryDb.branches.find(x => x.id === branchId);
  if (!b) throw new Error('Branch not found');
  b.name = newName;
  persist();
  return b;
}

export async function deleteBranch(branchId: string): Promise<void> {
  const branch = await getBranchById(branchId);
  if (!branch) throw new Error('Branch not found');
  if (branch.is_default) throw new Error('Cannot delete the default branch');

  if (isPostgresAvailable && pool) {
    await pool.query('DELETE FROM branches WHERE id=$1', [branchId]);
    return;
  }
  const idx = memoryDb.branches.findIndex(b => b.id === branchId);
  if (idx !== -1) {
    memoryDb.branches.splice(idx, 1);
    persist();
  }
}

export async function getBranchById(branchId: string): Promise<BranchRecord | null> {
  if (isPostgresAvailable && pool) {
    const res = await pool.query('SELECT * FROM branches WHERE id=$1', [branchId]);
    return res.rows[0] ? _pgRowToBranch(res.rows[0]) : null;
  }
  return memoryDb.branches.find(b => b.id === branchId) ?? null;
}

export async function getBranchByName(projectId: string, name: string): Promise<BranchRecord | null> {
  if (isPostgresAvailable && pool) {
    const res = await pool.query('SELECT * FROM branches WHERE project_id=$1 AND name=$2', [projectId, name]);
    return res.rows[0] ? _pgRowToBranch(res.rows[0]) : null;
  }
  return memoryDb.branches.find(b => b.project_id === projectId && b.name === name) ?? null;
}
