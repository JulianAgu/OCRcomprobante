// src/Sidebar.js
import * as React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Button,
  Typography,
} from "@mui/material";
import { Home, Description, Person, Logout, History } from "@mui/icons-material";
import { Link, useLocation } from "react-router-dom";

export default function Sidebar({ onLogout }) {
  const location = useLocation();

  const navItems = [
    { text: "Inicio", icon: <Home />, path: "/home" },
    { text: "Comprobante", icon: <Description />, path: "/ocr" },
    { text: "Historial", icon: <History />, path: "/historial" },
  ];

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: 240,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: 240, boxSizing: "border-box" },
        fontFamily: "'Poppins', sans-serif",
      }}
    >
      <List>
        {navItems.map((item) => (
          <ListItem
            key={item.text}
            button
            component={Link}
            to={item.path}
            sx={{
              color: "black",
              fontWeight: "bold",
              "&:hover": { backgroundColor: "#f0f0f0" },
              "&.Mui-selected": { backgroundColor: "#e0e0e0" },
              textDecoration: "none",
            }}
            selected={location.pathname === item.path}
          >
            <ListItemIcon sx={{ color: "black" }}>{item.icon}</ListItemIcon>
            <ListItemText
              primary={
                <Typography sx={{ fontWeight: "bold", color: "black" }}>
                  {item.text}
                </Typography>
              }
            />
          </ListItem>
        ))}

        {/* Perfil grisado */}
        <ListItem
          disabled
          sx={{
            opacity: 0.5,
            cursor: "not-allowed",
          }}
        >
          <ListItemIcon>
            <Person color="disabled" />
          </ListItemIcon>
          <ListItemText
            primary={
              <Typography sx={{ fontWeight: "normal", color: "gray" }}>
                Perfil (en desarrollo)
              </Typography>
            }
          />
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
