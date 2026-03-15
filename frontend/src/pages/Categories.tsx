import React from 'react';
import { Link } from 'react-router-dom';
import { Grid, ChevronRight } from 'lucide-react';
import type { Video } from '../types';

interface CategoriesProps {
    videos: Video[];
    categories: string[];
}

export const Categories: React.FC<CategoriesProps> = ({ videos, categories }) => {
    return (
        <div className="space-y-8 animate-fade-in">
            <div className="border-b border-gray-800 pb-6">
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                    <Grid className="w-8 h-8 text-primary" />
                    Browse by Category
                </h1>
                <p className="text-gray-500 mt-2">Explore our curated collections of Bitcoin Cash history.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categories.map(category => {
                    const count = videos.filter(v => v.category === category).length;
                    return (
                        <Link
                            key={category}
                            to={`/category/${encodeURIComponent(category)}`}
                            className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-primary transition-all group"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{category}</h3>
                                    <p className="text-gray-500 text-sm mt-1">{count} videos archived</p>
                                </div>
                                <div className="bg-gray-800 p-2 rounded-full text-gray-400 group-hover:text-primary group-hover:bg-primary/10 transition-all">
                                    <ChevronRight className="w-6 h-6" />
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
};
