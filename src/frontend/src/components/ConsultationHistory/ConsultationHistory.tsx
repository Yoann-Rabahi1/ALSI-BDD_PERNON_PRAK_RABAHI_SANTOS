import React, { useMemo } from 'react';

// On s'assure que les types sont bien définis pour la clarté du code
interface Consultation {
    id_consult: number;
    date_consult: string;
    diagnostic: string;
}

interface Props {
    consults: Consultation[];
}

const ConsultationHistory: React.FC<Props> = ({ consults }) => {
    const today = new Date();

    // Utilisation de useMemo pour éviter de trier à chaque re-render si les données n'ont pas changé
    const sortedConsults = useMemo(() => {
        return [...consults].sort((a, b) => 
            new Date(b.date_consult).getTime() - new Date(a.date_consult).getTime()
        );
    }, [consults]);

    return (
        <div className="consult-history-container">
            <header className="history-header">
                <span className="header-icon">🩺</span>
                <h5>Historique des soins</h5>
            </header>

            <div className="timeline">
                {sortedConsults.length > 0 ? (
                    sortedConsults.map((c) => {
                        const consultDate = new Date(c.date_consult);
                        const isFuture = consultDate > today;

                        return (
                            <div key={c.id_consult} className={`timeline-item ${isFuture ? 'is-future' : 'is-past'}`}>
                                <div className="timeline-marker"></div>
                                <div className="timeline-content">
                                    <div className="consult-meta">
                                        <time className="consult-date">
                                            {consultDate.toLocaleDateString('fr-FR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </time>
                                        <span className={`status-badge ${isFuture ? 'badge-future' : 'badge-past'}`}>
                                            {isFuture ? 'À venir' : 'Effectuée'}
                                        </span>
                                    </div>
                                    <p className="consult-diagnostic">{c.diagnostic}</p>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="empty-history">
                        <p>Aucun antécédent médical enregistré.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsultationHistory;