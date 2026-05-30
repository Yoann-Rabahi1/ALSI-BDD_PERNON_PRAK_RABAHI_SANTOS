import { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import './DemandeConsultation.css'

interface Animal {
    id_animal: number;
    nom_animal: string;
    espece: string;
}

interface Veterinaire {
    id_veterinaire: number;
    nom: string;
    prenom: string;
}

interface Props {
    idProprio: number;
    onConsultationAdded?: () => void;
}

const DemandeConsultation = ({ idProprio, onConsultationAdded }: Props) => {
    const [animaux, setAnimaux] = useState<Animal[]>([]);
    const [veterinaires, setVeterinaires] = useState<Veterinaire[]>([]);
    const [idAnimal, setIdAnimal] = useState('');
    const [idVeto, setIdVeto] = useState('');
    const [dateConsult, setDateConsult] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [animauxRes, vetosRes] = await Promise.all([
                    api.get(`/animaux/proprietaire/${idProprio}`),
                    api.get('/veterinaires'),
                ]);
                setAnimaux(animauxRes.data);
                setVeterinaires(vetosRes.data);
            } catch (err) {
                setError('Erreur lors du chargement des données.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [idProprio]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSubmitting(true);

        try {
            await api.post('/consultations/', {
                date_consult: new Date(dateConsult).toISOString(),
                id_animal: parseInt(idAnimal),
                id_veterinaire: parseInt(idVeto),
                id_proprietaire: idProprio, // Requis par ton schéma ConsultationCreate
            });

            setIdAnimal('');
            setIdVeto('');
            setDateConsult('');
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
            <p className="form-subtitle">Choisissez un animal, un vétérinaire et une date</p>

            <form onSubmit={handleSubmit} className="demande-consult-form">
                <div className="input-group">
                    <label>Animal</label>
                    {animaux.length === 0 ? (
                        <p className="empty-hint">Ajoutez d'abord un animal 🐾</p>
                    ) : (
                        <select
                            value={idAnimal}
                            onChange={e => setIdAnimal(e.target.value)}
                            required
                        >
                            <option value="">— Sélectionnez —</option>
                            {animaux.map(a => (
                                <option key={a.id_animal} value={a.id_animal}>
                                    {a.nom_animal} ({a.espece || 'NC'})
                                </option>
                            ))}
                        </select>
                    )}
                </div>

                <div className="input-group">
                    <label>Vétérinaire</label>
                    {veterinaires.length === 0 ? (
                        <p className="empty-hint">Aucun vétérinaire disponible.</p>
                    ) : (
                        <select
                            value={idVeto}
                            onChange={e => setIdVeto(e.target.value)}
                            required
                        >
                            <option value="">— Sélectionnez —</option>
                            {veterinaires.map(v => (
                                <option key={v.id_veterinaire} value={v.id_veterinaire}>
                                    Dr. {v.prenom} {v.nom}
                                </option>
                            ))}
                        </select>
                    )}
                </div>

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
                    disabled={submitting || animaux.length === 0 || veterinaires.length === 0}
                >
                    {submitting ? 'Envoi...' : 'Confirmer la demande'}
                </button>
            </form>
        </div>
    );
};

export default DemandeConsultation;