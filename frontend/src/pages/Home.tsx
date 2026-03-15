import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { VideoCard } from '../components/VideoCard';
import type { Video } from '../types';

interface HomeProps {
    videos: Video[];
    categories: string[];
}

export const Home: React.FC<HomeProps> = ({ videos, categories }) => {
    return (
        <div className="space-y-12 animate-fade-in">
            <section className="bg-gradient-to-r from-gray-900 to-black rounded-3xl p-8 md:p-12 mb-12 border border-gray-800">
                <div className="max-w-2xl">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 text-white leading-tight">
                        Preserving the History of <span className="text-primary text-glow">Bitcoin Cash</span>
                    </h2>
                    <p className="text-gray-400 text-lg mb-8 leading-relaxed">
                        A fast, simple archive of important BCH related videos. Built for speed, readability, and permanence.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        {categories.map(category => (
                            <Link
                                key={category}
                                to={`/category/${encodeURIComponent(category)}`}
                                className="bg-gray-800 hover:bg-gray-700 text-light px-4 py-2 rounded-full text-sm font-medium transition-colors"
                            >
                                {category}
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {categories.map(category => {
                const categoryVideos = videos.filter(v => v.category === category);
                if (categoryVideos.length === 0) return null;
                return (
                    <div key={category} className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold text-white">{category}</h3>
                                <p className="text-gray-500 text-sm">Archived collection of {category.toLowerCase()}</p>
                            </div>
                            <Link
                                to={`/category/${encodeURIComponent(category)}`}
                                className="flex items-center text-primary hover:text-primary-dark transition-colors font-semibold group"
                            >
                                View All
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>

                        <div className="category-row pb-4 -mx-4 px-4">
                            {categoryVideos.map(video => (
                                <div key={video.id} className="w-72 flex-shrink-0">
                                    <VideoCard video={video} />
                                </div>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
