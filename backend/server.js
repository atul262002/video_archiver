import express from 'express';
import fsSync from 'fs';
import path from 'path';
import cors from 'cors';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { MongoClient, ObjectId } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const ENV_FILE = path.join(__dirname, '.env');
const SESSION_COOKIE_NAME = 'bcache_admin_session';
const activeAdminSessions = new Map();
const loginAttempts = new Map();
const suggestionSubmissions = new Map();

let mongoClient;
let mongoDb;

const SUGGESTION_KINDS = new Set(['video', 'channel', 'social', 'blog']);
const MAX_SUGGESTION_REFERENCE_LEN = 2000;
const MAX_SUGGESTION_NOTE_LEN = 2000;
const SUGGESTION_RATE_WINDOW_MS = 60 * 60 * 1000;
const SUGGESTION_RATE_MAX = 10;

loadEnvFile();

const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || 'http://localhost:5173';
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true' || process.env.NODE_ENV === 'production';
const SESSION_TTL_MS = Number(process.env.ADMIN_SESSION_TTL_MS || 1000 * 60 * 60 * 12);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'change-this-admin-password';
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || '';
const ADMIN_PASSWORD_SALT = process.env.ADMIN_PASSWORD_SALT || '';

//app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
const ALLOWED_ORIGINS = [
    'https://video-archiver.vercel.app',
    'http://localhost:5173',   // for local dev
];

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || ALLOWED_ORIGINS.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
app.use(express.json());

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

function isSuggestionRateLimited(ipAddress) {
    const now = Date.now();
    const attempts = (suggestionSubmissions.get(ipAddress) || []).filter(timestamp => now - timestamp < SUGGESTION_RATE_WINDOW_MS);
    suggestionSubmissions.set(ipAddress, attempts);
    return attempts.length >= SUGGESTION_RATE_MAX;
}

function recordSuggestionSubmission(ipAddress) {
    const attempts = suggestionSubmissions.get(ipAddress) || [];
    attempts.push(Date.now());
    suggestionSubmissions.set(ipAddress, attempts);
}

function validateSuggestionPayload(body) {
    if (!body || typeof body !== 'object') {
        return 'Invalid payload';
    }

    const kind = typeof body.kind === 'string' ? body.kind.trim() : '';
    if (!SUGGESTION_KINDS.has(kind)) {
        return 'Invalid kind; use video, channel, social, or blog';
    }

    const reference = typeof body.reference === 'string' ? body.reference.trim() : '';
    if (!reference) {
        return 'A link or description is required';
    }
    if (reference.length > MAX_SUGGESTION_REFERENCE_LEN) {
        return 'Link or description is too long';
    }

    const note = typeof body.note === 'string' ? body.note.trim() : '';
    if (note.length > MAX_SUGGESTION_NOTE_LEN) {
        return 'Note is too long';
    }

    return null;
}

/** @returns {Promise<boolean>} */
async function connectMongo() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error('MONGODB_URI is not set. Archive and suggestions require MongoDB.');
        return false;
    }

    const maxAttempts = 5;
    const delayMs = 2000;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            mongoClient = new MongoClient(uri);
            await mongoClient.connect();
            mongoDb = mongoClient.db();
            await mongoDb.collection('suggestions').createIndex({ createdAt: -1 });
            await mongoDb.collection('suggestions').createIndex({ archived: 1, createdAt: -1 });
            await mongoDb.collection('videos').createIndex({ id: 1 }, { unique: true });
            await mongoDb.collection('videos').createIndex({ updatedAt: -1 });
            console.log('Connected to MongoDB.');
            return true;
        } catch (err) {
            console.error(`MongoDB connection attempt ${attempt}/${maxAttempts} failed:`, err.message);
            if (mongoClient) {
                try {
                    await mongoClient.close();
                } catch {
                    // ignore
                }
                mongoClient = undefined;
            }
            mongoDb = undefined;
            if (attempt < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
    }

    console.error('Could not connect to MongoDB.');
    return false;
}

function stripMongoId(doc) {
    if (!doc || typeof doc !== 'object') return doc;
    const { _id, ...rest } = doc;
    return rest;
}

