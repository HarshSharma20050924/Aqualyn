import React from 'react';
import { BrowserRouter, Routes, Route, Link, Outlet } from 'react-router-dom';
import LandingScreen from './pages/LandingScreen';
import PrivacyScreen from './pages/PrivacyScreen';
import SecurityScreen from './pages/SecurityScreen';
import ContributionScreen from './pages/ContributionScreen';
import Header from './components/Header';
import Footer from './components/Footer';
import { AppProvider } from './context/AppContext';

function Layout() {
  return (
    <div className="min-h-screen bg-surface font-body text-on-background overflow-y-auto overflow-x-hidden relative flex flex-col">
      <Header />
      <div className="flex-1">
        <Outlet />
      </div>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<LandingScreen onBack={() => { window.location.href = "https://aqualyn.vercel.app"; }} />} />
            <Route path="privacy" element={<PrivacyScreen />} />
            <Route path="security" element={<SecurityScreen />} />
            <Route path="contribution" element={<ContributionScreen />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
