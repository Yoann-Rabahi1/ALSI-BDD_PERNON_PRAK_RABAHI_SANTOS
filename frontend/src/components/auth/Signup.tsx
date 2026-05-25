import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createAccount } from '../../api/userService'; // Import de l'API
import './Auth.css';

const Signup = () => {
    const [role, setRole] = useState('client');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false); // État pour bloquer le bouton
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // APPEL RÉEL À L'API
            const user = await createAccount(email, password, role);
            
            // On passe l'ID utilisateur récupéré à l'étape suivante
            navigate('/register-profile', { 
                state: { 
                    userId: user.id_user, 
                    role: role 
                } 
            });
        } catch (err: any) {
            console.error(err);
            alert("Erreur lors de la création du compte. L'email est peut-être déjà utilisé.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <h2>Rejoignez-nous</h2>
                    <p className="auth-subtitle">Créez votre compte en quelques secondes</p>

                    <label style={{fontSize: '0.9rem', marginBottom: '8px', display: 'block'}}>Vous êtes :</label>
                    <div className="role-group">
                        <button 
                            type="button" 
                            className={`role-btn ${role === 'client' ? 'active' : ''}`}
                            onClick={() => setRole('client')}
                        >🐾 Propriétaire</button>
                        <button 
                            type="button" 
                            className={`role-btn ${role === 'veto' ? 'active' : ''}`}
                            onClick={() => setRole('veto')}
                        >🩺 Vétérinaire</button>
                    </div>

                    <div className="input-field">
                        <label>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>

                    <div className="input-field">
                        <label>Mot de passe</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>

                    <button type="submit" className="btn-auth" disabled={loading}>
                        {loading ? "Création..." : "Continuer"}
                    </button>

                    <p className="auth-footer">
                        Déjà inscrit ? <Link to="/login">Se connecter</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Signup;