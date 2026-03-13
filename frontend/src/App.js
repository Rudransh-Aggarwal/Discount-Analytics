import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AuthProvider } from "./utils/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import ProductList from "./pages/ProductList";
import ProductDetail from "./pages/ProductDetail";
import Simulator from "./pages/Simulator";
import DataUpload from "./pages/DataUpload";

function AppLayout({ children }) {
  return (
    <>
      <Navbar />
      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 16px" }}>
        {children}
      </main>
    </>
  );
}

const P = ({ children }) => (
  <ProtectedRoute><AppLayout>{children}</AppLayout></ProtectedRoute>
);

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/" element={<P><Home /></P>} />
          <Route path="/products" element={<P><ProductList /></P>} />
          <Route path="/product/:id" element={<P><ProductDetail /></P>} />
          <Route path="/simulator" element={<P><Simulator /></P>} />
          <Route path="/upload" element={<P><DataUpload /></P>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer position="bottom-right" autoClose={3000} theme="dark" />
      </BrowserRouter>
    </AuthProvider>
  );
}
