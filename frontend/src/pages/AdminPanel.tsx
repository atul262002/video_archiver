import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Edit2, Save, X, Youtube, HardDrive, Play, Share2, LogOut, Shield, FolderPlus, Inbox, RefreshCw, EyeOff, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Video, PreservationSuggestion } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
const SUGGESTIONS_API_URL = `${API_BASE}/suggestions`;
const ADMIN_VIDEOS_API_URL = `${API_BASE}/admin/videos`;

interface AdminPanelProps {
    categories: string[];
    isAuthenticated: boolean;
    onLogin: (password: string) => Promise<void>;
    onLogout: () => Promise<void>;
    onSave: (video: Video) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onCreateCategory: (name: string) => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
    categories,
    isAuthenticated,
    onLogin,
    onLogout,
    onSave,
    onDelete,
    onCreateCategory,
}) => {
    const [editingVideo, setEditingVideo] = useState<Video | null>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [adminVideos, setAdminVideos] = useState<Video[]>([]);
    const [adminVideosTotal, setAdminVideosTotal] = useState(0);
    const [adminVideoPage, setAdminVideoPage] = useState(1);
    const [adminVideoPageSize, setAdminVideoPageSize] = useState(15);
    const [adminVideosError, setAdminVideosError] = useState('');

    const [crowdSuggestions, setCrowdSuggestions] = useState<PreservationSuggestion[]>([]);
    const [suggestionsTotal, setSuggestionsTotal] = useState(0);
    const [suggestionPage, setSuggestionPage] = useState(1);
    const [suggestionPageSize, setSuggestionPageSize] = useState(15);
    const [includeArchivedSuggestions, setIncludeArchivedSuggestions] = useState(false);
    const [suggestionsLoading, setSuggestionsLoading] = useState(false);
    const [suggestionsError, setSuggestionsError] = useState('');

    const loadAdminVideos = useCallback(async () => {
        setAdminVideosError('');
        try {
            const params = new URLSearchParams({
                page: String(adminVideoPage),
                pageSize: String(adminVideoPageSize),
            });
            const response = await fetch(`${ADMIN_VIDEOS_API_URL}?${params}`, { credentials: 'include' });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                if (response.status === 401) {
                    await onLogout();
                }
                throw new Error(data.error || 'Failed to load videos');
            }
            setAdminVideos(Array.isArray(data.items) ? data.items : []);
            setAdminVideosTotal(typeof data.total === 'number' ? data.total : 0);
        } catch (err) {
            setAdminVideos([]);
            setAdminVideosTotal(0);
            setAdminVideosError(err instanceof Error ? err.message : 'Failed to load videos');
        }
    }, [adminVideoPage, adminVideoPageSize, onLogout]);

    const loadCrowdSuggestions = useCallback(async () => {
        setSuggestionsLoading(true);
        setSuggestionsError('');
        try {
            const params = new URLSearchParams({
                page: String(suggestionPage),
                pageSize: String(suggestionPageSize),
                includeArchived: includeArchivedSuggestions ? 'true' : 'false',
            });
            const response = await fetch(`${SUGGESTIONS_API_URL}?${params}`, { credentials: 'include' });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Failed to load suggestions');
            }
            setCrowdSuggestions(Array.isArray(data.items) ? data.items : []);
            setSuggestionsTotal(typeof data.total === 'number' ? data.total : 0);
        } catch (err) {
            setSuggestionsError(err instanceof Error ? err.message : 'Failed to load suggestions');
            setCrowdSuggestions([]);
            setSuggestionsTotal(0);
        } finally {
            setSuggestionsLoading(false);
        }
    }, [suggestionPage, suggestionPageSize, includeArchivedSuggestions]);

    useEffect(() => {
        if (!isAuthenticated) return;
        void loadAdminVideos();
    }, [isAuthenticated, loadAdminVideos]);

    useEffect(() => {
        if (!isAuthenticated) return;
        void loadCrowdSuggestions();
    }, [isAuthenticated, loadCrowdSuggestions]);

    useEffect(() => {
        setSuggestionPage(1);
    }, [includeArchivedSuggestions]);

    useEffect(() => {
        setAdminVideoPage(1);
    }, [adminVideoPageSize]);

    useEffect(() => {
        setSuggestionPage(1);
    }, [suggestionPageSize]);

    useEffect(() => {
        const pages = Math.max(1, Math.ceil(adminVideosTotal / adminVideoPageSize) || 1);
        if (adminVideoPage > pages) setAdminVideoPage(pages);
    }, [adminVideosTotal, adminVideoPageSize, adminVideoPage]);

    useEffect(() => {
        const pages = Math.max(1, Math.ceil(suggestionsTotal / suggestionPageSize) || 1);
        if (suggestionPage > pages) setSuggestionPage(pages);
    }, [suggestionsTotal, suggestionPageSize, suggestionPage]);
    const platformFields: Array<{ label: string; key: keyof Video['platforms']; icon: React.ReactNode }> = [
        { label: 'YouTube Embed URL', key: 'youtube', icon: <Youtube className="w-5 h-5 text-red-500" /> },
        { label: 'Google Drive URL', key: 'googleDrive', icon: <HardDrive className="w-5 h-5 text-blue-500" /> },
        { label: 'Odysee URL', key: 'odysee', icon: <Play className="w-5 h-5 text-purple-500" /> },
        { label: 'Rumble URL', key: 'rumble', icon: <Share2 className="w-5 h-5 text-green-500" /> },
        { label: 'BitChute URL', key: 'bitChute', icon: <Play className="w-5 h-5 text-red-700 rotate-90" /> },
    ];

    const initialVideo: Video = {
        id: Date.now().toString(),
        title: '',
        creator: '',
        date: new Date().toISOString().split('T')[0],
        tags: [],
        description: '',
        category: categories[0] || '',
        platforms: {}
    };

    const handleEdit = (video: Video) => {
        setEditingVideo({ ...video });
        setIsAdding(false);
    };

    const handleAdd = () => {
        setEditingVideo(initialVideo);
        setIsAdding(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (editingVideo) {
            setError('');
            setIsSubmitting(true);
            try {
                await onSave(editingVideo);
                setEditingVideo(null);
                setIsAdding(false);
                void loadAdminVideos();
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to save video');
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await onLogin(password);
            setPassword('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete video?')) return;
        setError('');
        setIsSubmitting(true);
        try {
            await onDelete(id);
            void loadAdminVideos();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete video');
        } finally {
            setIsSubmitting(false);
        }
    };

    const [suggestionBusyId, setSuggestionBusyId] = useState<string | null>(null);

    const patchSuggestionArchived = async (id: string, archived: boolean) => {
        setSuggestionBusyId(id);
        setSuggestionsError('');
        try {
            const response = await fetch(`${SUGGESTIONS_API_URL}/${id}`, {
                method: 'PATCH',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ archived }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                if (response.status === 401) {
                    await onLogout();
                }
                throw new Error(data.error || 'Failed to update suggestion');
            }
            await loadCrowdSuggestions();
        } catch (err) {
            setSuggestionsError(err instanceof Error ? err.message : 'Failed to update suggestion');
        } finally {
            setSuggestionBusyId(null);
        }
    };

    const deleteSuggestion = async (id: string) => {
        if (!confirm('Permanently delete this suggestion?')) return;
        setSuggestionBusyId(id);
        setSuggestionsError('');
        try {
            const response = await fetch(`${SUGGESTIONS_API_URL}/${id}`, {
                method: 'DELETE',
                credentials: 'include',
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                if (response.status === 401) {
                    await onLogout();
                }
                throw new Error(data.error || 'Failed to delete suggestion');
            }
            await loadCrowdSuggestions();
        } catch (err) {
            setSuggestionsError(err instanceof Error ? err.message : 'Failed to delete suggestion');
        } finally {
            setSuggestionBusyId(null);
        }
    };

    const handleCreateCategorySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            await onCreateCategory(newCategoryName);
            setNewCategoryName('');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create category');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 bg-gray-900 rounded-2xl border border-gray-800 shadow-2xl animate-fade-in">
                <h2 className="text-2xl font-bold mb-6 text-white text-center">Admin Access</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <input 
                            type="password"
                            placeholder="Enter admin password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full bg-dark border border-gray-700 rounded-lg p-3 focus:border-primary outline-none text-white"
                            autoFocus
                        />
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <button type="submit" disabled={isSubmitting} className="w-full bg-primary hover:bg-primary-dark text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-60">
                        {isSubmitting ? 'Checking...' : 'Login'}
                    </button>
                </form>
            </div>
        );
    }

    if (editingVideo) {
        return (
            <div className="max-w-4xl mx-auto animate-fade-in bg-gray-900 rounded-2xl p-8 border border-gray-800 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        {isAdding ? <Plus className="text-primary" /> : <Edit2 className="text-primary" />}
                        {isAdding ? 'Archive New Video' : 'Edit Video Details'}
                    </h2>
                    <button onClick={() => setEditingVideo(null)} className="text-gray-500 hover:text-white">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSave} className="space-y-6">
                    {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-400">Title</label>
                            <input
                                required
                                value={editingVideo.title}
                                onChange={e => setEditingVideo({ ...editingVideo, title: e.target.value })}
                                className="w-full bg-dark border border-gray-700 rounded-lg p-3 focus:border-primary outline-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-400">Creator</label>
                            <input
                                required
                                value={editingVideo.creator}
                                onChange={e => setEditingVideo({ ...editingVideo, creator: e.target.value })}
                                className="w-full bg-dark border border-gray-700 rounded-lg p-3 focus:border-primary outline-none"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-400">Category</label>
                            <select
                                required
                                value={editingVideo.category}
                                onChange={e => setEditingVideo({ ...editingVideo, category: e.target.value })}
                                className="w-full bg-dark border border-gray-700 rounded-lg p-3 focus:border-primary outline-none"
                            >
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-400">Date</label>
                            <input
                                type="date"
                                value={editingVideo.date}
                                onChange={e => setEditingVideo({ ...editingVideo, date: e.target.value })}
                                className="w-full bg-dark border border-gray-700 rounded-lg p-3 focus:border-primary outline-none"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-400">Description</label>
                        <textarea
                            rows={4}
                            value={editingVideo.description}
                            onChange={e => setEditingVideo({ ...editingVideo, description: e.target.value })}
                            className="w-full bg-dark border border-gray-700 rounded-lg p-3 focus:border-primary outline-none"
                        />
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-lg font-bold border-b border-gray-800 pb-2 flex items-center gap-2">
                            <Save className="w-5 h-5 text-primary" />
                            Platform Links
                        </h3>
                        <div className="grid grid-cols-1 gap-4">
                            {platformFields.map(p => (
                                <div key={p.key} className="flex items-center gap-4 bg-dark/50 p-4 rounded-xl border border-gray-800">
                                    <div className="w-10 h-10 flex items-center justify-center bg-gray-800 rounded-lg">
                                        {p.icon}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <label className="text-[10px] uppercase tracking-tighter text-gray-500 font-bold">{p.label}</label>
                                        <input
                                            placeholder={`Paste ${p.label.split(' ')[0]} URL...`}
                                            value={editingVideo.platforms[p.key] || ''}
                                            onChange={e => setEditingVideo({
                                                ...editingVideo,
                                                platforms: { ...editingVideo.platforms, [p.key]: e.target.value }
                                            })}
                                            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-mono text-primary"
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4">
                        <button type="submit" disabled={isSubmitting || categories.length === 0} className="flex-1 bg-primary hover:bg-primary-dark text-black font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-60">
                            <Save className="w-5 h-5" />
                            {isSubmitting ? 'Saving...' : isAdding ? 'Add Video to Archive' : 'Update Video'}
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditingVideo(null)}
                            className="px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between border-b border-gray-800 pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Shield className="w-8 h-8 text-primary" />
                        Admin Panel
                    </h1>
                    <p className="text-gray-500">Only authenticated admins can add, edit, delete videos, or create categories.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={handleAdd}
                        disabled={categories.length === 0}
                        className="bg-primary hover:bg-primary-dark text-black px-6 py-2 rounded-full font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-60"
                    >
                        <Plus className="w-5 h-5" />
                        Add Video
                    </button>
                    <button
                        onClick={() => void onLogout()}
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-full border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-colors flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Logout
                    </button>
                </div>
            </div>

            {error && <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p>}

            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FolderPlus className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold text-white">Create Category</h2>
                    </div>
                    <form onSubmit={handleCreateCategorySubmit} className="flex flex-col sm:flex-row gap-3">
                        <input
                            value={newCategoryName}
                            onChange={e => setNewCategoryName(e.target.value)}
                            placeholder="New category name"
                            className="flex-1 bg-dark border border-gray-700 rounded-lg p-3 focus:border-primary outline-none text-white"
                        />
                        <button type="submit" disabled={isSubmitting || !newCategoryName.trim()} className="bg-primary hover:bg-primary-dark text-black font-bold px-5 py-3 rounded-lg transition-colors disabled:opacity-60">
                            Add Category
                        </button>
                    </form>
                </div>

                <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                    <h2 className="text-xl font-bold text-white mb-4">Available Categories</h2>
                    {categories.length === 0 && (
                        <p className="text-sm text-gray-400 mb-4">Create your first category before adding videos.</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                        {categories.map(category => (
                            <span key={category} className="rounded-full bg-gray-800 px-3 py-1 text-sm text-gray-300">
                                {category}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <Inbox className="w-5 h-5 text-primary" />
                        <h2 className="text-xl font-bold text-white">Crowdsourced suggestions</h2>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={includeArchivedSuggestions}
                                onChange={e => setIncludeArchivedSuggestions(e.target.checked)}
                                className="rounded border-gray-600 bg-dark text-primary focus:ring-primary"
                            />
                            Show hidden
                        </label>
                        <label className="text-sm text-gray-500 flex items-center gap-2">
                            Per page
                            <select
                                value={suggestionPageSize}
                                onChange={e => setSuggestionPageSize(Number(e.target.value))}
                                className="bg-dark border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm"
                            >
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </label>
                        <button
                            type="button"
                            onClick={() => void loadCrowdSuggestions()}
                            disabled={suggestionsLoading}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-gray-300 hover:text-white hover:border-gray-500 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw className={`w-4 h-4 ${suggestionsLoading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                    Newest first. Use <strong className="text-gray-400">Hide from inbox</strong> to clear items from this list (toggle &quot;Show hidden&quot; to see them again). Delete removes permanently.
                </p>
                {suggestionsError && (
                    <p className="text-sm text-amber-400/90 mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                        {suggestionsError}
                    </p>
                )}
                {suggestionsLoading && crowdSuggestions.length === 0 && !suggestionsError ? (
                    <p className="text-gray-500 text-sm">Loading…</p>
                ) : crowdSuggestions.length === 0 ? (
                    <p className="text-gray-500 text-sm">No suggestions on this page.</p>
                ) : (
                    <ul className="space-y-3">
                        {crowdSuggestions.map(s => {
                            const busy = suggestionBusyId === s.id;
                            const isArchived = Boolean(s.archived);
                            return (
                                <li
                                    key={s.id}
                                    className="rounded-xl border border-gray-800 bg-dark/50 p-4 text-sm"
                                >
                                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-2">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <span className="text-[10px] uppercase tracking-wider font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                                {suggestionKindLabel(s.kind)}
                                            </span>
                                            <span className="text-xs text-gray-600">
                                                {new Date(s.createdAt).toLocaleString()}
                                            </span>
                                            {isArchived ? (
                                                <span className="text-[10px] uppercase tracking-wider text-gray-500 bg-gray-800 px-2 py-0.5 rounded">Hidden</span>
                                            ) : (
                                                <span className="text-[10px] uppercase tracking-wider text-emerald-600/90 bg-emerald-500/10 px-2 py-0.5 rounded">In inbox</span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap gap-2 shrink-0">
                                            {!isArchived ? (
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => void patchSuggestionArchived(s.id, true)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium disabled:opacity-50"
                                                >
                                                    <EyeOff className="w-3.5 h-3.5" />
                                                    Hide from inbox
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    disabled={busy}
                                                    onClick={() => void patchSuggestionArchived(s.id, false)}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium disabled:opacity-50"
                                                >
                                                    <RotateCcw className="w-3.5 h-3.5" />
                                                    Restore to inbox
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                disabled={busy}
                                                onClick={() => void deleteSuggestion(s.id)}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium disabled:opacity-50"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Link / details</p>
                                        <p className="text-gray-200 whitespace-pre-wrap break-words font-mono text-xs leading-relaxed">
                                            {s.reference}
                                        </p>
                                    </div>
                                    {s.note ? (
                                        <div className="mt-3 pt-3 border-t border-gray-800 space-y-1">
                                            <p className="text-[10px] uppercase tracking-wider text-primary font-bold">Visitor message</p>
                                            <p className="text-gray-300 whitespace-pre-wrap break-words text-sm leading-relaxed">{s.note}</p>
                                        </div>
                                    ) : null}
                                </li>
                            );
                        })}
                    </ul>
                )}
                <PaginationBar
                    page={suggestionPage}
                    pageSize={suggestionPageSize}
                    total={suggestionsTotal}
                    onPageChange={setSuggestionPage}
                    disabled={suggestionsLoading}
                />
            </div>

            <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                    <h2 className="text-xl font-bold text-white">Videos in archive</h2>
                    <label className="text-sm text-gray-500 flex items-center gap-2">
                        Per page
                        <select
                            value={adminVideoPageSize}
                            onChange={e => setAdminVideoPageSize(Number(e.target.value))}
                            className="bg-dark border border-gray-700 rounded-lg px-2 py-1.5 text-white text-sm"
                        >
                            <option value={10}>10</option>
                            <option value={15}>15</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                        </select>
                    </label>
                </div>
                <p className="text-sm text-gray-500 mb-4">Sorted with most recently added or updated first.</p>
                {adminVideosError ? (
                    <p className="text-sm text-amber-400/90 mb-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
                        {adminVideosError}
                    </p>
                ) : null}
                <div className="grid grid-cols-1 gap-4">
                    {adminVideos.map(video => (
                        <div key={video.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-4 group hover:border-gray-700 transition-colors">
                            <div className="w-full sm:w-24 aspect-video bg-black rounded overflow-hidden flex-shrink-0 border border-gray-800 mx-auto sm:mx-0 max-w-[200px] sm:max-w-none">
                                <img src={video.thumbnailUrl || `https://img.youtube.com/vi/${getYouTubeId(video.platforms.youtube)}/mqdefault.jpg`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                            </div>
                            <div className="flex-1 min-w-0 text-center sm:text-left">
                                <h3 className="font-bold text-white truncate">{video.title}</h3>
                                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">{video.category}</p>
                                {(video.updatedAt || video.createdAt) && (
                                    <p className="text-[11px] text-gray-600 mt-1">
                                        {video.updatedAt && <span>Updated {new Date(video.updatedAt).toLocaleString()}</span>}
                                        {video.updatedAt && video.createdAt ? ' · ' : null}
                                        {video.createdAt && <span>Added {new Date(video.createdAt).toLocaleString()}</span>}
                                    </p>
                                )}
                            </div>
                            <div className="flex items-center justify-center sm:justify-end gap-2 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => handleEdit(video)}
                                    className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-primary transition-colors"
                                    title="Edit"
                                >
                                    <Edit2 className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => void handleDelete(video.id)}
                                    className="p-2 bg-gray-800 hover:bg-red-500/20 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {adminVideos.length === 0 && adminVideosTotal === 0 ? (
                    <p className="text-gray-500 text-sm mt-4">No videos yet. Add a category, then add a video.</p>
                ) : null}
                <PaginationBar
                    page={adminVideoPage}
                    pageSize={adminVideoPageSize}
                    total={adminVideosTotal}
                    onPageChange={setAdminVideoPage}
                    disabled={false}
                />
            </div>
        </div>
    );
};

function getYouTubeId(url?: string) {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : '';
}

interface PaginationBarProps {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (nextPage: number) => void;
    disabled?: boolean;
}

function PaginationBar({ page, pageSize, total, onPageChange, disabled }: PaginationBarProps) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);
    const clampedPage = Math.min(Math.max(1, page), totalPages);
    const from = total === 0 ? 0 : (clampedPage - 1) * pageSize + 1;
    const to = total === 0 ? 0 : Math.min(clampedPage * pageSize, total);

    return (
        <div className="mt-4 pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-gray-500">
            <span>
                {total === 0 ? '0 items' : `Showing ${from}–${to} of ${total}`}
            </span>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    disabled={disabled || clampedPage <= 1}
                    onClick={() => onPageChange(clampedPage - 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none"
                >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                </button>
                <span className="text-gray-400 tabular-nums px-2">
                    Page {clampedPage} / {totalPages}
                </span>
                <button
                    type="button"
                    disabled={disabled || clampedPage >= totalPages}
                    onClick={() => onPageChange(clampedPage + 1)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-700 text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none"
                >
                    Next
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

function suggestionKindLabel(kind: PreservationSuggestion['kind']): string {
    switch (kind) {
        case 'video':
            return 'Video';
        case 'channel':
            return 'Channel';
        case 'social':
            return 'Social post';
        case 'blog':
            return 'Blog / article';
        default:
            return kind;
    }
}
