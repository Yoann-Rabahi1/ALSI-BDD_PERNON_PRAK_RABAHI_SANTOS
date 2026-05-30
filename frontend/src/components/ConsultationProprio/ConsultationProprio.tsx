import { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import PrescriptionView from '../Prescription/Prescription'; // Import de la vue prescription
import './ConsultationProprio.css'; // On décommente pour le style

interface ConsultationProprio {
    id_consult: number;
    date_consult: string;
    diagnostic: string;
    animal: {
        nom_animal: string;
        espece: string;
    } | null;
    veterinaire: {
        nom: string;
        prenom: string;
    } | null;
}

const ConsultationListProprio = ({ idProprio }: { idProprio: number }) => {
    const [consultations, setConsultations] = useState<ConsultationProprio[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (idProprio) {
            setLoading(true);
            api.get(`/consultations/proprietaire/${idProprio}`)
                .then(res => {
                    setConsultations(res.data);
                })
                .catch(err => {
                    console.error("Erreur lors de la récupération des consultations propriétaire:", err);
                })
                .finally(() => {
                    setLoading(false);
                });
        }
    }, [idProprio]);

    if (loading) return <div className="consult-loader">Chargement de l'historique médical...</div>;

    return (
        <div className="consult-container">
            <h3>Historique de soins de mes animaux</h3>
            
            {consultations.length === 0 ? (
                <div className="consult-empty">
                    <p>Aucune consultation enregistrée pour le moment. 🐾</p>
                </div>
            ) : (
                <div className="consult-grid">
                    {consultations.map(c => (
                        <div key={c.id_consult} className="glass-card">
                            <div className="card-accent" style={{ background: 'linear-gradient(90deg, #10b981, #34d399)' }}></div>
                            
                            <div className="card-content">
                                <div className="date-badge">
                                    {new Date(c.date_consult).toLocaleDateString('fr-FR', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric'
                                    })}
                                </div>

                                <div className="main-info">
                                    <h3>{c.animal?.nom_animal || 'Animal'}</h3>
                                    <span className="species-tag">{c.animal?.espece || 'Espèce NC'}</span>
                                </div>

                                <div className="client-info">
                                    <p>🩺 Docteur {c.veterinaire?.prenom} {c.veterinaire?.nom}</p>
                                </div>

                                <div className={`diag-box ${c.diagnostic === 'en attente' ? 'pending' : ''}`}>
                                    <span className="diag-icon">📝</span>
                                    <div className="diag-content">
                                        <h4>Bilan du vétérinaire</h4>
                                        <p className="diag-text">{c.diagnostic}</p>
                                    </div>
                                </div>

                                {/* Affichage des médicaments prescrits (Lecture seule pour le proprio) */}
                                <PrescriptionView 
                                    idConsult={c.id_consult} 
                                    isVeto={false} 
                                />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ConsultationListProprio;