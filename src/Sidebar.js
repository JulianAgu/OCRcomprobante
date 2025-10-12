// src/Sidebar.js
import * as React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
} from "@mui/material";
import {
  Home,
  Description,
  Person,
  Logout,
  History,
} from "@mui/icons-material";
import { Link } from "react-router-dom";

export default function Sidebar({ onLogout }) {
  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: 240, boxSizing: "border-box" },
      }}
    >
      <List>
        {/* Inicio */}
        <ListItem button component={Link} to="/home">
          <ListItemIcon>
            <Home />
          </ListItemIcon>
          <ListItemText primary="Inicio" />
        </ListItem>

        {/* Comprobante */}
        <ListItem button component={Link} to="/ocr">
          <ListItemIcon>
            <Description />
          </ListItemIcon>
          <ListItemText primary="Comprobante" />
        </ListItem>

        {/* Perfil (en desarrollo) */}
        <ListItem
          disabled // 🚫 lo deshabilita visualmente y funcionalmente
          sx={{
            opacity: 0.5, // 🔘 grisado
            cursor: "not-allowed", // 🔘 cursor bloqueado
          }}
        >
          <ListItemIcon>
            <Person color="disabled" /> {/* Ícono gris */}
          </ListItemIcon>
          <ListItemText primary="Perfil (en desarrollo)" />
        </ListItem>

        {/* Historial */}
        <ListItem button component={Link} to="/historial">
          <ListItemIcon>
            <History />
          </ListItemIcon>
          <ListItemText primary="Historial" />
        </ListItem>
      </List>

      {/* Botón salir */}
      <div style={{ marginTop: "auto", padding: "10px" }}>
        <Button
          variant="outlined"
          color="error"
          startIcon={<Logout />}
          fullWidth
          onClick={onLogout}
        >
          Salir
        </Button>
      </div>
    </Drawer>
  );
}
