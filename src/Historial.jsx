// src/Historial.jsx
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
import * as XLSX from "xlsx";

export default function Historial() {
  const [historial, setHistorial] = useState([]);

  // Cargar historial desde localStorage
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("historial")) || [];
    setHistorial(data);
  }, []);

  // Eliminar todo
  const handleLimpiarTodo = () => {
    localStorage.removeItem("historial");
    setHistorial([]);
  };

  // Eliminar individual
  const handleEliminarItem = (index) => {
    const nuevoHistorial = historial.filter((_, i) => i !== index);
    setHistorial(nuevoHistorial);
    localStorage.setItem("historial", JSON.stringify(nuevoHistorial));
  };

  // 📤 Exportar solo los datos de “Resultados extraídos”
  const handleExportToExcel = () => {
    if (historial.length === 0) return;

    const dataParaExcel = historial.map((item) => {
      const r = item.resultados || {};
      return {
        "Entidad": item.tipoEntidad || "No encontrada",
        "Titular": r.nombre?.[0] || "No encontrado",
        "CUIT/CUIL": r.cuit?.[0] || "No encontrado",
        "CVU/CBU": r.cvu_cbu?.[0] || "No encontrado",
        "Número de operación": r.numero_operacion?.[0] || "No encontrado",
        "Monto": r.monto?.[0] ? `$${r.monto[0]}` : "No encontrado",
        "Fecha": r.fecha?.[0] || "No encontrada",
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataParaExcel);

    // 🪄 Ajuste automático de ancho de columnas
    const columnas = Object.keys(dataParaExcel[0]);
    const anchoColumnas = columnas.map((col) => {
      const maxLength = Math.max(
        col.length,
        ...dataParaExcel.map((row) =>
          row[col] ? row[col].toString().length : 0
        )
      );
      return { wch: maxLength + 2 }; // +2 para margen visual
    });
    worksheet["!cols"] = anchoColumnas;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Resultados Extraídos");
    XLSX.writeFile(workbook, "ResultadosExtraidos.xlsx");
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Historial de comprobantes
      </Typography>

      {/* Botones */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        {historial.length > 0 && (
          <>
            <Button
              variant="outlined"
              color="error"
              onClick={handleLimpiarTodo}
            >
              Limpiar todos
            </Button>
            <Button
              variant="contained"
              color="primary"
              onClick={handleExportToExcel}
            >
              Exportar a Excel
            </Button>
          </>
        )}
      </Box>

      {/* Si no hay comprobantes */}
      {historial.length === 0 ? (
        <Typography variant="body1" color="text.secondary">
          No hay comprobantes cargados todavía.
        </Typography>
      ) : (
        <Grid container spacing={2}>
          {historial.map((item, idx) => {
            const r = item.resultados || {};
            return (
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

                      <IconButton
                        color="error"
                        size="small"
                        onClick={() => handleEliminarItem(idx)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>

                    <Divider sx={{ my: 1 }} />

                    <Typography variant="body2">
                      <strong>Entidad:</strong> {item.tipoEntidad || "No encontrada"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Titular:</strong> {r.nombre?.[0] || "No encontrado"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>CUIT/CUIL:</strong> {r.cuit?.[0] || "No encontrado"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>CVU/CBU:</strong> {r.cvu_cbu?.[0] || "No encontrado"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Número de operación:</strong>{" "}
                      {r.numero_operacion?.[0] || "No encontrado"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Monto:</strong>{" "}
                      {r.monto?.[0] ? `$${r.monto[0]}` : "No encontrado"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Fecha:</strong> {r.fecha?.[0] || "No encontrada"}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </Box>
  );
}
