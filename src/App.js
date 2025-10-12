// src/App.js
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
} from "react-router-dom";
import LoginPage from "./LoginPage";
import OCRExtractor from "./OCRExtractor";
import Sidebar from "./Sidebar";
import Home from "./Home";
import Historial from "./Historial";

function AppContent({ isAuthenticated, setIsAuthenticated }) {
  const [redirected, setRedirected] = useState(false);
  const navigate = useNavigate();

  // Redirigir a /home solo una vez después del login
  React.useEffect(() => {
    if (isAuthenticated && !redirected) {
      navigate("/home");
      setRedirected(true);
    }
  }, [isAuthenticated, redirected, navigate]);

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route
          path="*"
          element={<LoginPage onLogin={() => setIsAuthenticated(true)} />}
        />
      </Routes>
    );
  }

  return (
    <div style={{ display: "flex" }}>
      <Sidebar onLogout={() => setIsAuthenticated(false)} />
      <main style={{ flexGrow: 1, padding: "20px" }}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/ocr" element={<OCRExtractor />} />
          <Route path="/perfil" element={<h1>Perfil del usuario</h1>} />
          <Route path="/historial" element={<Historial />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  return (
    <Router>
      <AppContent
        isAuthenticated={isAuthenticated}
        setIsAuthenticated={setIsAuthenticated}
      />
    </Router>
  );
}


