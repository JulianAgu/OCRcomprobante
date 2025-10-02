// src/OCRExtractor.js
import React, { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Paper,
} from "@mui/material";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function OCRExtractor() {
  const [text, setText] = useState("");
  const [results, setResults] = useState({
    nombre: [],
    cuit: [],
    cvu_cbu: [],
    numero_operacion: [],
  });
  const [progress, setProgress] = useState(0);
  const canvasRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setText("");
    setResults({ nombre: [], cuit: [], cvu_cbu: [], numero_operacion: [] });
    setProgress(0);

    const isPdf = file.type === "application/pdf";
    let imageBlob;

    if (isPdf) {
      // Renderizar PDF a canvas
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = canvasRef.current;
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext("2d");
      await page.render({ canvasContext: ctx, viewport }).promise;

      // convertir a blob
      imageBlob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    } else {
      imageBlob = file;
    }

    // Ejecutar OCR
    setProgress(5);
    Tesseract.recognize(imageBlob, "spa", {
      logger: (m) => {
        if (m.status === "recognizing text" && m.progress) {
          setProgress(Math.round(m.progress * 100));
        }
      },
    })
      .then(({ data: { text } }) => {
        setText(text);
        setResults(extractFields(text));
        setProgress(100);
      })
      .catch((err) => {
        console.error(err);
        setProgress(0);
      });
  };

  function extractFields(t) {
    if (!t) t = "";

    const norm = t.replace(/\u00A0/g, " ").replace(/\r/g, "\n");

    // CUIT/CUIL
    const cuitRegex = /\b((?:20|23|24|27|30|33|34)[-\s]?\d{7,8}[-\s]?\d)\b/gi;
    const cuitMatches = [];
    let m;
    while ((m = cuitRegex.exec(norm)) !== null) {
      cuitMatches.push(m[1].replace(/[\s-]/g, ""));
    }

    // CVU/CBU
    const cvuRegex = /\b(?:CVU|CBU)[:\s]*([0-9]{16,24})\b/gi;
    const anyLongDigits = /\b([0-9]{20,24})\b/g;
    const cvuMatches = [];
    while ((m = cvuRegex.exec(norm)) !== null) cvuMatches.push(m[1]);
    while ((m = anyLongDigits.exec(norm)) !== null)
      if (!cvuMatches.includes(m[1])) cvuMatches.push(m[1]);

    // Número de operación
    const opRegex = /Número de operación[^\d]*(\d{6,20})/i;
    const opAlt = /Operaci[oó]n[^\d]*(\d{6,20})/i;
    const opMatch = norm.match(opRegex) || norm.match(opAlt);
    const ops = opMatch ? [opMatch[1]] : [];

    // Nombres
    const names = [];
    const lines = norm
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    for (let i = 0; i < lines.length; i++) {
      const L = lines[i];
      if (/^(De|Para)\b/i.test(L) && i + 1 < lines.length) {
        const cand = lines[i + 1];
        if (!/\d/.test(cand) || cand.split(" ").length >= 2) names.push(cand);
      }
      if (
        /[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+/.test(L) &&
        /\s+[A-ZÁÉÍÓÚÑ]/.test(L) &&
        !/Comprobante|Mercado|Pago|Número|Código/i.test(L)
      ) {
        names.push(L);
      }
    }

    const uniq = (arr) =>
      Array.from(new Set(arr.map((s) => s.trim()))).filter(Boolean);

    return {
      nombre: uniq(names),
      cuit: uniq(cuitMatches),
      cvu_cbu: uniq(cvuMatches),
      numero_operacion: uniq(ops),
    };
  }

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        OCR Extractor
      </Typography>

      <Button variant="contained" component="label">
        Subir comprobante
        <input
          type="file"
          accept="image/*,application/pdf"
          hidden
          onChange={handleFile}
        />
      </Button>

      {progress > 0 && progress < 100 && (
        <Box sx={{ width: "100%", mt: 2 }}>
          <LinearProgress variant="determinate" value={progress} />
          <Typography variant="body2" align="center">
            {progress}%
          </Typography>
        </Box>
      )}

      <canvas ref={canvasRef} style={{ display: "none" }} />

      {text && (
        <Paper sx={{ mt: 3, p: 2, background: "#f6f6f6" }}>
          <Typography variant="h6">Texto detectado:</Typography>
          <Typography
            variant="body2"
            component="pre"
            sx={{ whiteSpace: "pre-wrap" }}
          >
            {text}
          </Typography>
        </Paper>
      )}

      <Paper sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6">Resultados extraídos:</Typography>
        <Typography><strong>Nombres:</strong> {results.nombre.join(" — ") || "No encontrado"}</Typography>
        <Typography><strong>CUIT/CUIL:</strong> {results.cuit.join(", ") || "No encontrado"}</Typography>
        <Typography><strong>CVU/CBU:</strong> {results.cvu_cbu.join(", ") || "No encontrado"}</Typography>
        <Typography><strong>Número de operación:</strong> {results.numero_operacion.join(", ") || "No encontrado"}</Typography>
      </Paper>
    </Box>
  );
}
