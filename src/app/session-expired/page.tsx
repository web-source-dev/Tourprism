'use client';

import React from "react";
import { useRouter } from "next/navigation";
import { Box, Typography, Button, Paper } from "@mui/material";

export default function SessionExpired() {
  const router = useRouter();

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "white",
        px: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          borderRadius: 4,
          maxWidth: 450,
          width: "100%",
          textAlign: "center",
          bgcolor: "white",
          boxShadow: "0px 10px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Box
          component="img"
          src="/images/Session-expired.webp"
          alt="Session Expired"
          sx={{ width: "100%", maxHeight: 300, mb: 2, borderRadius: 4 }}
        />
        <Typography variant="h4" fontWeight="bold" color="black" gutterBottom>
          Oops! Session Expired
        </Typography>
        <Typography variant="body1" color="gray" mb={3}>
          Your session has expired due to inactivity. Please log in again to continue.
        </Typography>
        <Button
          variant="contained"
          onClick={handleLogin}
          sx={{
            width: "100%",
            bgcolor: "black",
            color: "white",
            "&:hover": { bgcolor: "#333" },
            py: 1.5,
            fontSize: "1rem",
            fontWeight: "bold",
          }}
        >
          Re-login
        </Button>
      </Paper>
    </Box>
  );
} 