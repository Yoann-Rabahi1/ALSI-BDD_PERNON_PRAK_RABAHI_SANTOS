import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createProprietaireProfile } from '../../api/userService';
import '../auth/Auth.css'; // On réutilise le style commun

const RegisterProfile = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // On récupère les données passées par Signup.tsx
    // userId est l'ID généré par la BDD pour le compte_user
    const { userId, role } = location.state || {}; 

    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    // Sécurité : si on tente d'accéder à la page sans être passé par Signup
    if (!userId) {
        return (
            <div className="auth-container">
                <div className="auth-card">
                    <p style={{textAlign: 'center', color: '#e74c3c'}}>
                        ⚠️ Session d'inscription expirée ou invalide.
                    </p>
                    <button className="btn-auth" onClick={() => navigate('/signup')}>
                        Retourner à l'étape 1
                    </button>
                </div>
            </div>
        );
    }

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Logique différente selon le rôle choisi à l'étape 1
            if (role === 'client') {
                await createProprietaireProfile(userId, nom, prenom, phone);
                alert("Votre profil Propriétaire est prêt !");
            } else {
                // Ici tu pourras appeler createVetoProfile plus tard
                alert("Profil Vétérinaire enregistré !");
            }
            
            // Une fois terminé, on redirige vers la connexion
            navigate('/login');
        } catch (err) {
            alert("Erreur lors de l'enregistrement du profil. Vérifiez votre connexion.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <form onSubmit={handleProfileSubmit} className="auth-form">
                    <h2>Dernière étape</h2>
                    <p className="auth-subtitle">
                        Complétez vos informations pour finaliser votre inscription {role === 'veto' ? 'vétérinaire' : 'propriétaire'}.
                    </p>

                    <div className="input-field">
                        <label>Prénom</label>
                        <input 
                            type="text" 
                            value={prenom} 
                            onChange={e => setPrenom(e.target.value)} 
                            required 
                            placeholder="Ex: Jean"
                        />
                    </div>

                    <div className="input-field">
                        <label>Nom</label>
                        <input 
                            type="text" 
                            value={nom} 
                            onChange={e => setNom(e.target.value)} 
                            required 
                            placeholder="Ex: Dupont"
                        />
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

                    <button type="submit" className="btn-auth" disabled={loading}>
                        {loading ? "Enregistrement..." : "Terminer l'inscription"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterProfile;