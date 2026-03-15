import express from 'express';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import cors from 'cors';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, '/data/videos.json');
const CATEGORIES_FILE = path.join(__dirname, '/data/categories.json');
const ENV_FILE = path.join(__dirname, '.env');
const SESSION_COOKIE_NAME = 'bcache_admin_session';
const activeAdminSessions = new Map();
const loginAttempts = new Map();

loadEnvFile();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
const SESSION_TTL_MS = Number(process.env.ADMIN_SESSION_TTL_MS || 1000 * 60 * 60 * 12);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-this-admin-password';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const ADMIN_PASSWORD_SALT = process.env.ADMIN_PASSWORD_SALT || '';

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json());

app.use(async (_req, _res, next) => {
    try {
        await ensureCategoriesFile();
        next();
    } catch (err) {
        next(err);
    }
});

function loadEnvFile() {
    try {
        const content = fsSync.readFileSync(ENV_FILE, 'utf-8');
        for (const rawLine of content.split('\n')) {
            const line = rawLine.trim();
            if (!line || line.startsWith('#')) continue;
            const separatorIndex = line.indexOf('=');
            if (separatorIndex === -1) continue;
            const key = line.slice(0, separatorIndex).trim();
            const value = line.slice(separatorIndex + 1).trim().replace(/^['"]|['"]$/g, '');
            if (key && !process.env[key]) {
                process.env[key] = value;
            }
        }
    } catch {
        // .env is optional in local development.
    }
}

async function ensureCategoriesFile() {
    try {
        await fs.access(CATEGORIES_FILE);
    } catch {
        const videos = await readJson(DATA_FILE, []);
        const categories = Array.from(new Set(videos.map(video => video.category).filter(Boolean))).sort();
        await fs.writeFile(CATEGORIES_FILE, JSON.stringify(categories, null, 2));
    }
}

async function readJson(filePath, fallback) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch {
        return fallback;
    }
}

function createAdminSessionId() {
    return crypto.randomBytes(32).toString('hex');
}

function requireAdmin(req, res, next) {
    const sessionId = getCookieValue(req, SESSION_COOKIE_NAME);
    const session = sessionId ? activeAdminSessions.get(sessionId) : null;

    if (!sessionId || !session || session.expiresAt < Date.now()) {
        if (sessionId) {
            activeAdminSessions.delete(sessionId);
            clearSessionCookie(res);
        }
        return res.status(401).json({ error: 'Admin access required' });
    }

    session.expiresAt = Date.now() + SESSION_TTL_MS;
    setSessionCookie(res, sessionId, session.expiresAt);
    next();
}

function getCookieValue(req, cookieName) {
    const cookieHeader = req.headers.cookie || '';
    const cookies = cookieHeader.split(';');
    for (const cookie of cookies) {
        const [name, ...valueParts] = cookie.trim().split('=');
        if (name === cookieName) {
            return decodeURIComponent(valueParts.join('='));
        }
    }

    return '';
}

function setSessionCookie(res, sessionId, expiresAt) {
    const expires = new Date(expiresAt).toUTCString();
    const parts = [
        `${SESSION_COOKIE_NAME}=${encodeURIComponent(sessionId)}`,
        'Path=/',
        'HttpOnly',
        'SameSite=Strict',
        `Expires=${expires}`,
    ];

    if (COOKIE_SECURE) {
        parts.push('Secure');
    }

    res.setHeader('Set-Cookie', parts.join('; '));
}

function clearSessionCookie(res) {
    const parts = [
        `${SESSION_COOKIE_NAME}=`,
        'Path=/',
        'HttpOnly',
        'SameSite=Strict',
        'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
    ];

    if (COOKIE_SECURE) {
        parts.push('Secure');
    }

    res.setHeader('Set-Cookie', parts.join('; '));
}

function requireTrustedOrigin(req, res, next) {
    const origin = req.headers.origin;
    if (origin && origin !== FRONTEND_ORIGIN) {
        return res.status(403).json({ error: 'Untrusted origin' });
    }
    next();
}

function validateVideoPayload(payload) {
    if (!payload || typeof payload !== 'object') {
        return 'Invalid video payload';
    }

    const requiredFields = ['id', 'title', 'creator', 'date', 'description', 'category', 'platforms'];
    for (const field of requiredFields) {
        if (!(field in payload)) {
            return `Missing field: ${field}`;
        }
    }

    if (typeof payload.id !== 'string' || !payload.id.trim()) return 'Invalid video id';
    if (typeof payload.title !== 'string' || !payload.title.trim()) return 'Invalid title';
    if (typeof payload.creator !== 'string' || !payload.creator.trim()) return 'Invalid creator';
    if (typeof payload.date !== 'string' || !payload.date.trim()) return 'Invalid date';
    if (typeof payload.description !== 'string') return 'Invalid description';
    if (typeof payload.category !== 'string' || !payload.category.trim()) return 'Invalid category';
    if (!Array.isArray(payload.tags) || !payload.tags.every(tag => typeof tag === 'string')) return 'Invalid tags';
    if (!payload.platforms || typeof payload.platforms !== 'object' || Array.isArray(payload.platforms)) return 'Invalid platforms';

    return null;
}

function normalizeCategoryName(value) {
    return value.trim().replace(/\s+/g, ' ');
}

function isRateLimited(ipAddress) {
    const now = Date.now();
    const windowMs = 10 * 60 * 1000;
    const maxAttempts = 5;
    const attempts = (loginAttempts.get(ipAddress) || []).filter(timestamp => now - timestamp < windowMs);
    loginAttempts.set(ipAddress, attempts);
    return attempts.length >= maxAttempts;
}

function recordFailedLogin(ipAddress) {
    const attempts = loginAttempts.get(ipAddress) || [];
    attempts.push(Date.now());
    loginAttempts.set(ipAddress, attempts);
}

function createPasswordHash(password, salt) {
    return crypto.scryptSync(password, salt, 64).toString('hex');
}

function verifyAdminPassword(password) {
    if (ADMIN_PASSWORD_HASH && ADMIN_PASSWORD_SALT) {
        const incomingHash = Buffer.from(createPasswordHash(password, ADMIN_PASSWORD_SALT), 'hex');
        const storedHash = Buffer.from(ADMIN_PASSWORD_HASH, 'hex');
        return incomingHash.length === storedHash.length && crypto.timingSafeEqual(incomingHash, storedHash);
    }

    return password === ADMIN_PASSWORD;
}

app.get('/api/admin/session', (req, res) => {
    const sessionId = getCookieValue(req, SESSION_COOKIE_NAME);
    const session = sessionId ? activeAdminSessions.get(sessionId) : null;

    if (!session || session.expiresAt < Date.now()) {
        if (sessionId) {
            activeAdminSessions.delete(sessionId);
            clearSessionCookie(res);
        }
        return res.json({ authenticated: false });
    }

    session.expiresAt = Date.now() + SESSION_TTL_MS;
    setSessionCookie(res, sessionId, session.expiresAt);
    res.json({ authenticated: true });
});

app.post('/api/admin/login', requireTrustedOrigin, (req, res) => {
    const ipAddress = req.ip || 'unknown';

    if (isRateLimited(ipAddress)) {
        return res.status(429).json({ error: 'Too many failed login attempts. Try again later.' });
    }

    if (!req.body || !verifyAdminPassword(req.body.password || '')) {
        recordFailedLogin(ipAddress);
        return res.status(401).json({ error: 'Invalid admin password' });
    }

    loginAttempts.delete(ipAddress);
    const sessionId = createAdminSessionId();
    const expiresAt = Date.now() + SESSION_TTL_MS;
    activeAdminSessions.set(sessionId, { expiresAt });
    setSessionCookie(res, sessionId, expiresAt);
    res.json({ success: true });
});

app.post('/api/admin/logout', requireTrustedOrigin, requireAdmin, (req, res) => {
    const sessionId = getCookieValue(req, SESSION_COOKIE_NAME);
    if (sessionId) {
        activeAdminSessions.delete(sessionId);
    }
    clearSessionCookie(res);
    res.json({ success: true });
});

// Get all videos
app.get('/api/videos', async (req, res) => {
    try {
        const videos = await readJson(DATA_FILE, []);
        res.json(videos);
    } catch (err) {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

app.get('/api/categories', async (_req, res) => {
    try {
        const categories = await readJson(CATEGORIES_FILE, []);
        res.json(categories);
    } catch {
        res.status(500).json({ error: 'Failed to read categories' });
    }
});

app.post('/api/categories', requireTrustedOrigin, requireAdmin, async (req, res) => {
    try {
        const rawName = typeof req.body?.name === 'string' ? req.body.name : '';
        const categoryName = normalizeCategoryName(rawName);

        if (!categoryName) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const categories = await readJson(CATEGORIES_FILE, []);
        const alreadyExists = categories.some(existing => existing.toLowerCase() === categoryName.toLowerCase());

        if (alreadyExists) {
            return res.status(409).json({ error: 'Category already exists' });
        }

        const nextCategories = [...categories, categoryName].sort((a, b) => a.localeCompare(b));
        await fs.writeFile(CATEGORIES_FILE, JSON.stringify(nextCategories, null, 2));
        res.json({ success: true, categories: nextCategories });
    } catch {
        res.status(500).json({ error: 'Failed to save category' });
    }
});

// Add/Update video
app.post('/api/videos', requireTrustedOrigin, requireAdmin, async (req, res) => {
    try {
        const newVideo = req.body;
        const validationError = validateVideoPayload(newVideo);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const videos = await readJson(DATA_FILE, []);
        const categories = await readJson(CATEGORIES_FILE, []);

        const hasCategory = categories.some(category => category.toLowerCase() === newVideo.category.trim().toLowerCase());
        if (!hasCategory) {
            return res.status(400).json({ error: 'Category does not exist. Create it first from the admin panel.' });
        }

        const index = videos.findIndex(v => v.id === newVideo.id);
        if (index !== -1) {
            videos[index] = newVideo;
        } else {
            videos.push(newVideo);
        }

        await fs.writeFile(DATA_FILE, JSON.stringify(videos, null, 2));
        res.json({ success: true, video: newVideo });
    } catch (err) {
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Delete video
app.delete('/api/videos/:id', requireTrustedOrigin, requireAdmin, async (req, res) => {
    try {
        const videos = await readJson(DATA_FILE, []);
        const filtered = videos.filter(v => v.id !== req.params.id);
        await fs.writeFile(DATA_FILE, JSON.stringify(filtered, null, 2));
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete data' });
    }
});

app.listen(PORT, () => {
    if (!ADMIN_PASSWORD_HASH || !ADMIN_PASSWORD_SALT) {
        console.warn('ADMIN_PASSWORD_HASH / ADMIN_PASSWORD_SALT are not set. Use a hashed admin password before deploying publicly.');
    } else if (ADMIN_PASSWORD === 'change-this-admin-password') {
        console.warn('Plain ADMIN_PASSWORD fallback is using the default value. Keep it unset when using hashed credentials.');
    }
    console.log(`Simple backend running at http://localhost:${PORT}`);
});
