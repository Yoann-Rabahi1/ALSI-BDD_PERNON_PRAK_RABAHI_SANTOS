import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';
import api from '../../api/axiosConfig';

const Signup = () => {
    const navigate = useNavigate();

    const [role, setRole] = useState<'client' | 'veto'>('client');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Appel à la route unifiée POST /signup-full
            await api.post('/signup-full', {
                mail: email,
                mot_de_passe: password,
                role,
                nom,
                prenom,
                telephone: phone || '0000000000',
            });

            navigate('/login', {
                state: { message: 'Compte créé avec succès ! Connectez-vous.' }
            });
        } catch (err: any) {
            const detail = err.response?.data?.detail;
            setError(detail || "Une erreur est survenue lors de l'inscription.");
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

                    {/* Sélection du rôle */}
                    <label className="label-role">Vous êtes :</label>
                    <div className="role-group">
                        <button
                            type="button"
                            className={`role-btn ${role === 'client' ? 'active' : ''}`}
                            onClick={() => setRole('client')}
                        >
                            🐾 Propriétaire
                        </button>
                        <button
                            type="button"
                            className={`role-btn ${role === 'veto' ? 'active' : ''}`}
                            onClick={() => setRole('veto')}
                        >
                            🩺 Vétérinaire
                        </button>
                    </div>

                    {/* Nom / Prénom */}
                    <div className="input-row">
                        <div className="input-field">
                            <label>Prénom</label>
                            <input
                                type="text"
                                value={prenom}
                                onChange={e => setPrenom(e.target.value)}
                                required
                                placeholder="Yoann"
                            />
                        </div>
                        <div className="input-field">
                            <label>Nom</label>
                            <input
                                type="text"
                                value={nom}
                                onChange={e => setNom(e.target.value)}
                                required
                                placeholder="Rabahi"
                            />
                        </div>
                    </div>

                    {/* Téléphone — optionnel pour les vetos */}
                    <div className="input-field">
                        <label>
                            Téléphone{role === 'veto' ? ' (optionnel)' : ''}
                        </label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            required={role === 'client'}
                            placeholder="06..."
                        />
                    </div>

                    <div className="input-field">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            placeholder="nom@exemple.com"
                        />
                    </div>

                    <div className="input-field">
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <p className="auth-error">⚠️ {error}</p>
                    )}

                    <button type="submit" className="btn-auth" disabled={loading}>
                        {loading ? 'Création en cours...' : "S'inscrire"}
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