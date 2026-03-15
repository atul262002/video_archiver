import React from 'react';
import { Link } from 'react-router-dom';
import { Play } from 'lucide-react';
import type { Video } from '../types';

interface VideoCardProps {
    video: Video;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
    const thumbnail = video.thumbnailUrl || `https://img.youtube.com/vi/${getYouTubeId(video.platforms.youtube)}/mqdefault.jpg`;

    return (
        <Link
            to={`/video/${video.id}`}
            className="group block bg-gray-900 rounded-xl overflow-hidden border border-gray-800 hover:border-primary transition-all duration-300 transform hover:-translate-y-1"
        >
            <div className="relative aspect-video">
                <img
                    src={thumbnail}
                    alt={video.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-primary p-3 rounded-full text-black">
                        <Play className="fill-current w-6 h-6" />
                    </div>
                </div>
                <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-xs text-white font-medium">
                    {video.date}
                </div>
            </div>
            <div className="p-4">
                <h3 className="font-bold text-light line-clamp-2 group-hover:text-primary transition-colors mb-2">
                    {video.title}
                </h3>
                <p className="text-sm text-gray-500 mb-2">{video.creator}</p>
                <div className="flex flex-wrap gap-2">
                    {video.tags.slice(0, 2).map(tag => (
                        <span key={tag} className="text-[10px] uppercase tracking-wider bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">
                            {tag}
                        </span>
                    ))}
                </div>
            </div>
        </Link>
    );
};

function getYouTubeId(url?: string) {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    return match ? match[1] : '';
}
