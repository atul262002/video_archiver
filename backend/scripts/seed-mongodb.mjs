import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { MongoClient } from 'mongodb';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const backendDir = path.resolve(__dirname, '..');
const envFile = path.join(backendDir, '.env');
const videosFile = path.join(backendDir, 'data', 'videos.json');
const categoriesFile = path.join(backendDir, 'data', 'categories.json');

loadEnvFile();

async function main() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        throw new Error('MONGODB_URI is not set. Add it in backend/.env or your shell before running the seed script.');
    }

    const [videos, categoryNames] = await Promise.all([
        readJsonFile(videosFile),
        readJsonFile(categoriesFile),
    ]);

    if (!Array.isArray(videos)) {
        throw new Error('backend/data/videos.json must contain an array of videos.');
    }

    if (!Array.isArray(categoryNames)) {
        throw new Error('backend/data/categories.json must contain an array of category names.');
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();
        const videosCollection = db.collection('videos');
        const categoriesCollection = db.collection('categories');

        await videosCollection.createIndex({ id: 1 }, { unique: true });
        await videosCollection.createIndex({ updatedAt: -1 });
        await categoriesCollection.createIndex({ name: 1 }, { unique: true });

        const normalizedCategories = collectCategoryNames(categoryNames, videos);

        let insertedCategories = 0;
        for (const name of normalizedCategories) {
            const result = await categoriesCollection.updateOne(
                { name },
                { $setOnInsert: { name } },
                { upsert: true },
            );

            if (result.upsertedCount > 0) {
                insertedCategories += 1;
            }
        }

        let insertedVideos = 0;
        let updatedVideos = 0;

        for (const video of videos) {
            validateVideo(video);

            const existing = await videosCollection.findOne(
                { id: video.id },
                { projection: { createdAt: 1 } },
            );

            const now = new Date();
            const createdAt = existing?.createdAt instanceof Date ? existing.createdAt : now;
            const doc = {
                id: video.id,
                title: video.title,
                creator: video.creator,
                date: video.date,
                description: video.description,
                category: normalizeCategoryName(video.category),
                platforms: video.platforms,
                tags: Array.isArray(video.tags) ? video.tags : [],
                createdAt,
                updatedAt: now,
            };

            if (typeof video.thumbnailUrl === 'string' && video.thumbnailUrl.trim()) {
                doc.thumbnailUrl = video.thumbnailUrl.trim();
            }

            const result = await videosCollection.replaceOne(
                { id: video.id },
                doc,
                { upsert: true },
            );

            if (result.upsertedCount > 0) {
                insertedVideos += 1;
            } else if (result.modifiedCount > 0) {
                updatedVideos += 1;
            }
        }

        console.log(`Seed complete. Categories inserted: ${insertedCategories}, videos inserted: ${insertedVideos}, videos updated: ${updatedVideos}.`);
    } finally {
        await client.close();
    }
}

function loadEnvFile() {
    try {
        const content = fs.readFileSync(envFile, 'utf-8');
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
        // backend/.env is optional when env vars already exist in the shell.
    }
}

async function readJsonFile(filePath) {
    const content = await fsPromises.readFile(filePath, 'utf-8');
    return JSON.parse(content);
}

function collectCategoryNames(categoryNames, videos) {
    const categories = new Set();

    for (const name of categoryNames) {
        if (typeof name === 'string' && name.trim()) {
            categories.add(normalizeCategoryName(name));
        }
    }

    for (const video of videos) {
        if (typeof video?.category === 'string' && video.category.trim()) {
            categories.add(normalizeCategoryName(video.category));
        }
    }

    return [...categories];
}

function normalizeCategoryName(value) {
    return value.trim().replace(/\s+/g, ' ');
}

function validateVideo(video) {
    if (!video || typeof video !== 'object') {
        throw new Error('Each video must be an object.');
    }

    const requiredFields = ['id', 'title', 'creator', 'date', 'description', 'category', 'platforms'];
    for (const field of requiredFields) {
        if (!(field in video)) {
            throw new Error(`Video is missing required field: ${field}`);
        }
    }

    if (typeof video.id !== 'string' || !video.id.trim()) throw new Error('Video id must be a non-empty string.');
    if (typeof video.title !== 'string' || !video.title.trim()) throw new Error(`Video ${video.id} has an invalid title.`);
    if (typeof video.creator !== 'string' || !video.creator.trim()) throw new Error(`Video ${video.id} has an invalid creator.`);
    if (typeof video.date !== 'string' || !video.date.trim()) throw new Error(`Video ${video.id} has an invalid date.`);
    if (typeof video.description !== 'string') throw new Error(`Video ${video.id} has an invalid description.`);
    if (typeof video.category !== 'string' || !video.category.trim()) throw new Error(`Video ${video.id} has an invalid category.`);
    if (!video.platforms || typeof video.platforms !== 'object' || Array.isArray(video.platforms)) {
        throw new Error(`Video ${video.id} has invalid platforms.`);
    }
    if (video.tags !== undefined && (!Array.isArray(video.tags) || !video.tags.every(tag => typeof tag === 'string'))) {
        throw new Error(`Video ${video.id} has invalid tags.`);
    }
}

main().catch(err => {
    console.error('Failed to seed MongoDB:', err.message);
    process.exit(1);
});
