// src/OCRExtractor.jsx
// src/OCRExtractor.jsx
import React, { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import * as pdfjsLib from "pdfjs-dist/legacy/build/pdf";
import {
  Box,
  Typography,
  Button,
  LinearProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";

pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export default function OCRExtractor() {
  const [text, setText] = useState("");
  const [results, setResults] = useState({
    nombre: [],
    cuit: [],
    cvu_cbu: [],
    numero_operacion: [],
    monto: [],
    fecha: [],
  });
  const [progress, setProgress] = useState(0);
  const [historialOpen, setHistorialOpen] = useState(false);
  const [historial, setHistorial] = useState(
    JSON.parse(localStorage.getItem("historial")) || []
  );
  const [comprobanteCargado, setComprobanteCargado] = useState(false);

  const canvasRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setText("");
    setResults({
      nombre: [],
      cuit: [],
      cvu_cbu: [],
      numero_operacion: [],
      monto: [],
      fecha: [],
    });
    setProgress(0);
    setComprobanteCargado(false);

    const isPdf = file.type === "application/pdf";
    let imageBlob;

    if (isPdf) {
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

      imageBlob = await new Promise((res) => canvas.toBlob(res, "image/png"));
    } else {
      imageBlob = file;
    }

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
        const campos = extractFields(text);
        setResults(campos);
        setProgress(100);
        setComprobanteCargado(true);

        // Guardar en historial
        const nuevoComprobante = {
          fecha: new Date().toLocaleString(),
          nombreArchivo: file.name,
          resultados: campos,
        };
        const historialActualizado = [nuevoComprobante, ...historial];
        setHistorial(historialActualizado);
        localStorage.setItem(
          "historial",
          JSON.stringify(historialActualizado)
        );
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

    // Monto
    const montoMatches = [];
    const lines = norm
      .split(/\n+/)
      .map((l) => l.trim())
      .filter(Boolean);

    for (const line of lines) {
      if (/motivo|varios|concepto|detalle|descripci[oó]n|nota/i.test(line))
        continue;
      const montoPatterns = [
        /\$\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)/g,
        /(?:Total|Monto|Importe|Valor)[\s:]*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)/gi,
        /([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)\s*(?:ARS|PESOS)/gi,
      ];
      for (const pattern of montoPatterns) {
        let match;
        while ((match = pattern.exec(line)) !== null) {
          const monto = match[1].replace(/\s/g, "");
          if (!/^[0-9.,]+$/.test(monto)) continue;
          let numericValue = parseFloat(
            monto.replace(/,/g, ".").replace(/\.(?=.*\.)/g, "")
          );
          if (!isNaN(numericValue) && numericValue >= 0.1 && numericValue <= 100000000)
            montoMatches.push(monto);
        }
      }
    }

    // Fecha
    const fechaMatches = [];
    const meses = {
      enero: "01",
      febrero: "02",
      marzo: "03",
      abril: "04",
      mayo: "05",
      junio: "06",
      julio: "07",
      agosto: "08",
      septiembre: "09",
      setiembre: "09",
      octubre: "10",
      noviembre: "11",
      diciembre: "12",
    };
    const fechaPatterns = [
      /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g,
      /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/g,
      /\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})\b/gi,
      /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(\d{1,2}),?\s+(\d{4})\b/gi,
      /(?:Fecha|Date)[:\s]+(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/gi,
    ];
    for (const pattern of fechaPatterns) {
      let match;
      while ((match = pattern.exec(norm)) !== null) {
        let fechaFormateada = "";
        if (pattern.source.includes("de")) {
          const dia = match[1].padStart(2, "0");
          const mes = meses[match[2].toLowerCase()];
          const año = match[3];
          fechaFormateada = `${dia}/${mes}/${año}`;
        } else if (match[1].length === 4) {
          const año = match[1];
          const mes = match[2].padStart(2, "0");
          const dia = match[3].padStart(2, "0");
          fechaFormateada = `${dia}/${mes}/${año}`;
        } else {
          const dia = match[1].padStart(2, "0");
          const mes = match[2].padStart(2, "0");
          const año = match[3];
          fechaFormateada = `${dia}/${mes}/${año}`;
        }
        fechaMatches.push(fechaFormateada);
      }
    }

    // Nombres (De/Para)
    const names = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const deParaPattern = /(?:^|\s|•\s*)(De|Para)\s*:?\s*$/i;
      if (deParaPattern.test(line) && i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        if (
          nextLine &&
          nextLine.length > 2 &&
          !/^(CUIT|CVU|CBU|Mercado Pago|Banco)/i.test(nextLine) &&
          !/^\d+[:\-]/.test(nextLine) &&
          !/^[\d\s\-]+$/.test(nextLine)
        ) {
          names.push(nextLine);
        }
      }
    }

    const uniq = (arr) =>
      Array.from(new Set(arr.map((s) => s.trim()))).filter(Boolean);

    return {
      nombre: uniq(names),
      cuit: uniq(cuitMatches),
      cvu_cbu: uniq(cvuMatches),
      numero_operacion: uniq(ops),
      monto: uniq(montoMatches),
      fecha: uniq(fechaMatches),
    };
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Carga de comprobantes bancarios
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2 }}>
        <Button variant="contained" component="label">
          Subir comprobante
          <input
            type="file"
            accept="image/*,application/pdf"
            hidden
            onChange={handleFile}
          />
        </Button>

        <Button variant="outlined" onClick={() => setHistorialOpen(true)}>
          Ver historial
        </Button>
      </Box>

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

      {/* Resultados */}
      <Paper sx={{ mt: 3, p: 2 }}>
        <Typography variant="h6">Resultados extraídos:</Typography>

        {!comprobanteCargado ? (
          <Typography color="text.secondary">
            Aún no se cargó un comprobante
          </Typography>
        ) : (
          <>
            <Typography>
              <strong>Nombres:</strong>{" "}
              {results.nombre.join(" — ") || "No encontrado"}
            </Typography>
            <Typography>
              <strong>CUIT/CUIL:</strong>{" "}
              {results.cuit.join(", ") || "No encontrado"}
            </Typography>
            <Typography>
              <strong>CVU/CBU:</strong>{" "}
              {results.cvu_cbu.join(", ") || "No encontrado"}
            </Typography>
            <Typography>
              <strong>Número de operación:</strong>{" "}
              {results.numero_operacion.join(", ") || "No encontrado"}
            </Typography>
            <Typography>
              <strong>Monto:</strong>{" "}
              {results.monto.length > 0
                ? results.monto.map((m) => `$${m}`).join(", ")
                : "No encontrado"}
            </Typography>
            <Typography>
              <strong>Fecha:</strong>{" "}
              {results.fecha.join(", ") || "No encontrado"}
            </Typography>
          </>
        )}
      </Paper>

      {/* Modal de historial */}
      <Dialog
        open={historialOpen}
        onClose={() => setHistorialOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Historial de comprobantes
          <Button
            variant="outlined"
            color="error"
            size="small"
            sx={{ float: "right" }}
            onClick={() => {
              setHistorial([]);
              localStorage.removeItem("historial");
            }}
          >
            Limpiar historial
          </Button>
        </DialogTitle>
        <DialogContent>
          <List>
            {historial.length === 0 && (
              <Typography variant="body2">
                No hay comprobantes cargados
              </Typography>
            )}
            {historial.map((item, idx) => (
              <ListItem key={idx} divider>
                <ListItemText
                  primary={`${item.nombreArchivo} — ${item.fecha}`}
                  secondary={
                    <>
                      <div>
                        <strong>Nombres:</strong>{" "}
                        {item.resultados.nombre.join(", ") || "No encontrado"}
                      </div>
                      <div>
                        <strong>CUIT/CUIL:</strong>{" "}
                        {item.resultados.cuit.join(", ") || "No encontrado"}
                      </div>
                      <div>
                        <strong>CVU/CBU:</strong>{" "}
                        {item.resultados.cvu_cbu.join(", ") || "No encontrado"}
                      </div>
                      <div>
                        <strong>Número de operación:</strong>{" "}
                        {item.resultados.numero_operacion.join(", ") ||
                          "No encontrado"}
                      </div>
                      <div>
                        <strong>Monto:</strong>{" "}
                        {item.resultados.monto
                          ? item.resultados.monto
                              .map((m) => `$${m}`)
                              .join(", ") || "No encontrado"
                          : "No encontrado"}
                      </div>
                      <div>
                        <strong>Fecha:</strong>{" "}
                        {item.resultados.fecha
                          ? item.resultados.fecha.join(", ") || "No encontrado"
                          : "No encontrado"}
                      </div>
                    </>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
