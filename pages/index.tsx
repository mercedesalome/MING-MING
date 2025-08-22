// pages/index.tsx
import React from "react";

export default function Home() {
  return (
    <div style={{ 
      display: "flex", 
      flexDirection: "column", 
      alignItems: "center", 
      justifyContent: "center", 
      minHeight: "100vh",
      fontFamily: "sans-serif",
      textAlign: "center"
    }}>
      <h1>Welcome to Ming Ming!</h1>
      <p>Your Next.js app is now live 🎉</p>
    </div>
  );
}
