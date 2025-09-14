import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Profile from './pages/Profile';
import MangaList from './pages/MangaList';
import MangaDetail from './pages/MangaDetail';
import ChapterReader from './pages/ChapterReader';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 flex flex-col">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/manga" element={<MangaList />} />
              <Route path="/manga/:id" element={<MangaDetail />} />
              <Route path="/manga/:mangaId/chapter/:chapterId" element={<ChapterReader />} />
              <Route path="/latest" element={<MangaList filter="latest" />} />
              <Route path="/popular" element={<MangaList filter="popular" />} />
              
              {/* Protected Routes */}
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />
              <Route path="/favorites" element={
                <ProtectedRoute>
                  <MangaList filter="favorites" />
                </ProtectedRoute>
              } />
              <Route path="/admin/*" element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

