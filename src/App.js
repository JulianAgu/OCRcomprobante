// npm install tesseract.js pdfjs-dist 
// npm start 


import React from "react";
import OCRExtractor from "./OCRExtractor";

function App() {
  return (
    <div style={{ padding: 20 }}>
      <h2>App de OCR para comprobantes</h2>
      <OCRExtractor />
    </div>
  );
}

export default App;


