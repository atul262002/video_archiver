import React from 'react';
import { Archive, Info } from 'lucide-react';

export const About: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <Archive className="w-12 h-12 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display">About the Archive</h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Preserving Bitcoin Cash history and media for future generations.
        </p>
      </div>

      <div className="bg-dark-card border border-gray-800 rounded-2xl p-8 mb-12 shadow-xl">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
          <Info className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Our Mission</h2>
        </div>
        
        <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
          <p>
            The Bitcoin Cash Video Archive is dedicated to the permanent preservation of 
            important presentations, conferences, podcasts, and historical media related to Bitcoin Cash.
          </p>
          <p>
            As platforms change policies or content goes offline, valuable historical context 
            can be lost. This community-funded archive ensures that the ideas, debates, and 
            technological milestones of the BCH ecosystem remain accessible to researchers, 
            developers, and enthusiasts indefinitely.
          </p>
          <p>
            We prioritize speed, simplicity, and permanence—delivering a fast, minimalist 
            experience that gets out of the way and lets the content shine.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-dark-card border border-gray-800 rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-white">Run By The Podcast</h3>
            <p className="text-gray-400 leading-relaxed">
              This archive is proudly maintained and operated by <strong>The Podcast</strong> team. 
              We believe in uncensorable information and are committed to keeping this repository 
              online and freely available.
            </p>
        </div>

        <div className="bg-dark-card border border-gray-800 rounded-2xl p-8 shadow-xl">
            <h3 className="text-xl font-bold mb-4 text-white">Community Supported</h3>
            <p className="text-gray-400 leading-relaxed">
              This project is made possible through direct support from the Bitcoin Cash community. 
              If you find this archive valuable, consider supporting the servers and bandwidth costs 
              via the donation address in the footer.
            </p>
        </div>
      </div>
    </div>
  );
};
