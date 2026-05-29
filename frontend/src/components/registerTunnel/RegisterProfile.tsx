import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import '../auth/Auth.css';

const RegisterProfile = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const { userId, role: roleFromState } = location.state || {};

    // Le rôle peut venir du state (login) ou être choisi ici
    const [selectedRole, setSelectedRole] = useState<'client' | 'veto'>(
        roleFromState === 'veto' ? 'veto' : 'client'
    );
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!userId) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <p style={{ textAlign: 'center', color: '#e74c3c' }}>
                        ⚠️ Session expirée ou accès invalide.
                    </p>
                    <button className="btn-auth" onClick={() => navigate('/login')}>
                        Retourner à la connexion
                    </button>
                </div>
            </div>
        );
    }

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (selectedRole === 'client') {
                // PUT — ligne proprio pré-créée vide à l'inscription
                await api.put(`/proprietaires/me/${userId}`, {
                    nom,
                    prenom,
                    telephone: phone,
                });
            } else {
                // POST — aucune ligne veto existante, on la crée
                await api.post(`/veterinaires/`, {
                    nom,
                    prenom,
                    telephone: phone,
                    id_user: userId,
                });
            }

            // Met à jour le localStorage
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                const parsed = JSON.parse(savedUser);
                localStorage.setItem('user', JSON.stringify({
                    ...parsed,
                    role: selectedRole,
                    has_profile: true,
                    nom,
                    prenom,
                }));
            }

            navigate('/dashboard');
        } catch (err: any) {
            setError(err.response?.data?.detail || "Erreur lors de l'enregistrement.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <form onSubmit={handleProfileSubmit} className="auth-form">
                    <h2>Finalisons votre profil</h2>
                    <p className="auth-subtitle">
                        Choisissez votre rôle et complétez vos informations.
                    </p>

                    {/* Sélecteur de rôle — toujours visible */}
                    <label className="label-role">Vous êtes :</label>
                    <div className="role-group">
                        <button
                            type="button"
                            className={`role-btn ${selectedRole === 'client' ? 'active' : ''}`}
                            onClick={() => setSelectedRole('client')}
                        >
                            🐾 Propriétaire
                        </button>
                        <button
                            type="button"
                            className={`role-btn ${selectedRole === 'veto' ? 'active' : ''}`}
                            onClick={() => setSelectedRole('veto')}
                        >
                            🩺 Vétérinaire
                        </button>
                    </div>

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

                    <div className="input-field">
                        <label>Téléphone</label>
                        <input
                            type="tel"
                            value={phone}
                            onChange={e => setPhone(e.target.value)}
                            required
                            placeholder="06 00 00 00 00"
                        />
                    </div>

                    {error && <p className="auth-error">⚠️ {error}</p>}

                    <button type="submit" className="btn-auth" disabled={loading}>
                        {loading ? 'Enregistrement...' : 'Valider mon profil'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterProfile;