import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig'; 
import '../auth/Auth.css';

const RegisterProfile = () => {
    const location = useLocation();
    const navigate = useNavigate();
    
    // Récupération de l'ID et du rôle transmis par Signup.tsx
    const { userId, role } = location.state || {}; 

    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    // Sécurité si accès direct sans inscription préalable
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
        
        const profileData = {
            nom: nom,
            prenom: prenom,
            telephone: phone,
            id_user: userId
        };

        try {
            if (role === 'client') {
                // On utilise PUT car la ligne avec l'id_user existe déjà en BDD (Trigger ou Auto-création)
                // On vient "écraser" les valeurs par défaut
                await api.put(`/proprietaires/me/${userId}`, profileData);
                alert("Super Yoann, ton profil est maintenant complet ! 🐾");
            } else {
                // Logique pour les vétérinaires (à adapter selon ta route veto)
                await api.put(`/vetos/me/${userId}`, profileData);
                alert("Profil Vétérinaire enregistré !");
            }
            
            // Redirection vers le login pour rafraîchir la session avec les nouvelles infos
            navigate('/login');
        } catch (err: any) {
            console.error(err);
            const errorMsg = err.response?.data?.detail || "Erreur lors de l'enregistrement.";
            alert(`Erreur : ${errorMsg}`);
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
                        On y est presque ! Plus que quelques infos pour personnaliser votre espace {role === 'veto' ? 'vétérinaire' : 'propriétaire'}.
                    </p>

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
                        {loading ? "Mise à jour..." : "Valider mon profil"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterProfile;