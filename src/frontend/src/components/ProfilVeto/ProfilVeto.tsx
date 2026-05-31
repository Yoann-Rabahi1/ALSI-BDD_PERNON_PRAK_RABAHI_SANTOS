import { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import './ProfilVeto.css';

interface Etablissement {
    id_etablissement: number;
    nom_etablissement: string;
    ville: string;
    adresse: string;
}

interface Props {
    userId: number;
    onClose: () => void;
    onSaved: (nom: string, prenom: string) => void;
}

const ProfilVeto = ({ userId, onClose, onSaved }: Props) => {
    const [nom, setNom] = useState('');
    const [prenom, setPrenom] = useState('');
    const [telephone, setTelephone] = useState('');

    const [villes, setVilles] = useState<string[]>([]);
    const [villeSelectionnee, setVilleSelectionnee] = useState('');
    const [etablissements, setEtablissements] = useState<Etablissement[]>([]);
    const [idEtablissement, setIdEtablissement] = useState<number | null>(null);
    const [etabActuel, setEtabActuel] = useState<Etablissement | null>(null);
    const [modeCreation, setModeCreation] = useState(false);
    const [newEtab, setNewEtab] = useState({ nom_etablissement: '', ville: '', adresse: '' });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Charge le profil existant
    useEffect(() => {
        const fetchProfil = async () => {
            try {
                const [vetoRes, villesRes] = await Promise.all([
                    api.get(`/veterinaires/me/${userId}`),
                    api.get('/etablissements/villes'),
                ]);
                const veto = vetoRes.data;
                setNom(veto.nom);
                setPrenom(veto.prenom);
                setTelephone(veto.telephone);
                setIdEtablissement(veto.id_etablissement ?? null);
                setVilles(villesRes.data);

                // Charge l'établissement actuel si présent
                if (veto.id_etablissement) {
                    const etabRes = await api.get(`/etablissements/?ville=`);
                    // On cherche l'étab dans tous les étabs
                    const allEtabs: Etablissement[] = etabRes.data;
                    const found = allEtabs.find((e: Etablissement) => e.id_etablissement === veto.id_etablissement);
                    if (found) {
                        setEtabActuel(found);
                        setVilleSelectionnee(found.ville);
                    }
                }
            } catch (err) {
                setError('Erreur lors du chargement du profil.');
            } finally {
                setLoading(false);
            }
        };
        fetchProfil();
    }, [userId]);

    // Charge les établissements quand la ville change
    useEffect(() => {
        if (!villeSelectionnee || villeSelectionnee === '__new__') {
            if (villeSelectionnee !== '') setEtablissements([]);
            return;
        }
        api.get(`/etablissements/?ville=${encodeURIComponent(villeSelectionnee)}`)
            .then(r => setEtablissements(r.data))
            .catch(() => {});
    }, [villeSelectionnee]);

    const handleCreateEtab = async () => {
        if (!newEtab.nom_etablissement || !newEtab.ville || !newEtab.adresse) {
            setError("Tous les champs de l'établissement sont requis.");
            return;
        }
        setError('');
        try {
            const res = await api.post('/etablissements/', newEtab);
            const created: Etablissement = res.data;
            setIdEtablissement(created.id_etablissement);
            setEtabActuel(created);
            setVilleSelectionnee(created.ville);
            setEtablissements(prev => {
                const exists = prev.find(e => e.id_etablissement === created.id_etablissement);
                return exists ? prev : [...prev, created];
            });
            setModeCreation(false);
            setNewEtab({ nom_etablissement: '', ville: '', adresse: '' });
            // Met à jour la liste des villes si nouvelle
            setVilles(prev => prev.includes(created.ville) ? prev : [...prev, created.ville]);
        } catch (err: any) {
            setError(err.response?.data?.detail || "Erreur création établissement.");
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSaving(true);
        try {
            await api.put(`/veterinaires/me/${userId}`, {
                nom,
                prenom,
                telephone,
                id_etablissement: idEtablissement,
            });

            // Met à jour le localStorage
            const savedUser = localStorage.getItem('user');
            if (savedUser) {
                const parsed = JSON.parse(savedUser);
                localStorage.setItem('user', JSON.stringify({ ...parsed, nom, prenom }));
            }

            setSuccess(true);
            onSaved(nom, prenom);
            setTimeout(() => { setSuccess(false); onClose(); }, 1200);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Erreur lors de la sauvegarde.');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="profil-overlay">
            <div className="profil-modal">
                <p className="profil-loading">Chargement...</p>
            </div>
        </div>
    );

    return (
        <div className="profil-overlay" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div className="profil-modal">
                <div className="profil-modal-header">
                    <h3>⚙️ Mon profil vétérinaire</h3>
                    <button className="profil-close" onClick={onClose}>✕</button>
                </div>

                <form onSubmit={handleSave} className="profil-form">

                    {/* Infos personnelles */}
                    <div className="profil-section">
                        <h4 className="profil-section-title">Informations personnelles</h4>
                        <div className="input-row">
                            <div className="input-field">
                                <label>Prénom</label>
                                <input type="text" value={prenom}
                                    onChange={e => setPrenom(e.target.value)} required />
                            </div>
                            <div className="input-field">
                                <label>Nom</label>
                                <input type="text" value={nom}
                                    onChange={e => setNom(e.target.value)} required />
                            </div>
                        </div>
                        <div className="input-field">
                            <label>Téléphone</label>
                            <input type="tel" value={telephone}
                                onChange={e => setTelephone(e.target.value)} required />
                        </div>
                    </div>

                    {/* Établissement */}
                    <div className="profil-section">
                        <h4 className="profil-section-title">🏥 Établissement</h4>

                        {/* Établissement actuel */}
                        {etabActuel && !modeCreation && (
                            <div className="etab-actuel">
                                <p><b>{etabActuel.nom_etablissement}</b></p>
                                <p>📍 {etabActuel.adresse}, {etabActuel.ville}</p>
                                <button type="button" className="btn-change-etab"
                                    onClick={() => { setEtabActuel(null); setIdEtablissement(null); }}>
                                    Changer d'établissement
                                </button>
                            </div>
                        )}

                        {/* Sélecteur ville → établissement */}
                        {!etabActuel && !modeCreation && (
                            <>
                                <div className="input-field">
                                    <label>Ville</label>
                                    <select value={villeSelectionnee}
                                        onChange={e => {
                                            setVilleSelectionnee(e.target.value);
                                            setIdEtablissement(null);
                                        }}>
                                        <option value="">— Choisir une ville —</option>
                                        {villes.map(v => (
                                            <option key={v} value={v}>{v}</option>
                                        ))}
                                        <option value="__new__">+ Nouvelle ville...</option>
                                    </select>
                                </div>

                                {villeSelectionnee && villeSelectionnee !== '__new__' && (
                                    <div className="input-field">
                                        <label>Établissement</label>
                                        <select
                                            value={idEtablissement ?? ''}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val === '__create__') { setModeCreation(true); return; }
                                                const id = Number(val);
                                                setIdEtablissement(id);
                                                const found = etablissements.find(et => et.id_etablissement === id);
                                                setEtabActuel(found ?? null);
                                            }}
                                        >
                                            <option value="">— Sélectionnez —</option>
                                            {etablissements.map(e => (
                                                <option key={e.id_etablissement} value={e.id_etablissement}>
                                                    {e.nom_etablissement} — {e.adresse}
                                                </option>
                                            ))}
                                            <option value="__create__">+ Créer un nouvel établissement</option>
                                        </select>
                                        {etablissements.length === 0 && (
                                            <p className="etab-hint">
                                                Aucun établissement.{' '}
                                                <span className="link-like" onClick={() => setModeCreation(true)}>
                                                    Créer →
                                                </span>
                                            </p>
                                        )}
                                    </div>
                                )}
                            </>
                        )}

                        {/* Formulaire création */}
                        {(modeCreation || villeSelectionnee === '__new__') && (
                            <div className="etab-create-form">
                                <p className="etab-create-title">Nouvel établissement</p>
                                <div className="input-field">
                                    <label>Nom de la clinique</label>
                                    <input type="text" value={newEtab.nom_etablissement}
                                        onChange={e => setNewEtab({ ...newEtab, nom_etablissement: e.target.value })}
                                        placeholder="Clinique des Lilas" />
                                </div>
                                <div className="input-row">
                                    <div className="input-field">
                                        <label>Ville</label>
                                        <input type="text" value={newEtab.ville}
                                            onChange={e => setNewEtab({ ...newEtab, ville: e.target.value })}
                                            placeholder="Paris" />
                                    </div>
                                    <div className="input-field">
                                        <label>Adresse</label>
                                        <input type="text" value={newEtab.adresse}
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
                    </div>

                    {error && <p className="profil-error">⚠️ {error}</p>}
                    {success && <p className="profil-success">✅ Profil mis à jour !</p>}

                    <div className="profil-actions">
                        <button type="submit" className="btn-save-profil" disabled={saving}>
                            {saving ? 'Sauvegarde...' : 'Enregistrer'}
                        </button>
                        <button type="button" className="btn-cancel-profil" onClick={onClose}>
                            Annuler
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfilVeto;