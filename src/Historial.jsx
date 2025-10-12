import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  IconButton,
  Divider,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import DescriptionIcon from "@mui/icons-material/Description";

export default function Historial() {
  const [historial, setHistorial] = useState([]);

  // Cargar historial desde localStorage al montar
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("historial")) || [];
    setHistorial(data);
  }, []);

  // Función para exportar a CSV
  const exportarACSV = () => {
    if (historial.length === 0) {
      alert("No hay datos para exportar");
      return;
    }

    // Función para limpiar y formatear datos
    const limpiarDato = (dato) => {
      if (!dato) return "No encontrado";
      if (Array.isArray(dato)) {
        return dato.length > 0 ? dato.join("; ") : "No encontrado";
      }
      // Remover saltos de línea y caracteres especiales
      return dato.toString().replace(/[\r\n]/g, " ").replace(/\s+/g, " ").trim();
    };

    // Cabeceras del CSV
    const headers = [
      "Nombre Archivo",
      "Fecha Procesamiento",
      "Nombres",
      "CUIT/CUIL",
      "CVU/CBU",
      "Número de Operación",
      "Monto",
      "Fecha Comprobante"
    ];

    // Convertir datos a filas CSV
    const rows = historial.map(item => [
      limpiarDato(item.nombreArchivo),
      limpiarDato(item.fecha),
      limpiarDato(item.resultados.nombre),
      limpiarDato(item.resultados.cuit),
      limpiarDato(item.resultados.cvu_cbu),
      limpiarDato(item.resultados.numero_operacion),
      limpiarDato(item.resultados.monto),
      limpiarDato(item.resultados.fecha)
    ]);

    // Crear contenido CSV con mejor escape de caracteres
    const csvContent = [headers, ...rows]
      .map(row => 
        row.map(field => {
          // Escapar comillas dobles y envolver en comillas
          const cleanField = field.toString().replace(/"/g, '""');
          return `"${cleanField}"`;
        }).join(",")
      )
      .join("\r\n");

    // Crear y descargar archivo con encoding correcto
    const blob = new Blob(["\uFEFF" + csvContent], { 
      type: "text/csv;charset=utf-8;" 
    });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historial_comprobantes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Historial de comprobantes
      </Typography>

      {/* Botones superiores */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Button variant="outlined" color="error">
          Limpiar todos
        </Button>
        <Button variant="contained" color="primary" onClick={exportarACSV}>
          Extraer a Excel
        </Button>
      </Box>

      {/* Si no hay comprobantes */}
      {historial.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No hay comprobantes cargados todavía.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {historial.map((item, idx) => (
            <Grid item xs={12} md={6} lg={4} key={idx}>
              <Card
                variant="outlined"
                sx={{
                  position: "relative",
                  borderRadius: 2,
                  boxShadow: 2,
                  p: 1,
                  backgroundColor: "#fafafa",
                }}
              >
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mb: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <DescriptionIcon color="primary" />
                      <Typography variant="subtitle1" sx={{ fontWeight: "bold" }}>
                        {item.nombreArchivo}
                      </Typography>
                    </Box>

                    <IconButton color="error" size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Box>

                  <Typography variant="body2" color="text.secondary">
                    <strong>Fecha:</strong> {item.fecha}
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="body2">
                    <strong>Nombres:</strong>{" "}
                    {item.resultados.nombre.join(", ") || "No encontrado"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>CUIT/CUIL:</strong>{" "}
                    {item.resultados.cuit.join(", ") || "No encontrado"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>CVU/CBU:</strong>{" "}
                    {item.resultados.cvu_cbu.join(", ") || "No encontrado"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Número de operación:</strong>{" "}
                    {item.resultados.numero_operacion.join(", ") ||
                      "No encontrado"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Monto:</strong>{" "}
                    {item.resultados.monto
                      ? item.resultados.monto
                          .map((m) => `$${m}`)
                          .join(", ") || "No encontrado"
                      : "No encontrado"}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
