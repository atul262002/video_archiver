import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { CategoryPage } from './pages/CategoryPage';
import { VideoPage } from './pages/VideoPage';
import { Categories } from './pages/Categories';
import { AdminPanel } from './pages/AdminPanel';
import type { Video } from './types';
import './styles/main.css';

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const VIDEOS_API_URL = `${VITE_API_BASE_URL}/videos`;
const CATEGORIES_API_URL = `${VITE_API_BASE_URL}/categories`;
const ADMIN_SESSION_API_URL = `${VITE_API_BASE_URL}/admin/session`;
const ADMIN_LOGIN_API_URL = `${VITE_API_BASE_URL}/admin/login`;
const ADMIN_LOGOUT_API_URL = `${VITE_API_BASE_URL}/admin/logout`;

function App() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);

  useEffect(() => {
    void fetchArchive();
  }, []);

  const fetchArchive = async () => {
    try {
      const [videosResponse, categoriesResponse, adminSessionResponse] = await Promise.all([
        fetch(VIDEOS_API_URL),
        fetch(CATEGORIES_API_URL),
        fetch(ADMIN_SESSION_API_URL, { credentials: 'include' }),
      ]);

      const videosData = await videosResponse.json();
      const categoriesData = await categoriesResponse.json();
      const adminSessionData = await adminSessionResponse.json();

      setVideos(videosData);
      setCategories(categoriesData);
      setIsAdminAuthenticated(Boolean(adminSessionData.authenticated));
    } catch (error) {
      console.error('Failed to fetch videos:', error);
      // Fallback to local data if server is not running (for demo purposes)
      // import('./data/videos.json').then(module => {
      //   const fallbackVideos = module.default as Video[];
      //   setVideos(fallbackVideos);
      //   setCategories(Array.from(new Set(fallbackVideos.map(video => video.category))).sort());
      //   setIsAdminAuthenticated(false);
      // });
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (password: string) => {
    const response = await fetch(ADMIN_LOGIN_API_URL, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }

    setIsAdminAuthenticated(true);
  };

  const handleAdminLogout = async () => {
    try {
      await fetch(ADMIN_LOGOUT_API_URL, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Failed to log out cleanly:', error);
    } finally {
      setIsAdminAuthenticated(false);
    }
  };

  const handleSaveVideo = async (video: Video) => {
    const response = await fetch(VIDEOS_API_URL, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(video),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        setIsAdminAuthenticated(false);
      }
      throw new Error(data.error || 'Failed to save video');
    }

    await fetchArchive();
  };

  const handleDeleteVideo = async (id: string) => {
    const response = await fetch(`${VIDEOS_API_URL}/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        setIsAdminAuthenticated(false);
      }
      throw new Error(data.error || 'Failed to delete video');
    }

    await fetchArchive();
  };

  const handleCreateCategory = async (name: string) => {
    const response = await fetch(CATEGORIES_API_URL, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (response.status === 401) {
        setIsAdminAuthenticated(false);
      }
      throw new Error(data.error || 'Failed to create category');
    }

    setCategories(data.categories || []);
  };

  const filteredVideos = useMemo(() => {
    return videos.filter(video =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      video.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [videos, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-dark flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <Router>
      <Layout onSearch={setSearchQuery}>
        <Routes>
          <Route path="/" element={<Home videos={filteredVideos} categories={categories} />} />
          <Route path="/categories" element={<Categories videos={videos} categories={categories} />} />
          <Route path="/category/:categoryName" element={<CategoryPage videos={videos} categories={categories} />} />
          <Route path="/video/:id" element={<VideoPage videos={videos} />} />
          <Route
            path="/admin"
            element={
              <AdminPanel
                videos={videos}
                categories={categories}
                isAuthenticated={isAdminAuthenticated}
                onLogin={handleAdminLogin}
                onLogout={handleAdminLogout}
                onSave={handleSaveVideo}
                onDelete={handleDeleteVideo}
                onCreateCategory={handleCreateCategory}
              />
            }
          />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
