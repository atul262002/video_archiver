import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Youtube, HardDrive, Play, Share2, LogOut, Shield, FolderPlus } from 'lucide-react';
import type { Video } from '../types';

interface AdminPanelProps {
    videos: Video[];
    categories: string[];
    isAuthenticated: boolean;
    onLogin: (password: string) => Promise<void>;
    onLogout: () => Promise<void>;
    onSave: (video: Video) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
    onCreateCategory: (name: string) => Promise<void>;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
    videos,
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
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete video');
        } finally {
            setIsSubmitting(false);
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
                    <p className="text-gray-500 text-xs text-center mt-4">The password is validated on the server now, so only real admin credentials can modify archive data.</p>
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

            <div className="grid grid-cols-1 gap-4">
                {videos.map(video => (
                    <div key={video.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-center gap-4 group hover:border-gray-700 transition-colors">
                        <div className="w-24 aspect-video bg-black rounded overflow-hidden flex-shrink-0 border border-gray-800">
                            <img src={video.thumbnailUrl || `https://img.youtube.com/vi/${getYouTubeId(video.platforms.youtube)}/mqdefault.jpg`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt="" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-white truncate">{video.title}</h3>
                            <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">{video.category}</p>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
        </div>
    );
};

function getYouTubeId(url?: string) {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : '';
}
