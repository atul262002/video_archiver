import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronLeft, Grid } from 'lucide-react';
import { VideoCard } from '../components/VideoCard';
import type { Video } from '../types';

interface CategoryPageProps {
    videos: Video[];
    categories: string[];
}

export const CategoryPage: React.FC<CategoryPageProps> = ({ videos, categories }) => {
    const { categoryName } = useParams<{ categoryName: string }>();
    const decodedCategory = decodeURIComponent(categoryName || '');
    const categoryVideos = videos.filter(v => v.category === decodedCategory);
    const categoryExists = categories.includes(decodedCategory);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <Link to="/" className="text-primary flex items-center gap-1 hover:underline text-sm mb-2 group">
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        Back to Home
                    </Link>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                        <Grid className="w-8 h-8 text-primary" />
                        {decodedCategory}
                    </h1>
                    <p className="text-gray-500 mt-2">Discover archival footage and discussions in {decodedCategory}.</p>
                </div>
                <div className="bg-gray-900 px-4 py-2 rounded-lg border border-gray-800 text-sm">
                    <span className="text-gray-400 font-medium">{categoryVideos.length}</span>
                    <span className="text-gray-600 ml-1">videos archived</span>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {categoryVideos.map(video => (
                    <VideoCard key={video.id} video={video} />
                ))}
            </div>

            {categoryVideos.length === 0 && categoryExists && (
                <div className="text-center py-20 bg-gray-900 rounded-3xl border border-gray-800 border-dashed">
                    <p className="text-gray-500 mb-4 text-lg">No videos found in this category yet.</p>
                    <Link to="/" className="bg-primary text-black px-6 py-2 rounded-full font-bold">Explore All</Link>
                </div>
            )}

            {!categoryExists && (
                <div className="text-center py-20 bg-gray-900 rounded-3xl border border-gray-800 border-dashed">
                    <p className="text-gray-500 mb-4 text-lg">This category does not exist.</p>
                    <Link to="/categories" className="bg-primary text-black px-6 py-2 rounded-full font-bold">Browse Categories</Link>
                </div>
            )}
        </div>
    );
};
