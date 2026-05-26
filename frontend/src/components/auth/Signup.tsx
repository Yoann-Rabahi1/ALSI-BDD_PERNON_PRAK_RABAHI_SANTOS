import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';
import { registerUserFull } from '../../api/userService';

const Signup = () => {
    const navigate = useNavigate();
    
    // États pour les identifiants
    const [role, setRole] = useState('client');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    
    // États pour le profil (on les met ici pour tout envoyer d'un coup)
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [phone, setPhone] = useState('');
    
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            // On envoie TOUT au backend en une seule fois
            await registerUserFull({ 
                email, 
                password, 
                role, 
                nom, 
                prenom, 
                phone 
            });
            
            alert("Compte créé avec succès ! Connectez-vous.");
            navigate('/login');
        } catch (err: any) {
            console.error(err);
            alert(err.response?.data?.detail || "Erreur lors de l'inscription.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <h2>Rejoignez-nous</h2>
                    <p className="auth-subtitle">Créez votre profil en une seule étape</p>

                    <label className="label-role">Vous êtes :</label>
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

                    <div className="input-row">
                        <div className="input-field">
                            <label>Prénom</label>
                            <input type="text" value={prenom} onChange={e => setPrenom(e.target.value)} required placeholder="Yoann" />
                        </div>
                        <div className="input-field">
                            <label>Nom</label>
                            <input type="text" value={nom} onChange={e => setNom(e.target.value)} required placeholder="Rabahi" />
                        </div>
                    </div>

                    <div className="input-field">
                        <label>Téléphone</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="06..." />
                    </div>

                    <div className="input-field">
                        <label>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="nom@exemple.com" />
                    </div>

                    <div className="input-field">
                        <label>Mot de passe</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>

                    <button type="submit" className="btn-auth" disabled={loading}>
                        {loading ? "Création en cours..." : "S'inscrire"}
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