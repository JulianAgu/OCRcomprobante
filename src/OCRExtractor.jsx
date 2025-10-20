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
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
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
  const [tipoEntidad, setTipoEntidad] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editedResults, setEditedResults] = useState({
    tipoEntidad: "",
    nombre: "",
    cuit: "",
    cvu_cbu: "",
    numero_operacion: "",
    monto: "",
    fecha: "",
  });
  const canvasRef = useRef(null);

   // Abrir menú de entidad
  const handleTipoClick = (event) => setAnchorEl(event.currentTarget);

  // Seleccionar tipo de comprobante
  const handleTipoSelect = (tipo) => {
    setTipoEntidad(tipo);
    setAnchorEl(null);
    document.getElementById("fileInput").click();
  };

  // Abrir diálogo de edición
  const handleOpenEditDialog = () => {
    setEditedResults({
      tipoEntidad: tipoEntidad || "",
      nombre: results.nombre[0] || "",
      cuit: results.cuit[0] || "",
      cvu_cbu: results.cvu_cbu[0] || "",
      numero_operacion: results.numero_operacion[0] || "",
      monto: results.monto[0] || "",
      fecha: results.fecha[0] || "",
    });
    setEditDialogOpen(true);
  };

  // Guardar cambios editados
  const handleSaveEdits = () => {
    const updatedResults = {
      nombre: editedResults.nombre ? [editedResults.nombre] : [],
      cuit: editedResults.cuit ? [editedResults.cuit] : [],
      cvu_cbu: editedResults.cvu_cbu ? [editedResults.cvu_cbu] : [],
      numero_operacion: editedResults.numero_operacion ? [editedResults.numero_operacion] : [],
      monto: editedResults.monto ? [editedResults.monto] : [],
      fecha: editedResults.fecha ? [editedResults.fecha] : [],
    };
    
    setResults(updatedResults);
    setTipoEntidad(editedResults.tipoEntidad); // Actualizar la entidad bancaria
    
    // Actualizar el historial con los datos editados
    if (historial.length > 0) {
      const historialActualizado = [...historial];
      historialActualizado[0] = {
        ...historialActualizado[0],
        tipoEntidad: editedResults.tipoEntidad,
        resultados: updatedResults,
      };
      setHistorial(historialActualizado);
      localStorage.setItem("historial", JSON.stringify(historialActualizado));
    }
    
    setEditDialogOpen(false);
  };

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

        const nuevoComprobante = {
          fecha: new Date().toLocaleString(),
          nombreArchivo: file.name,
          tipoEntidad: tipoEntidad,
          resultados: campos,
        };
        const historialActualizado = [nuevoComprobante, ...historial];
        setHistorial(historialActualizado);
        localStorage.setItem("historial", JSON.stringify(historialActualizado));
      })
      .catch((err) => {
        console.error(err);
        setProgress(0);
      });
  };

  // 🔍 EXTRACT FIELDS LIMPIO Y CORREGIDO
  function extractFields(t) {
    if (!t) t = "";
     const norm = t.replace(/\u00A0/g, " ").replace(/\r/g, "\n");

    //CASO NARANJAX
     if (tipoEntidad === "NaranjaX") {
      const campos = {
        monto: [],
        fecha: [],
        numero_operacion: [],
        nombre: [],
        cuit: [],
        cvu_cbu: [],
      };
      // 🔹 Normalizamos texto
      const norm = t.replace(/\u00A0/g, " ").replace(/\r/g, "\n");

     // 🔹 Monto (robusto para NaranjaX: acepta OCR que lee "$" como "s" o sin símbolo)
      let monto = null;

      // clean general (usa 'norm' ya definido)
      const cleanNormMonto = norm
        .replace(/[\u200B-\u200D\uFEFF]/g, "")   // zero-width
        .replace(/\u00A0/g, " ")
        .replace(/\s{2,}/g, " ")
        .replace(/([^\d])s\s+([0-9])/gi, "$1$ $2"); // intenta corregir "s 10" -> "$ 10"

      // 1) Buscar ventana cerca de la palabra clave "Enviaste" (si existe), sino usar todo
      let windowText = cleanNormMonto;
      const keyPos = cleanNormMonto.search(/enviaste|enviaste:/i);
      if (keyPos !== -1) {
        windowText = cleanNormMonto.slice(keyPos, keyPos + 160); // toma 160 chars a partir de "Enviaste"
      }

      // 2) Si hay un símbolo $ (o S), preferir la coincidencia con símbolo
      const prefMatch = windowText.match(/[\$\uFF04S]\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,]\d{1,2})?)/i);
      if (prefMatch && prefMatch[1]) {
        monto = prefMatch[1];
      }

      // 3) Si no, extraer todos los trozos numéricos en la ventana y procesarlos
      if (!monto) {
        // encuentra todos los grupos tipo "123", "3.000", "00", "10", "3,50", etc.
        const allNums = Array.from(windowText.matchAll(/([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,]\d{1,2})?)/g)).map(m => m[1]);

        if (allNums.length > 0) {
          // si hay al menos uno, tomar el último candidato
          let last = allNums[allNums.length - 1];

          // si el último tiene 1 o 2 dígitos (probable centavos) y hay un anterior, combinarlos:
          // ejemplo: ["00","10"] -> combina en "10.00"
          if (/^[0-9]{1,2}$/.test(last) && allNums.length >= 2) {
            const pen = allNums[allNums.length - 2];
            // limpiar puntos de miles del pen
            const penClean = pen.replace(/\./g, "").replace(",", ".");
            last = `${penClean}.${last.padStart(2, "0")}`;
          }

          monto = last;
        }
      }

      // 4) Normalizar monto y formatear con 2 decimales
      if (monto) {
        // quitar separadores de miles y unificar decimal con punto
        let normalized = monto.replace(/\./g, "").replace(",", ".").trim();
        // puede quedar algo como "3000" o "10.00"
        const num = parseFloat(normalized);
        if (!isNaN(num)) {
          // formatear con 2 decimales (opcional: si querés sin decimales, cambia toFixed)
          campos.monto.push(`${num.toFixed(2)}`);
        }
      }


      // 🔹 Fecha (formato dd/mmm/yyyy o dd/MMM/yyyy)
        
      const fechaMatches = [];

      // Diccionario de meses (por si aparece el nombre en texto)
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
        // Abreviaturas en mayúsculas o con OCR mal interpretadas
        JAN: "01", FEB: "02", MAR: "03", APR: "04", MAY: "05", JUN: "06",
        JUL: "07", AUG: "08", SEP: "09", OCT: "10", NOV: "11", DEC: "12",
        "0CT": "10" // caso especial NaranjaX con cero
      };

      // Patrones de fecha comunes + casos con abreviaturas o errores OCR
      const fechaPatterns = [
        /\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/g, // 04/10/2025 o 4-10-2025
        /\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b/g, // 2025/10/04
        /\b(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+de\s+(\d{4})\b/gi, // 4 de octubre de 2025
        /\b(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|setiembre|octubre|noviembre|diciembre)\s+(\d{1,2}),?\s+(\d{4})\b/gi, // octubre 4, 2025
        /\b(\d{1,2})\/([0O]?[A-Z]{2,8})\/(\d{4})/g // 04/OCT/2025 o 04/0CT/2025
      ];

      for (const pattern of fechaPatterns) {
        let match;
        while ((match = pattern.exec(norm)) !== null) {
          let dia, mes, año, mesTexto, fechaFormateada = "";

          // Caso con nombres de mes en texto (“4 de octubre de 2025”)
          if (pattern.source.includes("de") || pattern.source.includes("enero")) {
            dia = match[1].padStart(2, "0");
            mesTexto = match[2].toLowerCase();
            mes = meses[mesTexto] || "00";
            año = match[3];
            fechaFormateada = `${dia}/${mes}/${año}`;
          }

          // Caso formato yyyy/mm/dd
          else if (match[1].length === 4) {
            año = match[1];
            mes = match[2].padStart(2, "0");
            dia = match[3].padStart(2, "0");
            fechaFormateada = `${dia}/${mes}/${año}`;
          }

          // Caso dd/mm/yyyy numérico
          else if (/^\d+$/.test(match[2])) {
            dia = match[1].padStart(2, "0");
            mes = match[2].padStart(2, "0");
            año = match[3];
            fechaFormateada = `${dia}/${mes}/${año}`;
          }

          // Caso abreviado con letras o errores OCR (“04/0CT/2025”)
          else {
            dia = match[1].padStart(2, "0");
            const abreviado = match[2].toUpperCase().replace("0", "O"); // corrige 0→O
            mes = meses[abreviado] || "00";
            año = match[3];
            fechaFormateada = `${dia}/${mes}/${año}`;
          }

          if (fechaFormateada !== "00/00/0000") fechaMatches.push(fechaFormateada);
        }
      }

      if (fechaMatches.length > 0) {
        campos.fecha.push(fechaMatches[0]); // primera coincidencia
      }
      
    // 🔹 Código o número de transacción
      const codigoMatch = norm.match(/(Código\s+de\s+transacci[oó]n|Identificaci[oó]n\s+de\s+operaci[oó]n)[^\n:]*[:\s]+([A-Za-z0-9\-]+)/i);
      if (codigoMatch) campos.numero_operacion.push(codigoMatch[2]);

      // 🔹 CUIT/CUIL (si querés mantenerlo)
      const cuitRegex = /\b((?:20|23|24|27|30|33|34)[-\s]?\d{7,8}[-\s]?\d)\b/gi;
      let m;
      while ((m = cuitRegex.exec(norm)) !== null) {
        campos.cuit.push(m[1].replace(/[\s-]/g, ""));
      }
     // 🔹 Nombre del titular (Naranja X) — versión robusta y sin shadowing de `norm`
      const nombreMatch = norm.match(/NX\s+([A-ZÁÉÍÓÚÑ][A-ZÁÉÍÓÚÑa-záéíóúñ\s]+?)(?=\s+(?:Naranja|CBU|CUIL|\d|$))/i);
      if (nombreMatch) campos.nombre.push(nombreMatch[1].trim());
     
      // 🔹 CVU/CBU (búsqueda robusta en líneas)
      const cvuMatches = [];
      const regex = /(?:CVU|CBU)[\s:\-]*([\d\s\-]{16,24})/gi;

      // Busca “CBU” y captura números, incluso si hay saltos de línea
      const textFlat = norm.replace(/\n+/g, " ");
      let match;
      while ((match = regex.exec(textFlat)) !== null) {
        const cbu = match[1].replace(/\D/g, "");
        if (cbu.length >= 16 && cbu.length <= 24 && !cvuMatches.includes(cbu)) {
        cvuMatches.push(cbu);
        }
    }

      // fallback: cualquier secuencia larga de dígitos (por si el OCR no detectó la palabra CBU)
      if (cvuMatches.length === 0) {
      const longDigits = [...textFlat.matchAll(/\b\d{16,24}\b/g)].map(m => m[0]);
      cvuMatches.push(...longDigits);
      }

      if (cvuMatches.length > 0) campos.cvu_cbu = cvuMatches;
      return campos;
    }
    //FINAL CASO NARANJAX


    //CASO SANTANDER
    if(tipoEntidad === "Santander"){
      const campos = {
        monto: [],
        fecha: [],
        numero_operacion: [],
        nombre: [],
        cuit: [],
        cvu_cbu: [],
      };
      //En este caso, el comprobante no tiene el nombre del titular ni CUIT/CUIL ni CVU/CBU, por lo que no se buscan.

      // Monto
      const montoRegex = /Importe Debitado\s*[:\s]*\$?\s*([0-9]{1,3}(?:[.,][0-9]{3})*(?:[.,][0-9]{1,2})?)/i;
      const montoMatch = norm.match(montoRegex);
      if (montoMatch) campos.monto.push(montoMatch[1]);
      
      // Fecha
      const fechaRegex = /Fecha\s*[:\s]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})/i;
      const fechaMatch = norm.match(fechaRegex);
      if (fechaMatch) campos.fecha.push(fechaMatch[1]);

      // Número de operación
      const numeroOpRegex = /N[uú]mero de Comprobante\s*[:\s]*(\d{6,20})/i;
      const numeroOpMatch = norm.match(numeroOpRegex);
      if (numeroOpMatch) campos.numero_operacion.push(numeroOpMatch[1]);

      return campos;
    
    }//FINAL CASO SANTANDER
   
    //CASO MACRO
    if (tipoEntidad === "Macro") {
      const campos = {
        monto: [],
        fecha: [],
        numero_operacion: [],
        nombre: [],
        cuit: [],
        cvu_cbu: [],
      };
      // Monto
      const montoRegex = /Importe\s*[:\s]*\$?\s*([0-9]+(?:[.,][0-9]{1,2})?)/i;
      const montoMatch = norm.match(montoRegex);

      if (montoMatch) { 
        let raw = montoMatch[1].trim();  // 2️⃣ Parseamos el número
        const valor = parseFloat(raw);

        if (!isNaN(valor)) {
          // 3️⃣ Verificamos si el texto original tenía decimales
          const tieneDecimales = /[.,]\d{1,2}$/.test(montoMatch[1]);

          // 4️⃣ Formateamos según corresponda
          const numeroFormateado = valor.toLocaleString("es-AR", {
            minimumFractionDigits: tieneDecimales ? 2 : 0,
            maximumFractionDigits: tieneDecimales ? 2 : 0,
          });

          campos.monto.push(`${numeroFormateado}`);
        }
      }


      
      // --- Fecha + Número de operación ---
      // Captura casos como "04/10/2025 01:30 7111"
      const fechaNumOpRegex = /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})[^\d]*(?:\d{1,2}:\d{2})?[^\d]*(\d{3,6})\b/;
      const fechaNumOpMatch = norm.match(fechaNumOpRegex);
      if (fechaNumOpMatch) {
        campos.fecha.push(fechaNumOpMatch[1]);
        campos.numero_operacion.push(fechaNumOpMatch[2]);
      }

      return campos;  


    } // FINAL CASO MACRO



    //CASO MERCADO PAGO Y GALICIA
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
          if (
            !isNaN(numericValue) &&
            numericValue >= 0.1 &&
            numericValue <= 100000000
          )
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
        <Button variant="contained" onClick={handleTipoClick}>
          Subir comprobante
        </Button>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
        >
          {["Mercado Pago", "Galicia", "NaranjaX","Santander","Macro"].map((tipo) => (
            <MenuItem key={tipo} onClick={() => handleTipoSelect(tipo)}>
              {tipo}
            </MenuItem>
          ))}
        </Menu>

        <input
          id="fileInput"
          type="file"
          accept="image/*,application/pdf"
          hidden
          onChange={handleFile}
        />

       
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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h6">Resultados extraídos:</Typography>
          {comprobanteCargado && (
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleOpenEditDialog}
            >
              Editar resultados
            </Button>
          )}
        </Box>

        {!comprobanteCargado ? (
          <Typography color="text.secondary">
            Aún no se cargó un comprobante
          </Typography>
        ) : (
          <>
            <Typography>
              <strong>Entidad:</strong> {tipoEntidad}
            </Typography>
            <Typography>
              <strong>Titular:</strong> {results.nombre[0] || "No encontrado"}
            </Typography>
            <Typography>
              <strong>CUIT/CUIL:</strong> {results.cuit[0] || "No encontrado"}
            </Typography>
            <Typography>
              <strong>CVU/CBU:</strong> {results.cvu_cbu[0] || "No encontrado"}
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
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Historial de comprobantes
          <Box sx={{ display: "flex", gap: 1 }}>
            {historial.length > 0 && (
              <Button
                variant="outlined"
                color="error"
                size="small"
                onClick={() => {
                  setHistorial([]);
                  localStorage.removeItem("historial");
                }}
              >
                Limpiar historial
              </Button>
            )}
            <Button
              variant="outlined"
              color="inherit"
              size="small"
              onClick={() => setHistorialOpen(false)}
            >
              Salir
            </Button>
          </Box>
        </DialogTitle>

        <DialogContent>
          <List>
            {historial.map((item, idx) => {
              const r = item.resultados || {};
              return (
                <ListItem key={idx} divider>
                  <ListItemText
                    primary={`${item.nombreArchivo || "Sin nombre"} — ${
                      item.fecha || ""
                    } — ${item.tipoEntidad || ""}`}
                    secondary={
                      <>
                        <div>
                          <strong>Nombres:</strong>{" "}
                          {Array.isArray(r.nombre)
                            ? r.nombre.join(", ")
                            : r.nombre || "No encontrado"}
                        </div>
                        <div>
                          <strong>CUIT/CUIL:</strong>{" "}
                          {Array.isArray(r.cuit)
                            ? r.cuit.join(", ")
                            : r.cuit || "No encontrado"}
                        </div>
                        <div>
                          <strong>CVU/CBU:</strong>{" "}
                          {Array.isArray(r.cvu_cbu)
                            ? r.cvu_cbu.join(", ")
                            : r.cvu_cbu || "No encontrado"}
                        </div>
                        <div>
                          <strong>Número de operación:</strong>{" "}
                          {Array.isArray(r.numero_operacion)
                            ? r.numero_operacion.join(", ")
                            : r.numero_operacion || "No encontrado"}
                        </div>
                        <div>
                          <strong>Monto:</strong>{" "}
                          {Array.isArray(r.monto)
                            ? r.monto.map((m) => `$${m}`).join(", ")
                            : r.monto || "No encontrado"}
                        </div>
                        <div>
                          <strong>Fecha:</strong>{" "}
                          {Array.isArray(r.fecha)
                            ? r.fecha.join(", ")
                            : r.fecha || "No encontrado"}
                        </div>
                      </>
                    }
                  />
                </ListItem>
              );
            })}
          </List>
          {historial.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Aún no se cargaron comprobantes.
            </Typography>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de edición de resultados */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Editar resultados extraídos</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}>
            <TextField
              select
              label="Entidad Bancaria"
              value={editedResults.tipoEntidad}
              onChange={(e) => setEditedResults({ ...editedResults, tipoEntidad: e.target.value })}
              fullWidth
            >
              <MenuItem value="Mercado Pago">Mercado Pago</MenuItem>
              <MenuItem value="Galicia">Galicia</MenuItem>
              <MenuItem value="NaranjaX">NaranjaX</MenuItem>
              <MenuItem value="Santander">Santander</MenuItem>
              <MenuItem value="Macro">Macro</MenuItem>
            </TextField>
            <TextField
              label="Titular"
              value={editedResults.nombre}
              onChange={(e) => setEditedResults({ ...editedResults, nombre: e.target.value })}
              fullWidth
            />
            <TextField
              label="CUIT/CUIL"
              value={editedResults.cuit}
              onChange={(e) => setEditedResults({ ...editedResults, cuit: e.target.value })}
              fullWidth
            />
            <TextField
              label="CVU/CBU"
              value={editedResults.cvu_cbu}
              onChange={(e) => setEditedResults({ ...editedResults, cvu_cbu: e.target.value })}
              fullWidth
            />
            <TextField
              label="Número de operación"
              value={editedResults.numero_operacion}
              onChange={(e) => setEditedResults({ ...editedResults, numero_operacion: e.target.value })}
              fullWidth
            />
            <TextField
              label="Monto"
              value={editedResults.monto}
              onChange={(e) => setEditedResults({ ...editedResults, monto: e.target.value })}
              fullWidth
              helperText="Sin el símbolo $"
            />
            <TextField
              label="Fecha"
              value={editedResults.fecha}
              onChange={(e) => setEditedResults({ ...editedResults, fecha: e.target.value })}
              fullWidth
              helperText="Formato: DD/MM/AAAA"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} color="inherit">
            Cancelar
          </Button>
          <Button onClick={handleSaveEdits} variant="contained">
            Guardar cambios
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