function buildVideoDocumentForStorage(payload, existing) {
    const now = new Date();
    let createdAt = now;
    if (existing?.createdAt instanceof Date) {
        createdAt = existing.createdAt;
    } else if (existing?.createdAt) {
        const parsed = new Date(existing.createdAt);
        if (!Number.isNaN(parsed.getTime())) createdAt = parsed;
    }

    const doc = {
        id: payload.id,
        title: payload.title,
        creator: payload.creator,
        date: payload.date,
        description: payload.description,
        category: payload.category,
        platforms: payload.platforms,
        tags: payload.tags,
        createdAt,
        updatedAt: now,
    };

    if (payload.thumbnailUrl !== undefined) {
        if (payload.thumbnailUrl) doc.thumbnailUrl = payload.thumbnailUrl;
    } else if (existing?.thumbnailUrl) {
        doc.thumbnailUrl = existing.thumbnailUrl;
    }

    return doc;
}

function parsePageParams(query) {
    const page = Math.max(1, parseInt(String(query.page || '1'), 10) || 1);
    const rawSize = parseInt(String(query.pageSize || '20'), 10) || 20;
    const pageSize = Math.min(100, Math.max(1, rawSize));
    return { page, pageSize, skip: (page - 1) * pageSize };
}

async function getAllVideosFromDb() {
    const docs = await mongoDb
        .collection('videos')
        .find({})
        .sort({ updatedAt: -1, createdAt: -1, id: 1 })
        .toArray();
    return docs.map(stripMongoId);
}

