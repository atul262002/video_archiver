import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, Youtube, HardDrive, Play, Share2, Calendar, User, Tag } from 'lucide-react';
import type { Video } from '../types';

interface VideoPageProps {
    videos: Video[];
}

export const VideoPage: React.FC<VideoPageProps> = ({ videos }) => {
    const { id } = useParams<{ id: string }>();
    const video = videos.find(v => v.id === id);

    if (!video) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-bold mb-4">Video not found</h2>
                <Link to="/" className="text-primary hover:underline">Return to Home</Link>
            </div>
        );
    }

    const platforms = [
        { name: 'YouTube', icon: <Youtube />, url: video.platforms.youtube, type: 'embed' },
        { name: 'Download', icon: <HardDrive />, url: getDriveDownloadUrl(video.platforms.googleDrive), type: 'download' },
        { name: 'Odysee', icon: <Play />, url: video.platforms.odysee, type: 'link' },
        { name: 'Rumble', icon: <Share2 />, url: video.platforms.rumble, type: 'link' },
        { name: 'BitChute', icon: <Play className="rotate-90" />, url: video.platforms.bitChute, type: 'link' },
    ].filter(p => p.url);

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
            <div className="space-y-4">
                <nav className="text-sm text-gray-500 flex items-center gap-2">
                    <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                    <span>/</span>
                    <Link to={`/category/${encodeURIComponent(video.category)}`} className="hover:text-primary transition-colors">{video.category}</Link>
                    <span>/</span>
                    <span className="text-gray-300 truncate">{video.title}</span>
                </nav>
                <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">{video.title}</h1>
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-400 border-b border-gray-800 pb-4">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-primary" />
                        <span>{video.creator}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        <span>{video.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-primary" />
                        <span>{video.category}</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {video.platforms.youtube ? (
                        <div className="video-container shadow-2xl shadow-primary/10">
                            <iframe
                                src={getYouTubeId(video.platforms.youtube) ? `https://www.youtube.com/embed/${getYouTubeId(video.platforms.youtube)}` : video.platforms.youtube}
                                title={video.title}
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            ></iframe>
                        </div>
                    ) : (
                        <div className="aspect-video bg-gray-900 rounded-xl flex flex-col items-center justify-center border border-gray-800 p-8 text-center text-gray-400">
                            <Youtube className="w-16 h-16 mb-4 opacity-20" />
                            <p>No YouTube embed available for this video.</p>
                            <p className="text-sm">Please check the alternative platform links.</p>
                        </div>
                    )}

                    <div className="bg-gray-900/50 rounded-2xl p-6 border border-gray-800">
                        <h3 className="text-xl font-bold mb-4">Description</h3>
                        <p className="text-gray-400 leading-relaxed whitespace-pre-wrap">
                            {video.description}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {video.tags.map(tag => (
                            <span key={tag} className="bg-gray-800 text-gray-300 px-3 py-1 rounded-full text-sm border border-gray-700">
                                #{tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="bg-gray-900 rounded-2xl p-6 border border-gray-800 sticky top-24">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                            <ExternalLink className="w-5 h-5 text-primary" />
                            Watch on Platforms
                        </h3>
                        <div className="space-y-3">
                            {platforms.map(platform => (
                                <a
                                    key={platform.name}
                                    href={platform.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-4 bg-gray-800/50 hover:bg-primary/10 hover:border-primary/50 border border-gray-700 rounded-xl transition-all group"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-gray-400 group-hover:text-primary transition-colors">
                                            {platform.icon}
                                        </span>
                                        <span className="font-semibold text-gray-200">{platform.name}</span>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 transition-all" />
                                </a>
                            ))}
                            {platforms.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No alternative links available.</p>
                            )}
                        </div>

                        <div className="mt-8 pt-8 border-t border-gray-800">
                            <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">More from {video.category}</h4>
                            <div className="space-y-4">
                                {videos
                                    .filter(v => v.category === video.category && v.id !== video.id)
                                    .slice(0, 3)
                                    .map(related => (
                                        <Link key={related.id} to={`/video/${related.id}`} className="flex gap-3 group">
                                            <div className="w-24 h-14 bg-gray-800 rounded overflow-hidden flex-shrink-0">
                                                <img
                                                    src={related.thumbnailUrl || `https://img.youtube.com/vi/${getYouTubeId(related.platforms.youtube)}/default.jpg`}
                                                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all"
                                                    alt=""
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-300 line-clamp-2 group-hover:text-primary transition-colors">{related.title}</p>
                                            </div>
                                        </Link>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

function getYouTubeId(url?: string) {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : '';
}

function getDriveDownloadUrl(url?: string) {
    if (!url) return '';
    // Extract file ID from Google Drive link
    const match = url.match(/\/file\/d\/([\w-]+)/);
    if (match) {
        return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
    return url;
}
