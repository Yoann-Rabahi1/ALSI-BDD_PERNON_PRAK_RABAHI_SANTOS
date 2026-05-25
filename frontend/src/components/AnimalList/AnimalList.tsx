import React, { useEffect, useState } from 'react';
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

// Interface séparée pour le formulaire : age et poids_kg sont des strings
// pour permettre la saisie intermédiaire (ex: "1.5" en cours de frappe)
interface AnimalEditForm {
    nom_animal: string;
    espece: string;
    race: string;
    age: string;
    poids_kg: string;
}

const animalToForm = (animal: Animal): AnimalEditForm => ({
    nom_animal: animal.nom_animal ?? '',
    espece: animal.espece ?? '',
    race: animal.race ?? '',
    age: animal.age != null ? String(animal.age) : '',
    poids_kg: animal.poids_kg != null ? String(animal.poids_kg) : '',
});

const AnimalList = () => {
    const [animaux, setAnimaux] = useState<Animal[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState<AnimalEditForm>({
        nom_animal: '', espece: '', race: '', age: '', poids_kg: ''
    });
    const [loading, setLoading] = useState(true);

    const fetchAnimaux = async () => {
        try {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const profileRes = await api.get(`/proprietaires/me/${savedUser.id_user}`);
            const idProprio = profileRes.data.id_proprietaire;
            const res = await api.get(`/animaux/proprietaire/${idProprio}`);
            setAnimaux(res.data);
        } catch (err) {
            console.error("Erreur fetch:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAnimaux(); }, []);

    const handleEditClick = (animal: Animal) => {
        setEditingId(animal.id_animal);
        setEditFormData(animalToForm(animal));
    };

    const handleSave = async (id: number) => {
        try {
            const payload = {
                nom_animal: editFormData.nom_animal,
                espece: editFormData.espece || null,
                race: editFormData.race || null,
                // Conversion string → number uniquement au moment d'envoyer
                age: editFormData.age === '' ? null : Number(editFormData.age),
                poids_kg: editFormData.poids_kg === '' ? null : Number(editFormData.poids_kg),
            };
            await api.put(`/animaux/${id}`, payload);
            setEditingId(null);
            fetchAnimaux();
            alert("Compagnon mis à jour !");
        } catch (err) {
            alert("Erreur lors de la sauvegarde");
        }
    };

    if (loading) return <div>Chargement...</div>;

    return (
        <div className="animal-list-container">
            <h3>Mes Animaux</h3>
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
                                {/* age et poids_kg : value est une string, pas de conflit de type */}
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
                                <div className="btn-group">
                                    <button onClick={() => handleSave(animal.id_animal)} className="btn-save">Valider</button>
                                    <button onClick={() => setEditingId(null)} className="btn-cancel">Annuler</button>
                                </div>
                            </div>
                        ) : (
                            <div className="view-mode">
                                <h4>{animal.nom_animal}</h4>
                                <p><b>Espèce:</b> {animal.espece}</p>
                                <p><b>Race:</b> {animal.race || 'NC'}</p>
                                <p><b>Âge:</b> {animal.age !== null ? `${animal.age} ans` : 'NC'}</p>
                                <p><b>Poids:</b> {animal.poids_kg !== null ? `${animal.poids_kg} kg` : 'NC'}</p>
                                <button onClick={() => handleEditClick(animal)} className="btn-edit">Modifier</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AnimalList;