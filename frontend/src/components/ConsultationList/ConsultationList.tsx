import { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import PrescriptionView from '../Prescription/Prescription'; // Import du composant de prescription
import './ConsultationList.css';

interface ConsultationVeto {
    id_consult: number;
    date_consult: string;
    diagnostic: string;
    animal: { nom_animal: string; espece: string; race: string; } | null;
    proprietaire: { nom: string; prenom: string; telephone: string; } | null;
}

const ConsultationList = ({ idVeto, refreshKey = 0 }: { idVeto: number, refreshKey?: number }) => {
    const [consultations, setConsultations] = useState<ConsultationVeto[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [tempDiag, setTempDiag] = useState("");

    const fetchConsults = async () => {
        try {
            const res = await api.get(`/consultations/veterinaire/${idVeto}`);
            setConsultations(res.data);
        } catch (err) {
            console.error("Erreur chargement consultations:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (idVeto) fetchConsults();
    }, [idVeto, refreshKey]);

    const handleUpdateDiag = async (id: number) => {
        try {
            await api.put(`/consultations/${id}/diagnostic`, { diagnostic: tempDiag });
            setEditingId(null);
            fetchConsults(); 
        } catch (err) {
            console.error("Erreur mise à jour diagnostic:", err);
        }
    };

    if (loading) return <div className="loader">Chargement du planning...</div>;

    return (
        <div className="consult-container">
            <div className="consult-grid">
                {consultations.length === 0 ? (
                    <div className="consult-empty">Aucune consultation prévue.</div>
                ) : (
                    consultations.map(c => (
                        <div key={c.id_consult} className="glass-card">
                            <div className="card-accent"></div>
                            <div className="card-content">
                                <div className="date-badge">
                                    {new Date(c.date_consult).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                </div>
                                <div className="time-tag">
                                    {new Date(c.date_consult).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                                
                                <div className="main-info">
                                    <h3>{c.animal?.nom_animal || "Animal Inconnu"}</h3>
                                    <span className="species-tag">
                                        {c.animal?.espece} {c.animal?.race ? `• ${c.animal.race}` : ''}
                                    </span>
                                </div>

                                <div className="client-info">
                                    <p>👤 {c.proprietaire?.prenom} {c.proprietaire?.nom}</p>
                                    <p>📞 {c.proprietaire?.telephone}</p>
                                </div>

                                {/* ZONE DIAGNOSTIC */}
                                <div className={`diag-zone ${editingId === c.id_consult ? 'is-editing' : ''}`}>
                                    {editingId === c.id_consult ? (
                                        <div className="edit-diag">
                                            <textarea 
                                                value={tempDiag} 
                                                onChange={(e) => setTempDiag(e.target.value)}
                                                autoFocus
                                                placeholder="Saisir le compte-rendu..."
                                            />
                                            <div className="edit-actions">
                                                <button className="save-btn" onClick={() => handleUpdateDiag(c.id_consult)}>Enregistrer</button>
                                                <button className="cancel-btn" onClick={() => setEditingId(null)}>Annuler</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="view-diag" onClick={() => {
                                            setEditingId(c.id_consult);
                                            setTempDiag(c.diagnostic || "");
                                        }}>
                                            <span className="diag-icon">📝</span>
                                            <div className="diag-content">
                                                <h4>Diagnostic</h4>
                                                <p className="diag-text">{c.diagnostic || "Cliquer pour ajouter un diagnostic"}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* ZONE PRESCRIPTION (MÉDICAMENTS) */}
                                <PrescriptionView 
                                    idConsult={c.id_consult} 
                                    isVeto={true} 
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ConsultationList;