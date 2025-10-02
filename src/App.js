// npm install tesseract.js pdfjs-dist   
// npm install @mui/material @emotion/react @emotion/styled
// npm install @mui/icons-material
// (Todo se intsala con npm install pero para saber que tecnologias estamos usando)
// run > npm start 
// usuario: test      passwd: 1234


import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./LoginPage";
import OCRExtractor from "./OCRExtractor";
import Sidebar from "./Sidebar";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <Router>
      <div style={{ display: "flex" }}>
        <Sidebar onLogout={() => setIsAuthenticated(false)} />
        <main style={{ flexGrow: 1, padding: "20px" }}>
          <Routes>
            <Route path="/" element={<Navigate to="/ocr" />} />
            <Route path="/ocr" element={<OCRExtractor />} />
            <Route path="/perfil" element={<h1>Perfil del usuario</h1>} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}