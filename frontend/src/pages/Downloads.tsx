import React, { useState } from 'react';
import { Download, HardDrive, ListVideo, X, CheckSquare, Square, ExternalLink, ArrowLeft } from 'lucide-react';
import type { Video } from '../types';

interface DownloadsProps {
  videos: Video[];
  categories: string[];
}

interface Collection {
  title: string;
  videos: Video[];
  count: number;
}

type ModalView = 'select' | 'links';

interface ModalState {
  open: boolean;
  view: ModalView;
  collection: Collection | null;
  selected: Set<string>;
  linksVideos: Video[];
}

const INITIAL_MODAL: ModalState = {
  open: false,
  view: 'select',
  collection: null,
  selected: new Set(),
  linksVideos: [],
};

export const Downloads: React.FC<DownloadsProps> = ({ videos, categories }) => {
  const [modal, setModal] = useState<ModalState>(INITIAL_MODAL);

  // Group videos by category
  const collections: Collection[] = categories.map(category => {
    const categoryVideos = videos.filter(v => v.category === category);
    return { title: category, videos: categoryVideos, count: categoryVideos.length };
  }).filter(c => c.count > 0);

  if (videos.length > 0 && collections.length === 0) {
    collections.push({ title: 'All Videos', videos, count: videos.length });
  }

  const openModal = (collection: Collection) => {
    setModal({
      open: true,
      view: 'select',
      collection,
      selected: new Set(collection.videos.map(v => v.id)),
      linksVideos: [],
    });
  };

  const closeModal = () => setModal(INITIAL_MODAL);

  const toggleVideo = (id: string) => {
    setModal(prev => {
      const next = new Set(prev.selected);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return { ...prev, selected: next };
    });
  };

  const toggleAll = () => {
    if (!modal.collection) return;
    const allIds = new Set(modal.collection.videos.map(v => v.id));
    const allSelected = modal.collection.videos.every(v => modal.selected.has(v.id));
    setModal(prev => ({ ...prev, selected: allSelected ? new Set<string>() : allIds }));
  };

  // Pick the best available link for a video
  const getPrimaryLink = (video: Video): string | null => {
    const p = video.platforms;
    return p.googleDrive ?? p.odysee ?? p.rumble ?? p.bitChute ?? p.youtube ?? null;
  };

  // Switch to the links panel view — user clicks each link themselves
  const showLinksPanel = (videosToShow: Video[]) => {
    const withLinks = videosToShow.filter(v => getPrimaryLink(v) !== null);
    setModal(prev => ({ ...prev, view: 'links', linksVideos: withLinks }));
  };

  const handleDownloadSelected = () => {
    if (!modal.collection) return;
    const selected = modal.collection.videos.filter(v => modal.selected.has(v.id));
    showLinksPanel(selected);
  };

  const handleDownloadAll = () => {
    if (!modal.collection) return;
    showLinksPanel(modal.collection.videos);
  };

  const selectedCount = modal.selected.size;
  const totalCount = modal.collection?.count ?? 0;
  const allSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <div className="flex items-center gap-4 mb-4 border-b border-gray-800 pb-6">
        <div className="bg-primary/20 p-3 rounded-xl">
          <HardDrive className="w-10 h-10 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold font-display">Bulk Downloads</h1>
          <p className="text-gray-400 mt-1">
            Browse and download entire collections for local archiving.
          </p>
        </div>
      </div>

      <div className="bg-indigo-900/20 border border-indigo-700/40 rounded-lg p-4 mb-8">
        <p className="text-indigo-200/80 text-sm flex gap-2 items-start">
          <ExternalLink className="w-5 h-5 shrink-0 mt-0.5" />
          <span>
            Click <strong>Select &amp; Download</strong> to browse a category, pick which videos you want, and open their download links directly.
          </span>
        </p>
      </div>

      {collections.length === 0 ? (
        <div className="text-center py-12 text-gray-500">No collections available yet.</div>
      ) : (
        <div className="space-y-6">
          {collections.map(collection => (
            <div
              key={collection.title}
              className="bg-dark-card border border-gray-800 rounded-2xl p-6 shadow-lg flex flex-col sm:flex-row gap-6 items-start sm:items-center hover:border-gray-700 transition-colors"
            >
              <div className="bg-dark/50 p-4 rounded-xl shrink-0">
                <ListVideo className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-grow">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
                  <h2 className="text-xl font-bold text-white">{collection.title}</h2>
                  <span className="bg-gray-800 text-gray-300 text-xs font-mono px-3 py-1 rounded-full whitespace-nowrap">
                    {collection.count} {collection.count === 1 ? 'Video' : 'Videos'}
                  </span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed mb-4">
                  Browse and choose which videos from <strong>{collection.title}</strong> to download.
                </p>
                <button
                  onClick={() => openModal(collection)}
                  className="inline-flex items-center gap-2 bg-gray-800 hover:bg-primary text-gray-200 hover:text-black px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Select &amp; Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal.open && modal.collection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />

          {/* Panel */}
          <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">

            {/* ── SELECT VIEW ── */}
            {modal.view === 'select' && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-800">
                  <div>
                    <h2 className="text-lg font-bold text-white">{modal.collection.title}</h2>
                    <p className="text-sm text-gray-400 mt-0.5">{selectedCount} of {totalCount} selected</p>
                  </div>
                  <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Toolbar */}
                <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-800 bg-gray-900/50">
                  <button
                    onClick={toggleAll}
                    className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
                  >
                    {allSelected
                      ? <CheckSquare className="w-5 h-5 text-primary" />
                      : <Square className="w-5 h-5" />}
                    {allSelected ? 'Deselect All' : 'Select All'}
                  </button>
                </div>

                {/* Video list */}
                <div className="overflow-y-auto flex-1 divide-y divide-gray-800">
                  {modal.collection.videos.map(video => {
                    const isSelected = modal.selected.has(video.id);
                    return (
                      <div
                        key={video.id}
                        onClick={() => toggleVideo(video.id)}
                        className={`flex items-center gap-4 px-5 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-primary/10 hover:bg-primary/15' : 'hover:bg-gray-800/60'}`}
                      >
                        <div className="shrink-0">
                          {isSelected
                            ? <CheckSquare className="w-5 h-5 text-primary" />
                            : <Square className="w-5 h-5 text-gray-600" />}
                        </div>
                        {video.thumbnailUrl && (
                          <img src={video.thumbnailUrl} alt={video.title} className="w-16 h-10 object-cover rounded shrink-0" />
                        )}
                        <div className="flex-grow min-w-0">
                          <p className="text-sm font-medium text-white truncate">{video.title}</p>
                          <p className="text-xs text-gray-500 truncate">{video.creator} · {video.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between gap-3 p-5 border-t border-gray-800">
                  <button
                    onClick={handleDownloadAll}
                    className="flex items-center gap-2 text-sm bg-gray-800 hover:bg-gray-700 text-gray-200 px-4 py-2 rounded-lg font-semibold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download All ({totalCount})
                  </button>
                  <button
                    onClick={handleDownloadSelected}
                    disabled={selectedCount === 0}
                    className="flex items-center gap-2 text-sm bg-primary hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed text-black px-5 py-2 rounded-lg font-semibold transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download Selected ({selectedCount})
                  </button>
                </div>
              </>
            )}

            {/* ── LINKS VIEW ── */}
            {modal.view === 'links' && (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-gray-800">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setModal(prev => ({ ...prev, view: 'select' }))}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div>
                      <h2 className="text-lg font-bold text-white">Open Download Links</h2>
                      <p className="text-sm text-gray-400 mt-0.5">{modal.linksVideos.length} links ready — click each to open</p>
                    </div>
                  </div>
                  <button onClick={closeModal} className="text-gray-500 hover:text-white transition-colors">
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Links list */}
                <div className="overflow-y-auto flex-1 divide-y divide-gray-800">
                  {modal.linksVideos.length === 0 ? (
                    <div className="text-center py-12 text-gray-500 text-sm">No download links available for the selected videos.</div>
                  ) : (
                    modal.linksVideos.map(video => {
                      const link = getPrimaryLink(video);
                      return (
                        <div key={video.id} className="flex items-center gap-4 px-5 py-3">
                          {video.thumbnailUrl && (
                            <img src={video.thumbnailUrl} alt={video.title} className="w-14 h-9 object-cover rounded shrink-0" />
                          )}
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-medium text-white truncate">{video.title}</p>
                            <p className="text-xs text-gray-500 truncate">{video.creator}</p>
                          </div>
                          <a
                            href={link!}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 inline-flex items-center gap-1.5 bg-primary hover:bg-primary-dark text-black text-xs font-bold px-3 py-2 rounded-lg transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Open
                          </a>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Footer: open all + tip */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-gray-800">
                  <p className="text-xs text-gray-600 order-2 sm:order-1">
                    Tip: Right-click any link → "Save link as…" to download directly.
                  </p>
                  <button
                    onClick={() => {
                      modal.linksVideos.forEach(video => {
                        const link = getPrimaryLink(video);
                        if (link) window.open(link, '_blank', 'noopener,noreferrer');
                      });
                    }}
                    className="order-1 sm:order-2 shrink-0 inline-flex items-center gap-2 bg-primary hover:bg-primary-dark text-black text-sm font-bold px-5 py-2 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open All ({modal.linksVideos.length})
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
