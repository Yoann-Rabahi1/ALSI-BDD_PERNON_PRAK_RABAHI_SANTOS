import React, { useState } from 'react';
import { createAccount, createProprietaireProfile } from '../api/userService';

const RegisterTunnel = () => {
    const [step, setStep] = useState(1);
    const [userId, setUserId] = useState<number | null>(null);
    const [loading, setLoading] = useState(false); // État de chargement

    // États pour les formulaires
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [phone, setPhone] = useState('');

    // Étape 1 : Création du compte
    const handleAccountSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true); // On commence le chargement
        try {
            const user = await createAccount(email, password);
            setUserId(user.id_user);
            setStep(2);
        } catch (err) {
            alert("Erreur lors de la création du compte (l'email existe peut-être déjà)");
        } finally {
            setLoading(false); // On arrête le chargement quoi qu'il arrive
        }
    };

    // Étape 2 : Création du profil
    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        setLoading(true);
        try {
            await createProprietaireProfile(userId, nom, prenom, phone);
            alert("Inscription terminée avec succès !");
            // Redirection vers le dashboard après succès
            // navigate('/dashboard'); 
        } catch (err) {
            alert("Erreur lors de la création du profil");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
            {step === 1 ? (
                <form onSubmit={handleAccountSubmit}>
                    <h2>Étape 1 : Votre compte</h2>
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required />
                    
                    {/* Bouton avec état de chargement */}
                    <button type="submit" disabled={loading}>
                        {loading ? "Création..." : "Suivant"}
                    </button>
                </form>
            ) : (
                <form onSubmit={handleProfileSubmit}>
                    <h2>Étape 2 : Vos informations</h2>
                    <p>ID utilisateur lié : <strong>{userId}</strong></p>
                    <input type="text" placeholder="Nom" value={nom} onChange={e => setNom(e.target.value)} required />
                    <input type="text" placeholder="Prénom" value={prenom} onChange={e => setPrenom(e.target.value)} required />
                    <input type="text" placeholder="Téléphone" value={phone} onChange={e => setPhone(e.target.value)} required />
                    
                    {/* Bouton de validation finale */}
                    <button type="submit" disabled={loading}>
                        {loading ? "Enregistrement..." : "Terminer l'inscription"}
                    </button>
                </form>
            )}
        </div>
    );
};

export default RegisterTunnel;