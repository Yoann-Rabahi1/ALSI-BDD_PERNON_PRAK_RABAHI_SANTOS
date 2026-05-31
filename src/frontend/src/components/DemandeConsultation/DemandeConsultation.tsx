import { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import './DemandeConsultation.css';

interface Animal {
    id_animal: number;
    nom_animal: string;
    espece: string;
}

interface Veterinaire {
    id_veterinaire: number;
    nom: string;
    prenom: string;
    telephone: string;
    etablissement: {
        nom_etablissement: string;
        ville: string;
        adresse: string;
    } | null;
}

interface Props {
    idProprio: number;
    onConsultationAdded?: () => void;
    refreshKey?: number;
}

const DemandeConsultation = ({ idProprio, onConsultationAdded, refreshKey = 0 }: Props) => {
    const [animaux, setAnimaux] = useState<Animal[]>([]);
    const [villes, setVilles] = useState<string[]>([]);
    const [villeSelectionnee, setVilleSelectionnee] = useState('');
    const [veterinaires, setVeterinaires] = useState<Veterinaire[]>([]);
    const [loadingVetos, setLoadingVetos] = useState(false);

    const [idAnimal, setIdAnimal] = useState('');
    const [idVeto, setIdVeto] = useState('');
    const [dateConsult, setDateConsult] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    // Charge animaux + villes au montage
    useEffect(() => {
        const fetchInit = async () => {
            try {
                const [animauxRes, villesRes] = await Promise.all([
                    api.get(`/animaux/proprietaire/${idProprio}`),
                    api.get('/etablissements/villes'),
                ]);
                setAnimaux(animauxRes.data);
                setVilles(villesRes.data);
            } catch (err) {
                setError('Erreur lors du chargement des données.');
            } finally {
                setLoading(false);
            }
        };
        fetchInit();
    }, [idProprio, refreshKey]);

    // Charge les vétérinaires quand une ville est choisie
    useEffect(() => {
        if (!villeSelectionnee) { setVeterinaires([]); setIdVeto(''); return; }
        setLoadingVetos(true);
        setIdVeto('');
        api.get(`/veterinaires/ville/${encodeURIComponent(villeSelectionnee)}`)
            .then(r => setVeterinaires(r.data))
            .catch(() => setVeterinaires([]))
            .finally(() => setLoadingVetos(false));
    }, [villeSelectionnee]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            await api.post('/consultations', {
                date_consult: new Date(dateConsult).toISOString(),
                id_animal: parseInt(idAnimal),
                id_veterinaire: parseInt(idVeto),
                id_proprietaire: idProprio,
            });
            setIdAnimal('');
            setIdVeto('');
            setDateConsult('');
            setVilleSelectionnee('');
            setVeterinaires([]);
            setSuccess(true);
            onConsultationAdded?.();
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.response?.data?.detail || 'Erreur lors de la demande.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="consult-loader">Chargement...</div>;

    return (
        <div className="demande-consult-card">
            <h3>🗓️ Demander une consultation</h3>
            <p className="form-subtitle">Choisissez un animal, une ville et un vétérinaire</p>

            <form onSubmit={handleSubmit} className="demande-consult-form">

                {/* Animal */}
                <div className="input-group">
                    <label>Animal</label>
                    {animaux.length === 0 ? (
                        <p className="empty-hint">Ajoutez d'abord un animal 🐾</p>
                    ) : (
                        <select value={idAnimal} onChange={e => setIdAnimal(e.target.value)} required>
                            <option value="">— Sélectionnez —</option>
                            {animaux.map(a => (
                                <option key={a.id_animal} value={a.id_animal}>
                                    {a.nom_animal} ({a.espece || 'NC'})
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Ville */}
                <div className="input-group">
                    <label>Ville</label>
                    {villes.length === 0 ? (
                        <p className="empty-hint">Aucune ville disponible pour le moment.</p>
                    ) : (
                        <select
                            value={villeSelectionnee}
                            onChange={e => setVilleSelectionnee(e.target.value)}
                            required
                        >
                            <option value="">— Choisir une ville —</option>
                            {villes.map(v => (
                                <option key={v} value={v}>{v}</option>
                            ))}
                        </select>
                    )}
                </div>

                {/* Vétérinaire — conditionnel à la ville */}
                {villeSelectionnee && (
                    <div className="input-group">
                        <label>Vétérinaire</label>
                        {loadingVetos ? (
                            <p className="empty-hint">Chargement des vétérinaires...</p>
                        ) : veterinaires.length === 0 ? (
                            <p className="empty-hint">Aucun vétérinaire dans cette ville.</p>
                        ) : (
                            <select value={idVeto} onChange={e => setIdVeto(e.target.value)} required>
                                <option value="">— Sélectionnez —</option>
                                {veterinaires.map(v => (
                                    <option key={v.id_veterinaire} value={v.id_veterinaire}>
                                        Dr. {v.prenom} {v.nom}
                                        {v.etablissement ? ` — ${v.etablissement.nom_etablissement}` : ''}
                                    </option>
                                ))}
                            </select>
                        )}

                        {/* Fiche du veto sélectionné */}
                        {idVeto && (() => {
                            const veto = veterinaires.find(v => v.id_veterinaire === parseInt(idVeto));
                            if (!veto?.etablissement) return null;
                            return (
                                <div className="veto-info-card">
                                    <p>🏥 <b>{veto.etablissement.nom_etablissement}</b></p>
                                    <p>📍 {veto.etablissement.adresse}, {veto.etablissement.ville}</p>
                                    <p>📞 {veto.telephone}</p>
                                </div>
                            );
                        })()}
                    </div>
                )}

                {/* Date */}
                <div className="input-group">
                    <label>Date et heure</label>
                    <input
                        type="datetime-local"
                        value={dateConsult}
                        onChange={e => setDateConsult(e.target.value)}
                        required
                        min={new Date().toISOString().slice(0, 16)}
                    />
                </div>

                {success && <p className="form-success">✅ Consultation demandée !</p>}
                {error && <p className="form-error">⚠️ {error}</p>}

                <button
                    type="submit"
                    className="btn-add-animal"
                    disabled={submitting || animaux.length === 0 || !idVeto || !dateConsult}
                >
                    {submitting ? 'Envoi...' : 'Confirmer la demande'}
                </button>
            </form>
        </div>
    );
};

export default DemandeConsultation;