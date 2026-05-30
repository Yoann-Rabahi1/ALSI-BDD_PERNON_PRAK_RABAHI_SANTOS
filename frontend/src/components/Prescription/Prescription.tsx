import { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import './Prescription.css';

interface Medicament {
    id_medicament: number;
    nom_medicament: string;
    prix_unitaire: number;
    description?: string;
}

interface Prescription {
    id_prescription: number;
    posologie: string;
    duree_traitement: string;
    medicament: Medicament;
}

const PrescriptionView = ({ idConsult, isVeto }: { idConsult: number, isVeto: boolean }) => {
    const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
    const [availableMeds, setAvailableMeds] = useState<Medicament[]>([]); // Typage précis ici
    const [showAdd, setShowAdd] = useState(false);
    
    // Initialisation du formulaire avec des valeurs vides
    const [form, setForm] = useState({ id_medicament: '', posologie: '', duree: '' });

    const loadData = async () => {
        try {
            // 1. Charger les prescriptions actuelles de la consultation
            const res = await api.get(`/consultations/${idConsult}/prescriptions`);
            setPrescriptions(res.data);
            
            // 2. Si c'est un véto, charger TOUS les médicaments dispo en BDD
            if (isVeto) {
                const medsRes = await api.get('/medicaments');
                console.log("Médicaments chargés :", medsRes.data); // Pour debug dans la console
                setAvailableMeds(medsRes.data);
            }
        } catch (err) { 
            console.error("Erreur lors du chargement des données :", err); 
        }
    };

    useEffect(() => { loadData(); }, [idConsult]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Sécurité : vérifier qu'un médicament est bien sélectionné
        if (!form.id_medicament) {
            alert("Veuillez sélectionner un médicament dans la liste.");
            return;
        }

        try {
            await api.post('/prescriptions', {
                id_consult: idConsult,
                id_medicament: parseInt(form.id_medicament),
                posologie: form.posologie,
                duree_traitement: form.duree
            });
            
            setForm({ id_medicament: '', posologie: '', duree: '' });
            setShowAdd(false);
            loadData(); // Recharger la liste pour voir la nouvelle prescription
        } catch (err) { 
            console.error("Erreur lors de l'ajout :", err); 
        }
    };

    return (
        <div className="presc-container">
            <div className="presc-header">
                <h4>💊 Ordonnance détaillée</h4>
                {isVeto && !showAdd && (
                    <button className="btn-add-inline" onClick={() => setShowAdd(true)}>+</button>
                )}
            </div>

            {/* LISTE DES PRESCRIPTIONS */}
            <div className="presc-list">
                {prescriptions.length === 0 && !showAdd ? (
                    <p className="presc-empty">Aucun traitement prescrit.</p>
                ) : (
                    prescriptions.map(p => (
                        <div key={p.id_prescription} className="presc-item">
                            <div className="presc-med-header">
                                <span className="med-name">{p.medicament?.nom_medicament}</span>
                                <span className="med-price">{p.medicament?.prix_unitaire} €</span>
                            </div>
                            <div className="presc-med-info">
                                <span><strong>Posologie :</strong> {p.posologie}</span>
                                <span><strong>Durée :</strong> {p.duree_traitement}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* FORMULAIRE D'AJOUT (VÉTO SEULEMENT) */}
            {isVeto && showAdd && (
                <form onSubmit={handleAdd} className="presc-inline-form">
                    <select 
                        value={form.id_medicament} 
                        onChange={e => setForm({...form, id_medicament: e.target.value})}
                        required
                    >
                        <option value="">-- Sélectionner un médicament --</option>
                        {availableMeds.map((m) => (
                            <option key={m.id_medicament} value={m.id_medicament}>
                                {m.nom_medicament} ({m.prix_unitaire}€)
                            </option>
                        ))}
                    </select>

                    <input 
                        placeholder="Posologie (ex: 1/jour)" 
                        value={form.posologie} 
                        onChange={e => setForm({...form, posologie: e.target.value})}
                        required
                    />
                    <input 
                        placeholder="Durée (ex: 5 jours)" 
                        value={form.duree} 
                        onChange={e => setForm({...form, duree: e.target.value})}
                        required
                    />

                    <div className="presc-form-actions">
                        <button type="submit" className="btn-confirm">Valider</button>
                        <button type="button" className="btn-cancel" onClick={() => setShowAdd(false)}>Annuler</button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default PrescriptionView;