import React from "react";
import { Archive, Info, Lightbulb } from "lucide-react";
import { useOpenSuggestPreservation } from "../context/SuggestPreservationContext";

export const About: React.FC = () => {
  const openSuggest = useOpenSuggestPreservation();
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <div className="bg-primary/10 p-4 rounded-full">
            <Archive className="w-12 h-12 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4 font-display">
          About BCache
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Preserving Bitcoin Cash history and media.
        </p>
      </div>

      <div className="bg-dark-card border border-gray-800 rounded-2xl p-8 mb-12 shadow-xl">
        <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
          <Info className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Our Mission</h2>
        </div>
        <div className="space-y-6 text-gray-300 text-lg leading-relaxed">
          <p>
            BCache is dedicated to the permanent preservation of important
            presentations, conferences, podcasts, and historical media related
            to Bitcoin Cash.
          </p>
          <p>
            As platforms evolve, change policies, or remove content, valuable
            historical context can be lost. This archive ensures that the ideas,
            debates, and technological milestones of the BCH ecosystem remain
            accessible to researchers, developers, and enthusiasts for the long
            term.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-dark-card border border-gray-800 rounded-2xl p-8 shadow-xl">
          <h3 className="text-xl font-bold mb-4 text-white">
            Brought to you by The Bitcoin Cash Podcast
          </h3>
          <p className="text-gray-400 leading-relaxed" />
          <p>
            This archive is proudly maintained and operated by{" "}
            <strong>The Bitcoin Cash Podcast</strong> team. We believe in
            uncensorable information and are committed to keeping this
            repository online, accessible, and free for everyone.
          </p>
        </div>

        <div className="bg-dark-card border border-gray-800 rounded-2xl p-8 shadow-xl">
          <h3 className="text-xl font-bold mb-4 text-white">
            Community Support
          </h3>
          <p className="text-gray-400 leading-relaxed">
            Your support is important to keep this archive running. If you
            believe this work matters, please consider donating to help cover
            running costs. Donation address can be found in the footer.
          </p>
        </div>
      </div>

      <div className="mt-12 bg-dark-card border border-primary/25 rounded-2xl p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <h3 className="text-xl font-bold mb-2 text-white flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-primary" />
              Crowdsourced archive
            </h3>
            <p className="text-gray-400 leading-relaxed max-w-2xl">
              Know a video, channel, social post, or article that must be archived? Send a suggestion, our team will review and add it to the archive.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openSuggest()}
            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-full bg-primary hover:bg-primary-dark text-black font-bold px-6 py-3 transition-colors cursor-pointer"
          >
            <Lightbulb className="w-5 h-5" />
            Suggest for preservation
          </button>
        </div>
      </div>
    </div>
  );
};
