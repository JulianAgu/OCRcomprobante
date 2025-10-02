// src/LoginPage.js
import React, { useState } from "react";
import { Button, TextField, Box, Typography } from "@mui/material";

export default function LoginPage({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user === "test" && pass === "1234") {
      onLogin();
    } else {
      alert("Usuario o contraseña incorrectos");
    }
  };

  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
    >
      <form onSubmit={handleSubmit} style={{ width: "300px" }}>
        <Typography variant="h5" align="center" gutterBottom>
          Login
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
    </Box>
  );
}
