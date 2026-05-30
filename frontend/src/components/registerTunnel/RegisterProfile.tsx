import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import '../auth/Auth.css';
//import './RegisterProfile.css';

interface Etablissement {
    id_etablissement: number;
    nom_etablissement: string;
    ville: string;
    adresse: string;
}

const RegisterProfile = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { userId, role: roleFromState } = location.state || {};

    const [selectedRole, setSelectedRole] = useState<'client' | 'veto'>(
        roleFromState === 'veto' ? 'veto' : 'client'
    );
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // — États établissement (veto uniquement) —
    const [villes, setVilles] = useState<string[]>([]);
    const [villeSelectionnee, setVilleSelectionnee] = useState('');
    const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
    const [idEtablissement, setIdEtablissement] = useState<number | null>(null);
    const [modeCreation, setModeCreation] = useState(false);
    const [newEtab, setNewEtab] = useState({ nom_etablissement: '', ville: '', adresse: '' });

    // Charge les villes au montage (si rôle veto)
    useEffect(() => {
        if (selectedRole === 'veto') {
            api.get('/etablissements/villes')
                .then(r => setVilles(r.data))
                .catch(() => {});
        }
        // Reset établissement si on change de rôle
        setIdEtablissement(null);
        setVilleSelectionnee('');
        setEtablissements([]);
        setModeCreation(false);
    }, [selectedRole]);

    // Charge les établissements quand une ville est choisie
    useEffect(() => {
        if (!villeSelectionnee) { setEtablissements([]); return; }
        api.get(`/etablissements/?ville=${encodeURIComponent(villeSelectionnee)}`)
            .then(r => setEtablissements(r.data))
            .catch(() => {});
    }, [villeSelectionnee]);

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

    const handleCreateEtab = async () => {
        if (!newEtab.nom_etablissement || !newEtab.ville || !newEtab.adresse) {
            setError('Tous les champs de l\'établissement sont requis.');
            return;
        }
        setError('');
        try {
            const res = await api.post('/etablissements/', newEtab);
            const created: Etablissement = res.data;
            setIdEtablissement(created.id_etablissement);
            setVilleSelectionnee(created.ville);
            setEtablissements(prev => [...prev, created]);
            setModeCreation(false);
            setNewEtab({ nom_etablissement: '', ville: '', adresse: '' });
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Erreur création établissement.');
        }
    };

    const handleProfileSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (selectedRole === 'veto' && !idEtablissement) {
            setError('Veuillez sélectionner ou créer un établissement.');
            return;
        }

        setLoading(true);
        try {
            if (selectedRole === 'client') {
                await api.put(`/proprietaires/me/${userId}`, { nom, prenom, telephone: phone });
            } else {
                await api.put(`/veterinaires/me/${userId}`, {
                    nom,
                    prenom,
                    telephone: phone,
                    id_etablissement: idEtablissement,
                });
            }

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
            <div className="auth-card register-profile-card">
                <form onSubmit={handleProfileSubmit} className="auth-form">
                    <h2>Finalisons votre profil</h2>
                    <p className="auth-subtitle">
                        Choisissez votre rôle et complétez vos informations.
                    </p>

                    {/* Sélecteur de rôle */}
                    <label className="label-role">Vous êtes :</label>
                    <div className="role-group">
                        <button type="button"
                            className={`role-btn ${selectedRole === 'client' ? 'active' : ''}`}
                            onClick={() => setSelectedRole('client')}>
                            🐾 Propriétaire
                        </button>
                        <button type="button"
                            className={`role-btn ${selectedRole === 'veto' ? 'active' : ''}`}
                            onClick={() => setSelectedRole('veto')}>
                            🩺 Vétérinaire
                        </button>
                    </div>

                    {/* Nom / Prénom */}
                    <div className="input-row">
                        <div className="input-field">
                            <label>Prénom</label>
                            <input type="text" value={prenom}
                                onChange={e => setPrenom(e.target.value)} required placeholder="Yoann" />
                        </div>
                        <div className="input-field">
                            <label>Nom</label>
                            <input type="text" value={nom}
                                onChange={e => setNom(e.target.value)} required placeholder="Rabahi" />
                        </div>
                    </div>

                    <div className="input-field">
                        <label>Téléphone</label>
                        <input type="tel" value={phone}
                            onChange={e => setPhone(e.target.value)} required placeholder="06 00 00 00 00" />
                    </div>

                    {/* ── SECTION ÉTABLISSEMENT (veto uniquement) ── */}
                    {selectedRole === 'veto' && (
                        <div className="etab-section">
                            <h4 className="etab-title">🏥 Votre établissement</h4>

                            {/* Étape 1 : choisir une ville existante */}
                            <div className="input-field">
                                <label>Ville</label>
                                <div className="ville-row">
                                    <select
                                        value={villeSelectionnee}
                                        onChange={e => {
                                            setVilleSelectionnee(e.target.value);
                                            setIdEtablissement(null);
                                            setModeCreation(false);
                                        }}
                                    >
                                        <option value="">— Choisir une ville —</option>
                                        {villes.map(v => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                        <option value="__new__">+ Autre ville...</option>
                                    </select>
                                </div>
                            </div>

                            {/* Étape 2a : établissements de cette ville */}
                            {villeSelectionnee && villeSelectionnee !== '__new__' && !modeCreation && (
                                <div className="input-field">
                                    <label>Établissement</label>
                                    <select
                                        value={idEtablissement ?? ''}
                                        onChange={e => setIdEtablissement(Number(e.target.value))}
                                        required
                                    >
                                        <option value="">— Sélectionnez —</option>
                                        {etablissements.map(e => (
                                            <option key={e.id_etablissement} value={e.id_etablissement}>
                                                {e.nom_etablissement} — {e.adresse}
                                            </option>
                                        ))}
                                        <option value="__create__">+ Créer un nouvel établissement</option>
                                    </select>
                                    {idEtablissement === null &&
                                        (etablissements.length === 0) && (
                                        <p className="etab-hint">
                                            Aucun établissement dans cette ville.{' '}
                                            <span className="link-like" onClick={() => setModeCreation(true)}>
                                                Créer le premier →
                                            </span>
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* Déclenchement du mode création via le select */}
                            {idEtablissement?.toString() === '__create__' && !modeCreation && (
                                <>{setModeCreation(true) as any}</>
                            )}

                            {/* Étape 2b : formulaire de création d'établissement */}
                            {(modeCreation || villeSelectionnee === '__new__') && (
                                <div className="etab-create-form">
                                    <p className="etab-create-title">Nouvel établissement</p>
                                    <div className="input-field">
                                        <label>Nom de la clinique</label>
                                        <input type="text"
                                            value={newEtab.nom_etablissement}
                                            onChange={e => setNewEtab({ ...newEtab, nom_etablissement: e.target.value })}
                                            placeholder="Clinique des Lilas" />
                                    </div>
                                    <div className="input-row">
                                        <div className="input-field">
                                            <label>Ville</label>
                                            <input type="text"
                                                value={newEtab.ville}
                                                onChange={e => setNewEtab({ ...newEtab, ville: e.target.value })}
                                                placeholder="Paris" />
                                        </div>
                                        <div className="input-field">
                                            <label>Adresse</label>
                                            <input type="text"
                                                value={newEtab.adresse}
                                                onChange={e => setNewEtab({ ...newEtab, adresse: e.target.value })}
                                                placeholder="12 rue des Fleurs" />
                                        </div>
                                    </div>
                                    <div className="etab-create-actions">
                                        <button type="button" className="btn-confirm-etab" onClick={handleCreateEtab}>
                                            Créer l'établissement
                                        </button>
                                        <button type="button" className="btn-cancel-etab"
                                            onClick={() => { setModeCreation(false); setVilleSelectionnee(''); }}>
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Confirmation établissement sélectionné */}
                            {idEtablissement && !modeCreation && (
                                <div className="etab-confirmed">
                                    ✅ Établissement enregistré
                                </div>
                            )}
                        </div>
                    )}

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