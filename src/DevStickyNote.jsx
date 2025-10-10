import React from "react";

export default function DevStickyNote() {
  return (
    <div
      style={{
        position: "fixed", // mejor fixed para que quede siempre visible
        top: 20,
        right: 20,
        width: 160,
        padding: "15px 20px",
        backgroundColor: "#ffeb3b",
        transform: "rotate(-5deg)",
        boxShadow: "5px 5px 15px rgba(0,0,0,0.3)",
        border: "1px solid #f1c40f",
        borderRadius: "5px",
        fontFamily: "monospace",
        zIndex: 1000,
      }}
    >
      <div style={{ marginBottom: 5 }}><strong>Usuario:</strong> Julieta</div>
      <div><strong>Contraseña:</strong> 1234</div>
    </div>
  );
}
