import React, { useState } from "react";
import { Button, TextField, Box, Typography } from "@mui/material";
import logo from "./assets/logoEstudio.jpg";
import DevStickyNote from "./DevStickyNote"; 

export default function LoginPage({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user.toLowerCase() === "julieta" && pass === "1234") {
      onLogin();
    } else {
      alert("Usuario o contraseña incorrectos");
    }
  };

  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      position="relative"
    >
      {/* Logo arriba del login */}
      <img
        src={logo}
        alt="Logo EPB&A"
        style={{ width: 300, marginBottom: 20 }}
      />

      <form onSubmit={handleSubmit} style={{ width: "300px" }}>
        <Typography variant="h5" align="center" gutterBottom>
          Iniciar sesión
        </Typography>
        <TextField
          label="Usuario"
          fullWidth
          margin="normal"
          value={user}
          onChange={(e) => setUser(e.target.value)}
        />
        <TextField
          label="Contraseña"
          type="password"
          fullWidth
          margin="normal"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
        />
        <Button type="submit" variant="contained" color="primary" fullWidth>
          Ingresar
        </Button>
      </form>

      {/* Sticky Note  Despues con borrar esto y el archivo ya esta*/}
      <DevStickyNote />
    </Box>
  );
}
