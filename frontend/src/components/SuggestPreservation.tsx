import React, { useState, useEffect } from 'react';
import { X, Lightbulb, Loader2 } from 'lucide-react';
import type { PreservationSuggestionKind } from '../types';

const API_BASE = import.meta.env.VITE_API_BASE_URL as string;
const SUGGESTIONS_URL = `${API_BASE}/suggestions`;

const KIND_OPTIONS: { value: PreservationSuggestionKind; label: string; hint: string }[] = [
    { value: 'video', label: 'Video', hint: 'A specific video URL or title + platform' },
    { value: 'channel', label: 'Channel', hint: 'A channel worth archiving end-to-end' },
    { value: 'social', label: 'Social post', hint: 'Link to a post (X, Nostr, etc.)' },
    { value: 'blog', label: 'Blog / article', hint: 'Link to a write-up or news piece' },
];

interface SuggestPreservationProps {
    open: boolean;
    onClose: () => void;
}

export const SuggestPreservation: React.FC<SuggestPreservationProps> = ({ open, onClose }) => {
    const [kind, setKind] = useState<PreservationSuggestionKind>('video');
    const [reference, setReference] = useState('');
    const [note, setNote] = useState('');
    const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        document.addEventListener('keydown', onKey);
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKey);
            document.body.style.overflow = '';
        };
    }, [open, onClose]);

    useEffect(() => {
        if (open) {
            setStatus('idle');
            setMessage('');
        }
    }, [open]);

    if (!open) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        setMessage('');
        try {
            const response = await fetch(SUGGESTIONS_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ kind, reference: reference.trim(), note: note.trim() }),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data.error || 'Could not send suggestion');
            }
            setStatus('success');
            setMessage('Thank you — we will review your suggestion for the archive.');
            setReference('');
            setNote('');
        } catch (err) {
            setStatus('error');
            setMessage(err instanceof Error ? err.message : 'Something went wrong');
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="suggest-preservation-title"
            onClick={e => {
                if (e.target === e.currentTarget) onClose();
            }}
        >
            <div className="w-full max-w-lg bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl shadow-primary/10 overflow-hidden animate-fade-in">
                <div className="flex items-start justify-between gap-4 p-6 border-b border-gray-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                            <Lightbulb className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 id="suggest-preservation-title" className="text-xl font-bold text-white">
                                Suggest for preservation
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                Suggest a video, whole channel, social post, or blog article the archive should not miss.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={e => void handleSubmit(e)} className="p-6 space-y-5">
                    <div className="space-y-2">
                        <label htmlFor="suggest-kind" className="text-sm font-bold text-gray-400">
                            What are you suggesting?
                        </label>
                        <select
                            id="suggest-kind"
                            value={kind}
                            onChange={e => setKind(e.target.value as PreservationSuggestionKind)}
                            className="w-full bg-dark border border-gray-700 rounded-lg p-3 focus:border-primary outline-none text-white"
                        >
                            {KIND_OPTIONS.map(opt => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                        <p className="text-xs text-gray-600">{KIND_OPTIONS.find(o => o.value === kind)?.hint}</p>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="suggest-reference" className="text-sm font-bold text-gray-400">
                            Link or details <span className="text-red-400">*</span>
                        </label>
                        <textarea
                            id="suggest-reference"
                            required
                            rows={3}
                            value={reference}
                            onChange={e => setReference(e.target.value)}
                            placeholder="Paste a URL, or describe what to preserve and where to find it."
                            className="w-full bg-dark border border-gray-700 rounded-lg p-3 focus:border-primary outline-none text-white resize-y min-h-[88px]"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="suggest-note" className="text-sm font-bold text-gray-400">
                            Message to the team (optional)
                        </label>
                        <textarea
                            id="suggest-note"
                            rows={3}
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Tell us why this is important — admins read every message."
                            className="w-full bg-dark border border-gray-700 rounded-lg p-3 focus:border-primary outline-none text-white resize-y"
                        />
                    </div>

                    {message && (
                        <p
                            className={`text-sm rounded-lg px-4 py-3 ${
                                status === 'success'
                                    ? 'bg-primary/10 text-primary border border-primary/30'
                                    : 'bg-red-500/10 text-red-300 border border-red-500/30'
                            }`}
                        >
                            {message}
                        </p>
                    )}

                    <div className="flex gap-3 pt-1">
                        <button
                            type="submit"
                            disabled={status === 'submitting' || !reference.trim()}
                            className="flex-1 bg-primary hover:bg-primary-dark text-black font-bold py-3 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {status === 'submitting' ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Sending…
                                </>
                            ) : (
                                'Submit suggestion'
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-3 rounded-lg border border-gray-700 text-gray-300 hover:border-gray-500 hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
