import { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import './AnimalList.css';

interface Animal {
    id_animal: number;
    nom_animal: string;
    espece: string;
    race: string;
    age: number | null;
    poids_kg: number | null;
}

interface AnimalEditForm {
    nom_animal: string;
    espece: string;
    race: string;
    age: string;
    poids_kg: string;
}

interface Props {
    refreshKey?: number; // Chaque changement de valeur déclenche un re-fetch
}

const animalToForm = (animal: Animal): AnimalEditForm => ({
    nom_animal: animal.nom_animal ?? '',
    espece: animal.espece ?? '',
    race: animal.race ?? '',
    age: animal.age != null ? String(animal.age) : '',
    poids_kg: animal.poids_kg != null ? String(animal.poids_kg) : '',
});

const AnimalList = ({ refreshKey = 0 }: Props) => {
    const [animaux, setAnimaux] = useState<Animal[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState<AnimalEditForm>({
        nom_animal: '', espece: '', race: '', age: '', poids_kg: ''
    });
    const [loading, setLoading] = useState(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

    const fetchAnimaux = async () => {
        try {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const profileRes = await api.get(`/proprietaires/me/${savedUser.id_user}`);
            const idProprio = profileRes.data.id_proprietaire;
            const res = await api.get(`/animaux/proprietaire/${idProprio}`);
            setAnimaux(res.data);
        } catch (err) {
            console.error("Erreur fetch animaux:", err);
        } finally {
            setLoading(false);
        }
    };

    // Se déclenche au mount ET à chaque fois que refreshKey change
    useEffect(() => {
        setLoading(true);
        fetchAnimaux();
    }, [refreshKey]);

    const handleEditClick = (animal: Animal) => {
        setEditingId(animal.id_animal);
        setEditFormData(animalToForm(animal));
        setSaveStatus('idle');
    };

    const handleCancel = () => {
        setEditingId(null);
        setSaveStatus('idle');
    };

    const handleDelete = async (id: number, nom: string) => {
        if (!window.confirm(`Supprimer ${nom} définitivement ?`)) return;
        try {
            await api.delete(`/animaux/${id}`);
            setAnimaux(prev => prev.filter(a => a.id_animal !== id));
        } catch (err) {
            alert("Erreur lors de la suppression.");
        }
    };

    const handleSave = async (id: number) => {
        setSaveStatus('saving');
        try {
            const payload = {
                nom_animal: editFormData.nom_animal,
                espece: editFormData.espece || null,
                race: editFormData.race || null,
                age: editFormData.age === '' ? null : Number(editFormData.age),
                poids_kg: editFormData.poids_kg === '' ? null : Number(editFormData.poids_kg),
            };
            const res = await api.put(`/animaux/${id}`, payload);

            // Mise à jour locale immédiate — pas besoin de re-fetch
            setAnimaux(prev => prev.map(a => a.id_animal === id ? res.data : a));
            setSaveStatus('success');
            setTimeout(() => {
                setEditingId(null);
                setSaveStatus('idle');
            }, 1200);
        } catch (err) {
            setSaveStatus('error');
        }
    };

    if (loading) return <div className="animal-list-loading">Chargement de vos animaux...</div>;

    return (
        <div className="animal-list-container">
            <h3>Mes Animaux {animaux.length > 0 && <span className="animal-count">{animaux.length}</span>}</h3>

            {animaux.length === 0 ? (
                <div className="animal-empty">
                    <p>Vous n'avez pas encore ajouté d'animal. 🐾</p>
                </div>
            ) : (
                <div className="animal-grid">
                    {animaux.map((animal) => (
                        <div key={animal.id_animal} className="animal-card">
                            {editingId === animal.id_animal ? (
                                <div className="edit-mode">
                                    <input
                                        type="text"
                                        value={editFormData.nom_animal}
                                        onChange={e => setEditFormData({ ...editFormData, nom_animal: e.target.value })}
                                        placeholder="Nom"
                                    />
                                    <input
                                        type="text"
                                        value={editFormData.espece}
                                        onChange={e => setEditFormData({ ...editFormData, espece: e.target.value })}
                                        placeholder="Espèce"
                                    />
                                    <input
                                        type="text"
                                        value={editFormData.race}
                                        onChange={e => setEditFormData({ ...editFormData, race: e.target.value })}
                                        placeholder="Race"
                                    />
                                    <input
                                        type="number"
                                        value={editFormData.age}
                                        onChange={e => setEditFormData({ ...editFormData, age: e.target.value })}
                                        placeholder="Âge"
                                        min={0}
                                    />
                                    <input
                                        type="number"
                                        step="0.1"
                                        value={editFormData.poids_kg}
                                        onChange={e => setEditFormData({ ...editFormData, poids_kg: e.target.value })}
                                        placeholder="Poids (kg)"
                                        min={0}
                                    />

                                    {saveStatus === 'error' && (
                                        <p className="save-error">⚠️ Erreur lors de la sauvegarde</p>
                                    )}
                                    {saveStatus === 'success' && (
                                        <p className="save-success">✅ Mis à jour !</p>
                                    )}

                                    <div className="btn-group">
                                        <button
                                            onClick={() => handleSave(animal.id_animal)}
                                            className="btn-save"
                                            disabled={saveStatus === 'saving'}
                                        >
                                            {saveStatus === 'saving' ? 'Sauvegarde...' : 'Valider'}
                                        </button>
                                        <button onClick={handleCancel} className="btn-cancel">
                                            Annuler
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="view-mode">
                                    <h4>{animal.nom_animal}</h4>
                                    <p><b>Espèce :</b> {animal.espece || 'NC'}</p>
                                    <p><b>Race :</b> {animal.race || 'NC'}</p>
                                    <p><b>Âge :</b> {animal.age !== null ? `${animal.age} ans` : 'NC'}</p>
                                    <p><b>Poids :</b> {animal.poids_kg !== null ? `${animal.poids_kg} kg` : 'NC'}</p>
                                    <div className="btn-group">
                                        <button onClick={() => handleEditClick(animal)} className="btn-edit">
                                            Modifier
                                        </button>
                                        <button onClick={() => handleDelete(animal.id_animal, animal.nom_animal)} className="btn-delete">
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AnimalList;