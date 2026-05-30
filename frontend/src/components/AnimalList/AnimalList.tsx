import React, { useEffect, useState, useMemo } from 'react';
import api from '../../api/axiosConfig';
import './AnimalList.css';

interface Prescription {
    nom_medicament: string;
    posologie: string;
    duree_traitement: string;
}

interface Consultation {
    id_consult: number;
    date_consult: string;
    diagnostic: string;
    prescriptions?: Prescription[]; 
}

const ConsultationHistory = ({ animalId }: { animalId: number }) => {
    const [consults, setConsults] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(true);
    const today = useMemo(() => new Date(), []);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const res = await api.get(`/consultations/animal/${animalId}`);
                setConsults(res.data);
            } catch (err) {
                console.error("Erreur historique:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchHistory();
    }, [animalId]);

    if (loading) return <div className="mini-loader">Chargement des soins...</div>;

    return (
        <div className="consult-history-container">
            <header className="history-header"><h5>🩺 Historique & Ordonnances</h5></header>
            <div className="timeline">
                {consults.length > 0 ? consults.map((c) => (
                    <div key={c.id_consult} className={`timeline-item ${new Date(c.date_consult) > today ? 'is-future' : 'is-past'}`}>
                        <div className="timeline-marker"></div>
                        <div className="timeline-content">
                            <div className="consult-meta">
                                <span className="consult-date">{new Date(c.date_consult).toLocaleDateString('fr-FR')}</span>
                                <span className={`status-badge ${new Date(c.date_consult) > today ? 'badge-future' : 'badge-past'}`}>
                                    {new Date(c.date_consult) > today ? 'À venir' : 'Effectuée'}
                                </span>
                            </div>
                            <p className="consult-diagnostic"><b>Diagnostic :</b> {c.diagnostic}</p>
                            
                            {c.prescriptions && c.prescriptions.length > 0 && (
                                <div className="prescription-list">
                                    {c.prescriptions.map((p, idx) => (
                                        <div key={idx} className="prescription-badge">
                                            💊 <b>{p.nom_medicament}</b> — {p.posologie} ({p.duree_traitement})
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )) : <p className="empty-history">Aucun historique trouvé.</p>}
            </div>
        </div>
    );
};

const AnimalList = ({ refreshKey = 0 }: { refreshKey?: number }) => {
    const [animaux, setAnimaux] = useState<any[]>([]);
    const [expandedId, setExpandedId] = useState<number | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editFormData, setEditFormData] = useState({
        nom_animal: '', espece: '', race: '', age: '', poids_kg: ''
    });
    const [loading, setLoading] = useState(true);

    const fetchAnimaux = async () => {
        try {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            const profileRes = await api.get(`/proprietaires/me/${savedUser.id_user}`);
            const res = await api.get(`/animaux/proprietaire/${profileRes.data.id_proprietaire}`);
            setAnimaux(res.data);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { fetchAnimaux(); }, [refreshKey]);

    const handleEditClick = (e: React.MouseEvent, animal: any) => {
        e.stopPropagation();
        setEditingId(animal.id_animal);
        setEditFormData({
            nom_animal: animal.nom_animal || '',
            espece: animal.espece || '',
            race: animal.race || '',
            age: animal.age != null ? String(animal.age) : '',
            poids_kg: animal.poids_kg != null ? String(animal.poids_kg) : ''
        });
    };

    const handleSave = async (id: number) => {
        try {
            const payload = {
                ...editFormData,
                age: editFormData.age === '' ? null : Number(editFormData.age),
                poids_kg: editFormData.poids_kg === '' ? null : Number(editFormData.poids_kg)
            };
            const res = await api.put(`/animaux/${id}`, payload);
            setAnimaux(prev => prev.map(a => a.id_animal === id ? res.data : a));
            setEditingId(null);
        } catch (err) { alert("Erreur lors de la modification"); }
    };

    if (loading) return <div className="loading">Chargement...</div>;

    return (
        <div className="animal-list-container">
            <div className="animal-grid">
                {animaux.map((animal) => (
                    <div key={animal.id_animal} className={`animal-card ${expandedId === animal.id_animal ? 'expanded' : ''}`} onClick={() => setExpandedId(expandedId === animal.id_animal ? null : animal.id_animal)}>
                        {editingId === animal.id_animal ? (
                            <div className="edit-mode" onClick={e => e.stopPropagation()}>
                                <h5>Modifier {animal.nom_animal}</h5>
                                <div className="input-group">
                                    <input placeholder="Nom" value={editFormData.nom_animal} onChange={e => setEditFormData({...editFormData, nom_animal: e.target.value})} />
                                    <input placeholder="Espèce" value={editFormData.espece} onChange={e => setEditFormData({...editFormData, espece: e.target.value})} />
                                    <input placeholder="Race" value={editFormData.race} onChange={e => setEditFormData({...editFormData, race: e.target.value})} />
                                    <input type="number" placeholder="Âge" value={editFormData.age} onChange={e => setEditFormData({...editFormData, age: e.target.value})} />
                                    <input type="number" step="0.1" placeholder="Poids (kg)" value={editFormData.poids_kg} onChange={e => setEditFormData({...editFormData, poids_kg: e.target.value})} />
                                </div>
                                <div className="btn-group">
                                    <button onClick={() => handleSave(animal.id_animal)} className="btn-save">Enregistrer</button>
                                    <button onClick={() => setEditingId(null)} className="btn-cancel">Annuler</button>
                                </div>
                            </div>
                        ) : (
                            <div className="view-mode">
                                <div className="card-header">
                                    <h4>{animal.nom_animal}</h4>
                                    <span className="expand-icon">{expandedId === animal.id_animal ? '▲' : '▼'}</span>
                                </div>
                                <p className="sub-info">{animal.espece} • {animal.race || 'Race NC'}</p>
                                
                                {expandedId === animal.id_animal && (
                                    <div className="details" onClick={e => e.stopPropagation()}>
                                        <div className="physical-info">
                                            <span>⚖️ {animal.poids_kg ?? '--'} kg</span>
                                            <span>🎂 {animal.age ?? '--'} ans</span>
                                        </div>
                                        <ConsultationHistory animalId={animal.id_animal} />
                                        <div className="btn-group">
                                            <button onClick={(e) => handleEditClick(e, animal)} className="btn-edit">Modifier Infos</button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AnimalList;