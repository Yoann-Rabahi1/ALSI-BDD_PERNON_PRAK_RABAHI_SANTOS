import React, { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './AddAnimal.css';

interface Props {
    onAnimalAdded?: () => void; // Callback déclenché après un ajout réussi
}

const AddAnimal = ({ onAnimalAdded }: Props) => {
    const [formData, setFormData] = useState({
        nom_animal: '',
        espece: '',
        race: '',
        age: '',
        poids_kg: ''
    });

    const [status, setStatus] = useState({
        loadingProfile: true,
        submitting: false,
        error: null as string | null,
        success: false,
    });

    const [idProprio, setIdProprio] = useState<number | null>(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (!savedUser.id_user) {
                setStatus(s => ({ ...s, loadingProfile: false, error: "Session expirée. Veuillez vous reconnecter." }));
                return;
            }
            try {
                const response = await api.get(`/proprietaires/me/${savedUser.id_user}`);
                setIdProprio(response.data.id_proprietaire);
                setStatus(s => ({ ...s, loadingProfile: false }));
            } catch (err: any) {
                setStatus(s => ({
                    ...s,
                    loadingProfile: false,
                    error: "Profil propriétaire introuvable. Avez-vous terminé votre inscription ?"
                }));
            }
        };
        fetchProfile();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!idProprio) return;

        setStatus(s => ({ ...s, submitting: true, error: null, success: false }));

        try {
            await api.post('/animaux/', {
                nom_animal: formData.nom_animal,
                espece: formData.espece || null,
                race: formData.race || null,
                age: formData.age !== '' ? parseInt(formData.age) : null,
                poids_kg: formData.poids_kg !== '' ? parseFloat(formData.poids_kg) : null,
                id_proprietaire: idProprio
            });

            // Réinitialise le formulaire
            setFormData({ nom_animal: '', espece: '', race: '', age: '', poids_kg: '' });
            setStatus(s => ({ ...s, submitting: false, success: true }));

            // Notifie le Dashboard pour rafraîchir AnimalList
            onAnimalAdded?.();

            // Efface le message de succès après 3s
            setTimeout(() => setStatus(s => ({ ...s, success: false })), 3000);

        } catch (err: any) {
            setStatus(s => ({
                ...s,
                submitting: false,
                error: err.response?.data?.detail || "Erreur lors de l'ajout de l'animal."
            }));
        }
    };

    if (status.loadingProfile) return <div className="loader">Vérification de votre profil...</div>;
    if (status.error && !idProprio) return <div className="error-msg">⚠️ {status.error}</div>;

    return (
        <div className="add-animal-container">
            <div className="add-animal-card">
                <form onSubmit={handleSubmit} className="add-animal-form">
                    <h3>🐾 Nouveau compagnon</h3>
                    <p className="form-subtitle">Renseignez les informations de votre animal</p>

                    <div className="input-group">
                        <label>Nom de l'animal</label>
                        <input
                            type="text"
                            placeholder="Ex: Rex, Félix..."
                            value={formData.nom_animal}
                            onChange={e => setFormData({ ...formData, nom_animal: e.target.value })}
                            required
                        />
                    </div>

                    <div className="input-row">
                        <div className="input-group">
                            <label>Espèce</label>
                            <input
                                type="text"
                                placeholder="Ex: Chien, Chat..."
                                value={formData.espece}
                                onChange={e => setFormData({ ...formData, espece: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label>Race</label>
                            <input
                                type="text"
                                placeholder="Ex: Golden Retriever..."
                                value={formData.race}
                                onChange={e => setFormData({ ...formData, race: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="input-row">
                        <div className="input-group">
                            <label>Âge (ans)</label>
                            <input
                                type="number"
                                placeholder="Ex: 5"
                                value={formData.age}
                                onChange={e => setFormData({ ...formData, age: e.target.value })}
                                min={0}
                            />
                        </div>
                        <div className="input-group">
                            <label>Poids (kg)</label>
                            <input
                                type="number"
                                step="0.1"
                                placeholder="Ex: 12.5"
                                value={formData.poids_kg}
                                onChange={e => setFormData({ ...formData, poids_kg: e.target.value })}
                                min={0}
                            />
                        </div>
                    </div>

                    {/* Feedback inline — plus d'alert() */}
                    {status.success && (
                        <p className="form-success">✅ Animal ajouté avec succès !</p>
                    )}
                    {status.error && (
                        <p className="form-error">⚠️ {status.error}</p>
                    )}

                    <button type="submit" className="btn-add-animal" disabled={status.submitting}>
                        {status.submitting ? "Enregistrement..." : "Enregistrer l'animal"}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default AddAnimal;