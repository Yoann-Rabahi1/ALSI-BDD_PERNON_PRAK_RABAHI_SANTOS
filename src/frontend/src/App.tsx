import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import RegisterProfile from "./components/registerTunnel/RegisterProfile"; 
import Dashboard from "./components/dashboard/Dashboard";
import AdminPannel from "./components/AdminPannel/AdminPannel"; 
import type { JSX } from 'react';

// Composant de sécurité pour protéger la route Admin
const AdminRoute = ({ children }: { children: JSX.Element }) => {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    // Si l'utilisateur n'est pas admin, on le redirige vers le dashboard
    if (!user || user.role !== 'admin') {
        return <Navigate to="/dashboard" replace />;
    }
    
    return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirection automatique vers le login */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Authentification */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Tunnel d'inscription */}
        <Route path="/register-profile" element={<RegisterProfile />} />

        {/* Espace Utilisateur (Vétos / Propriétaires) */}
        <Route path="/dashboard" element={<Dashboard />} />

        {/* Console SQL protégée - Accessible uniquement par l'Admin */}
        <Route 
            path="/admin" 
            element={
                <AdminRoute>
                    <AdminPannel />
                </AdminRoute>
            } 
        />

        {/* Redirection pour les routes inconnues */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;