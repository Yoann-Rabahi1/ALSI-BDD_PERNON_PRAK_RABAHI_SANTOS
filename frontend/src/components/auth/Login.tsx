import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig'; 
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/login', {
                mail: email,
                mot_de_passe: password
            });
            
            // --- AJOUT : PERSISTENCE DES DONNÉES ---
            // On stocke l'objet user renvoyé par FastAPI dans le navigateur
            if (response.data.user) {
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }

            alert("Connexion réussie !");
            navigate('/dashboard'); 
        } catch (err: any) {
            console.error(err);
            alert("Email ou mot de passe incorrect.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <h2>Bon retour !</h2>
                    <p className="auth-subtitle">Connectez-vous à votre espace VetoApp</p>

                    <div className="input-field">
                        <label>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>

                    <div className="input-field">
                        <label>Mot de passe</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>

                    <button type="submit" className="btn-auth" disabled={loading}>
                        {loading ? "Vérification..." : "Se connecter"}
                    </button>

                    <p className="auth-footer">
                        Nouveau ici ? <Link to="/signup">Créer un compte</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;