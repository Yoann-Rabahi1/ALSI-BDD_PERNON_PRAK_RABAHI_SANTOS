import { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
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
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');

    useEffect(() => {
        if (idVeto) {
            api.get(`/consultations/veterinaire/${idVeto}`)
               .then(res => setConsultations(res.data))
               .finally(() => setLoading(false));
        }
    }, [idVeto, refreshKey]);

    const now = new Date();
    const filtered = consultations.filter(c => 
        tab === 'upcoming' ? new Date(c.date_consult) >= now : new Date(c.date_consult) < now
    );

    if (loading) return <div className="loader">Chargement du planning...</div>;

    return (
        <div className="consult-container">
            <div className="tabs-navigation">
                <button className={tab === 'upcoming' ? 'active' : ''} onClick={() => setTab('upcoming')}>
                    À venir ({consultations.filter(c => new Date(c.date_consult) >= now).length})
                </button>
                <button className={tab === 'past' ? 'active' : ''} onClick={() => setTab('past')}>
                    Historique
                </button>
            </div>

            <div className="consult-grid">
                {filtered.map(c => (
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
                                <h3>{c.animal?.nom_animal}</h3>
                                <span className="species-tag">{c.animal?.espece} • {c.animal?.race}</span>
                            </div>
                            <div className="client-info">
                                <p>👤 {c.proprietaire?.prenom} {c.proprietaire?.nom}</p>
                                <p>📞 {c.proprietaire?.telephone}</p>
                            </div>
                            <div className={`diag-box ${c.diagnostic === 'en attente' ? 'pending' : ''}`}>
                                <span className="diag-icon">📝</span>
                                <p className="diag-text">{c.diagnostic}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ConsultationList;