async function getCategoryNamesFromDb() {
    const docs = await mongoDb.collection('categories').find({}).project({ _id: 0, name: 1 }).toArray();
    return docs.map(d => d.name).sort((a, b) => a.localeCompare(b));
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

app.get('/video-api/admin/session', (req, res) => {
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

app.post('/video-api/admin/login', requireTrustedOrigin, (req, res) => {
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

app.post('/video-api/admin/logout', requireTrustedOrigin, requireAdmin, (req, res) => {
    const sessionId = getCookieValue(req, SESSION_COOKIE_NAME);
    if (sessionId) {
        activeAdminSessions.delete(sessionId);
    }
    clearSessionCookie(res);
    res.json({ success: true });
});

// Get all videos
app.get('/video-api/videos', async (_req, res) => {
    try {
        const videos = await getAllVideosFromDb();
        res.json(videos);
    } catch {
        res.status(500).json({ error: 'Failed to read data' });
    }
});

app.get('/video-api/categories', async (_req, res) => {
    try {
        const categories = await getCategoryNamesFromDb();
        res.json(categories);
    } catch {
        res.status(500).json({ error: 'Failed to read categories' });
    }
});

app.post('/video-api/categories', requireTrustedOrigin, requireAdmin, async (req, res) => {
    try {
        const rawName = typeof req.body?.name === 'string' ? req.body.name : '';
        const categoryName = normalizeCategoryName(rawName);

        if (!categoryName) {
            return res.status(400).json({ error: 'Category name is required' });
        }

        const categories = await getCategoryNamesFromDb();
        const alreadyExists = categories.some(existing => existing.toLowerCase() === categoryName.toLowerCase());

        if (alreadyExists) {
            return res.status(409).json({ error: 'Category already exists' });
        }

        await mongoDb.collection('categories').insertOne({ name: categoryName });
        const nextCategories = await getCategoryNamesFromDb();
        res.json({ success: true, categories: nextCategories });
    } catch {
        res.status(500).json({ error: 'Failed to save category' });
    }
});

app.get('/video-api/admin/videos', requireAdmin, async (req, res) => {
    try {
        const { page, pageSize, skip } = parsePageParams(req.query);
        const col = mongoDb.collection('videos');
        const total = await col.countDocuments({});
        const docs = await col
            .find({})
            .sort({ updatedAt: -1, createdAt: -1, id: 1 })
            .skip(skip)
            .limit(pageSize)
            .toArray();

        const items = docs.map(stripMongoId);
        res.json({ items, total, page, pageSize });
    } catch {
        res.status(500).json({ error: 'Failed to load videos' });
    }
});

// Add/Update video
app.post('/video-api/videos', requireTrustedOrigin, requireAdmin, async (req, res) => {
    try {
        const newVideo = req.body;
        const validationError = validateVideoPayload(newVideo);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        const categories = await getCategoryNamesFromDb();
        const hasCategory = categories.some(category => category.toLowerCase() === newVideo.category.trim().toLowerCase());
        if (!hasCategory) {
            return res.status(400).json({ error: 'Category does not exist. Create it first from the admin panel.' });
        }

        const existing = await mongoDb.collection('videos').findOne({ id: newVideo.id });
        const doc = buildVideoDocumentForStorage(newVideo, existing);
        await mongoDb.collection('videos').replaceOne({ id: newVideo.id }, doc, { upsert: true });
        res.json({ success: true, video: stripMongoId(doc) });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(409).json({ error: 'A video with this id already exists' });
        }
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// Delete video
app.delete('/video-api/videos/:id', requireTrustedOrigin, requireAdmin, async (req, res) => {
    try {
        await mongoDb.collection('videos').deleteOne({ id: req.params.id });
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to delete data' });
    }
});

app.post('/video-api/suggestions', requireTrustedOrigin, async (req, res) => {
    const ipAddress = req.ip || 'unknown';
    if (isSuggestionRateLimited(ipAddress)) {
        return res.status(429).json({ error: 'Too many suggestions. Please try again later.' });
    }

    const validationError = validateSuggestionPayload(req.body);
    if (validationError) {
        return res.status(400).json({ error: validationError });
    }

    const kind = req.body.kind.trim();
    const reference = req.body.reference.trim();
    const note = typeof req.body.note === 'string' ? req.body.note.trim() : '';

    try {
        const result = await mongoDb.collection('suggestions').insertOne({
            kind,
            reference,
            note,
            archived: false,
            createdAt: new Date(),
        });
        recordSuggestionSubmission(ipAddress);
        res.status(201).json({ success: true, id: result.insertedId.toString() });
    } catch {
        res.status(500).json({ error: 'Failed to save suggestion' });
    }
});

app.get('/video-api/suggestions', requireAdmin, async (req, res) => {
    try {
        const { page, pageSize, skip } = parsePageParams(req.query);
        const includeArchived = String(req.query.includeArchived || '') === 'true';

        const filter = includeArchived ? {} : { $or: [{ archived: false }, { archived: { $exists: false } }] };

        const col = mongoDb.collection('suggestions');
        const total = await col.countDocuments(filter);
        const docs = await col.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).toArray();

        const items = docs.map(doc => ({
            id: doc._id.toString(),
            kind: doc.kind,
            reference: doc.reference,
            note: doc.note || '',
            archived: Boolean(doc.archived),
            createdAt: doc.createdAt instanceof Date ? doc.createdAt.toISOString() : doc.createdAt,
        }));

        res.json({ items, total, page, pageSize, includeArchived });
    } catch {
        res.status(500).json({ error: 'Failed to load suggestions' });
    }
});

app.patch('/video-api/suggestions/:id', requireTrustedOrigin, requireAdmin, async (req, res) => {
    let oid;
    try {
        oid = new ObjectId(req.params.id);
    } catch {
        return res.status(400).json({ error: 'Invalid suggestion id' });
    }

    const archived = req.body?.archived;
    if (typeof archived !== 'boolean') {
        return res.status(400).json({ error: 'Body must include archived: true or false' });
    }

    try {
        const result = await mongoDb.collection('suggestions').updateOne({ _id: oid }, { $set: { archived } });
        if (result.matchedCount === 0) {
            return res.status(404).json({ error: 'Suggestion not found' });
        }
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to update suggestion' });
    }
});

app.delete('/video-api/suggestions/:id', requireTrustedOrigin, requireAdmin, async (req, res) => {
    let oid;
    try {
        oid = new ObjectId(req.params.id);
    } catch {
        return res.status(400).json({ error: 'Invalid suggestion id' });
    }

    try {
        const result = await mongoDb.collection('suggestions').deleteOne({ _id: oid });
        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Suggestion not found' });
        }
        res.json({ success: true });
    } catch {
        res.status(500).json({ error: 'Failed to delete suggestion' });
    }
});

async function startServer() {
    const connected = await connectMongo();
    if (!connected || !mongoDb) {
        console.error('Cannot start: MongoDB is required for the archive (videos, categories, suggestions).');
        process.exit(1);
    }

    app.listen(PORT, () => {
        if (!ADMIN_PASSWORD_HASH || !ADMIN_PASSWORD_SALT) {
            console.warn('ADMIN_PASSWORD_HASH / ADMIN_PASSWORD_SALT are not set. Use a hashed admin password before deploying publicly.');
        } else if (ADMIN_PASSWORD === 'change-this-admin-password') {
            console.warn('Plain ADMIN_PASSWORD fallback is using the default value. Keep it unset when using hashed credentials.');
        }
        console.log(`Simple backend running at http://localhost:${PORT}`);
    });
}

startServer();
