import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from "./components/auth/Login";
import Signup from "./components/auth/Signup";
import RegisterProfile from "./components/registerTunnel/RegisterProfile"; 
import Dashboard from "./components/dashboard/Dashboard";

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirection automatique vers le login quand on arrive sur le site */}
        <Route path="/" element={<Navigate to="/login" />} />

        {/* Page de Connexion */}
        <Route path="/login" element={<Login />} />

        {/* Étape 1 : Création du compte (Email/MDP/Rôle) */}
        <Route path="/signup" element={<Signup />} />

        
        <Route path="/register-profile" element={<RegisterProfile />} />

        <Route path="/dashboard" element={<Dashboard />} />


      </Routes>
    </Router>
  );
}

export default App;