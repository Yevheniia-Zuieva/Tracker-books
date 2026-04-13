/**
 * @file Головний компонент додатку.
 * Відповідає за ініціалізацію, маршрутизацію (React Router), глобальний стан авторизації 
 * та відображення основного макета (Layout) з навігацією.
 */
import { useState, useEffect, lazy, Suspense } from "react";
import { apiAuth } from "./api/ApiService";
import { Loader2 } from "lucide-react";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

const AuthPage = lazy(() => import('./components/AuthPage'));
const HomePage = lazy(() => import('./components/HomePage'));
const SearchPage = lazy(() => import('./components/SearchPage'));
const AboutPage = lazy(() => import('./components/AboutPage'));
const HelpPage = lazy(() => import('./components/HelpPage'));
const RequestResetPage = lazy(() => import('./components/RequestResetPage')); 
const ResetPasswordConfirmPage = lazy(() => import('./components/ResetPasswordConfirmPage')); 
const NotFound = lazy(() => import('./components/NotFound')); 
const ServerError = lazy(() => import('./components/ServerError'));

const MainAppLayout = ({ user, currentView, setCurrentView, handleLogout, onBookClick }) => (
  <div className="min-h-screen bg-background text-foreground flex flex-col">
    <Header 
      user={user} 
      currentView={currentView} 
      onViewChange={setCurrentView} 
      onLogout={handleLogout} 
    />
    <main className="flex-1">
      {currentView === "home" ? (
        <HomePage onBookClick={onBookClick} />
      ) : currentView === "search" ? (
        <SearchPage />
      ) : currentView === "about" ? (
        <AboutPage /> 
      ) : currentView === "help" ? (
        <HelpPage /> 
      ) : (
        <HomePage onBookClick={onBookClick} /> 
      )}
    </main>
    <Footer onViewChange={setCurrentView}/>
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState("home");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      try {
        const profile = await apiAuth.getProfile();
        setUser(profile);
      } catch (error) {
        console.error("Сесія недійснa:", error);
        localStorage.removeItem("access_token");
      }
    }
    setIsLoading(false);
  };

  const handleAuthSuccess = (userData, token) => {
    localStorage.setItem("access_token", token);
    setUser(userData);
  };

  const handleLogout = () => {
    apiAuth.logout();
    setUser(null);
  };

  const handleBookClick = (book) => {
    console.log("Клік по книзі:", book.title);
  };

  if (isLoading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Router>
      <Suspense fallback={
        <div className="flex items-center justify-center h-screen">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      }>
        <Routes>
          <Route path="/forgot-password" element={<RequestResetPage />} />
          <Route path="/password-reset/:uid/:token" element={<ResetPasswordConfirmPage />} />
          <Route path="/server-error" element={<ServerError />} />
          <Route
            path="/"
            element={
              user ? (
                <MainAppLayout 
                  user={user}
                  currentView={currentView}
                  setCurrentView={setCurrentView}
                  handleLogout={handleLogout}
                  onBookClick={handleBookClick}
                />
              ) : (
                <AuthPage onAuth={handleAuthSuccess} />
              )
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;