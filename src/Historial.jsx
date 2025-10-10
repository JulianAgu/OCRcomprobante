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

  // 🔴 Eliminar todo el historial
  const handleLimpiarTodo = () => {
    localStorage.removeItem("historial");
    setHistorial([]);
  };

  // 🗑️ Eliminar comprobante individual
  const handleEliminarItem = (index) => {
    const nuevoHistorial = historial.filter((_, i) => i !== index);
    setHistorial(nuevoHistorial);
    localStorage.setItem("historial", JSON.stringify(nuevoHistorial));
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Historial de comprobantes
      </Typography>

      {/* Botones superiores */}
      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <Button variant="outlined" color="error" onClick={handleLimpiarTodo}>
          Limpiar todos
        </Button>
        <Button variant="contained" color="primary">
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
                      <Typography
                        variant="subtitle1"
                        sx={{ fontWeight: "bold" }}
                      >
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

                  <Typography variant="body2" color="text.secondary">
                    <strong>Fecha:</strong> {item.fecha}
                  </Typography>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="body2">
                    <strong>Nombres:</strong>{" "}
                    {item.resultados?.nombre?.join(", ") || "No encontrado"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>CUIT/CUIL:</strong>{" "}
                    {item.resultados?.cuit?.join(", ") || "No encontrado"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>CVU/CBU:</strong>{" "}
                    {item.resultados?.cvu_cbu?.join(", ") || "No encontrado"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Número de operación:</strong>{" "}
                    {item.resultados?.numero_operacion?.join(", ") ||
                      "No encontrado"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Monto:</strong>{" "}
                    {item.resultados?.monto
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
