import React from 'react';
import { Link } from 'react-router-dom';
import { Search, Archive, Wallet, Menu, Lightbulb } from 'lucide-react';
import { useOpenSuggestPreservation } from '../context/SuggestPreservationContext';

interface LayoutProps {
    children: React.ReactNode;
    onSearch?: (query: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onSearch }) => {
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const openSuggest = useOpenSuggestPreservation();

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (onSearch) onSearch(e.target.value);
    };

    return (
        <div className="min-h-screen flex flex-col bg-dark text-light font-sans">
            <header className="sticky top-0 z-50 bg-dark-header border-b border-gray-800 backdrop-blur-md">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <Link to="/" className="flex items-center space-x-2 text-primary font-bold text-xl tracking-tight">
                        <Archive className="w-8 h-8" />
                        <span>BCache</span>
                    </Link>

                    <div className="hidden md:flex flex-1 max-w-md mx-8">
                        <div className="relative w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search archival videos..."
                                onChange={handleSearchChange}
                                className="w-full bg-dark-search border border-gray-700 rounded-full py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                            />
                        </div>
                    </div>

                    <nav className="hidden md:flex items-center space-x-6">
                        <Link to="/about" className="text-gray-300 hover:text-white transition-colors">About</Link>
                        <Link to="/categories" className="text-gray-300 hover:text-white transition-colors">Categories</Link>
                        <Link to="/downloads" className="text-gray-300 hover:text-white transition-colors">Downloads</Link>
                        <button
                            type="button"
                            onClick={() => openSuggest()}
                            className="flex items-center gap-1.5 text-gray-300 hover:text-primary transition-colors cursor-pointer"
                        >
                            <Lightbulb className="w-4 h-4" />
                            <span>Suggest</span>
                        </button>
                        <a href="#donate" className="flex items-center space-x-1 bg-primary hover:bg-primary-dark text-black px-4 py-2 rounded-full font-semibold transition-colors">
                            <Wallet className="w-4 h-4" />
                            <span>Donate</span>
                        </a>
                    </nav>

                    <button className="md:hidden text-gray-300" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                        <Menu className="w-6 h-6" />
                    </button>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden bg-dark-header border-b border-gray-800 p-4 space-y-4">
                        <input
                            type="text"
                            placeholder="Search..."
                            onChange={handleSearchChange}
                            className="w-full bg-dark-search border border-gray-700 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                        <div className="flex flex-col space-y-3">
                            <Link to="/about" className="text-gray-300 hover:text-white" onClick={() => setIsMenuOpen(false)}>About</Link>
                            <Link to="/categories" className="text-gray-300 hover:text-white" onClick={() => setIsMenuOpen(false)}>Categories</Link>
                            <Link to="/downloads" className="text-gray-300 hover:text-white" onClick={() => setIsMenuOpen(false)}>Downloads</Link>
                            <button
                                type="button"
                                className="text-left text-primary font-medium flex items-center gap-2 cursor-pointer"
                                onClick={() => {
                                    setIsMenuOpen(false);
                                    openSuggest();
                                }}
                            >
                                <Lightbulb className="w-4 h-4" />
                                Suggest for preservation
                            </button>
                            <a href="#donate" className="text-primary font-bold" onClick={() => setIsMenuOpen(false)}>Donate BCH</a>
                        </div>
                    </div>
                )}
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
                {children}
            </main>

            <footer id="donate" className="bg-dark-footer border-t border-gray-800 py-12">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-start">
                        <div>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                                <Wallet className="text-primary" />
                                Support the Archive
                            </h2>
                            <p className="text-gray-400 mb-6 leading-relaxed">
                                BCache is a community-funded archival project. Your donations help us maintain the servers and continue preserving important Bitcoin Cash history.
                            </p>
                            <div className="bg-gray-900 p-4 rounded-lg border border-gray-800">
                                <p className="text-xs text-gray-500 uppercase tracking-widest mb-2 font-bold">BCH Address</p>
                                <div className="flex flex-col sm:flex-row gap-2 items-center">
                                    <code className="bg-black p-3 rounded flex-1 text-sm break-all font-mono text-primary border border-gray-800">
                                        bitcoincash:zqvt9f8g3mpm9ut5hq7yy8c5a7566n9nzs4tt29mh8
                                    </code>
                                    <button
                                        onClick={() => navigator.clipboard.writeText('bitcoincash:zqvt9f8g3mpm9ut5hq7yy8c5a7566n9nzs4tt29mh8')}
                                        className="w-full sm:w-auto bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded font-semibold transition-colors shrink-0"
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col items-center justify-start pt-1">
                            <div className="bg-white p-4 rounded-xl shadow-2xl shadow-primary/20">
                                {/* QR Code Placeholder - In a real app, use a QR generator library */}
                                <div className="w-40 h-40 bg-gray-200 flex items-center justify-center text-black text-center p-3">
                                    <div className="flex flex-col items-center">
                                        <img src="/qr-code.png" alt="BCH Donation QR Code" className="w-full h-full" />
                                    </div>
                                </div>
                            </div>
                            <p className="mt-4 text-gray-500 text-sm font-medium">Scan code to donate BCH</p>
                        </div>
                    </div>
                    <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row md:flex-wrap items-center justify-between gap-4 text-gray-500 text-sm">
                        <div>&copy; {new Date().getFullYear()} BCache - Preserving the History of Bitcoin Cash.</div>
                        <div className="flex flex-wrap items-center gap-4 md:gap-6">
                            <button
                                type="button"
                                onClick={() => openSuggest()}
                                className="text-primary hover:text-primary-dark font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                                <Lightbulb className="w-4 h-4" />
                                Suggest a video, channel, or link
                            </button>
                            <Link to="/admin" className="text-gray-700 hover:text-gray-500 transition-colors">Admin Login</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};
