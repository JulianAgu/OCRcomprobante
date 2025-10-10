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
  History, // 👈 Importamos el nuevo icono
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
        <ListItem button component={Link} to="/home">
          <ListItemIcon>
            <Home />
          </ListItemIcon>
          <ListItemText primary="Inicio" />
        </ListItem>

        <ListItem button component={Link} to="/ocr">
          <ListItemIcon>
            <Description />
          </ListItemIcon>
          <ListItemText primary="Comprobante" />
        </ListItem>

        <ListItem button component={Link} to="/perfil">
          <ListItemIcon>
            <Person />
          </ListItemIcon>
          <ListItemText primary="Perfil" />
        </ListItem>

        {/* 🔥 Nuevo item: Historial */}
        <ListItem button component={Link} to="/historial">
          <ListItemIcon>
            <History />
          </ListItemIcon>
          <ListItemText primary="Historial" />
        </ListItem>
      </List>

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