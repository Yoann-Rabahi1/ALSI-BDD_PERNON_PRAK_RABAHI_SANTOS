import { useEffect, useState } from 'react';
import api from '../../api/axiosConfig';
import PrescriptionView from '../Prescription/Prescription';
import './ConsultationList.css';

interface ConsultationVeto {
    id_consult: number;
    date_consult: string;
    diagnostic: string;
    animal: { nom_animal: string; espece: string; race: string; age: number | null; poids_kg: number | null; } | null;
    proprietaire: { nom: string; prenom: string; telephone: string; mail: string | null; } | null;
}

const ConsultationList = ({ idVeto, refreshKey = 0 }: { idVeto: number, refreshKey?: number }) => {
    const [consultations, setConsultations] = useState<ConsultationVeto[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [tempDiag, setTempDiag] = useState('');

    const fetchConsults = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/consultations/veterinaire/${idVeto}`);
            setConsultations(res.data);
        } catch (err) {
            console.error('Erreur chargement consultations:', err);
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
            console.error('Erreur mise à jour diagnostic:', err);
        }
    };

    const now = new Date();
    const upcoming = consultations.filter(c => new Date(c.date_consult) >= now);
    const past = consultations.filter(c => new Date(c.date_consult) < now);
    const displayed = tab === 'upcoming' ? upcoming : past;

    if (loading) return <div className="loader">Chargement du planning...</div>;

    return (
        <div className="consult-container">
            {/* ONGLETS */}
            <div className="consult-tabs-header">
                <h3>Mes consultations</h3>
                <div className="consult-tabs">
                    <button
                        className={`tab-btn ${tab === 'upcoming' ? 'active' : ''}`}
                        onClick={() => setTab('upcoming')}
                    >
                        À venir <span className="badge">{upcoming.length}</span>
                    </button>
                    <button
                        className={`tab-btn ${tab === 'past' ? 'active' : ''}`}
                        onClick={() => setTab('past')}
                    >
                        Passées <span className="badge">{past.length}</span>
                    </button>
                </div>
            </div>

            <div className="consult-grid">
                {displayed.length === 0 ? (
                    <div className="consult-empty">
                        {tab === 'upcoming' ? 'Aucune consultation à venir.' : 'Aucune consultation passée.'}
                    </div>
                ) : (
                    displayed.map(c => (
                        <div key={c.id_consult} className={`glass-card ${tab === 'past' ? 'past' : ''}`}>
                            <div className="card-accent"></div>
                            <div className="card-content">
                                <div className="date-badge">
                                    {new Date(c.date_consult).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                </div>
                                <div className="time-tag">
                                    {new Date(c.date_consult).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                </div>

                                <div className="main-info">
                                    <h3>{c.animal?.nom_animal || 'Animal Inconnu'}</h3>
                                    <span className="species-tag">
                                        {c.animal?.espece}{c.animal?.race ? ` · ${c.animal.race}` : ''}
                                    </span>
                                    {(c.animal?.age != null || c.animal?.poids_kg != null) && (
                                        <span className="animal-details">
                                            {c.animal?.age != null && `${c.animal.age} ans`}
                                            {c.animal?.age != null && c.animal?.poids_kg != null && ' · '}
                                            {c.animal?.poids_kg != null && `${c.animal.poids_kg} kg`}
                                        </span>
                                    )}
                                </div>

                                <div className="client-info">
                                    <p>👤 {c.proprietaire?.prenom} {c.proprietaire?.nom}</p>
                                    <p>📞 {c.proprietaire?.telephone}</p>
                                    {c.proprietaire?.mail && <p>✉️ {c.proprietaire.mail}</p>}
                                </div>

                                {/* ZONE DIAGNOSTIC — cliquable pour éditer */}
                                <div className={`diag-zone ${editingId === c.id_consult ? 'is-editing' : ''}`}>
                                    {editingId === c.id_consult ? (
                                        <div className="edit-diag">
                                            <textarea
                                                value={tempDiag}
                                                onChange={e => setTempDiag(e.target.value)}
                                                autoFocus
                                                placeholder="Saisir le compte-rendu..."
                                            />
                                            <div className="edit-actions">
                                                <button className="save-btn" onClick={() => handleUpdateDiag(c.id_consult)}>
                                                    Enregistrer
                                                </button>
                                                <button className="cancel-btn" onClick={() => setEditingId(null)}>
                                                    Annuler
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="view-diag" onClick={() => {
                                            setEditingId(c.id_consult);
                                            setTempDiag(c.diagnostic === 'en attente' ? '' : c.diagnostic || '');
                                        }}>
                                            <span className="diag-icon">📝</span>
                                            <div className="diag-content">
                                                <h4>Diagnostic</h4>
                                                <p className={`diag-text ${c.diagnostic === 'en attente' ? 'pending' : ''}`}>
                                                    {c.diagnostic === 'en attente'
                                                        ? 'Cliquer pour rédiger le diagnostic'
                                                        : c.diagnostic}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* PRESCRIPTIONS */}
                                <PrescriptionView idConsult={c.id_consult} isVeto={true} />
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ConsultationList;