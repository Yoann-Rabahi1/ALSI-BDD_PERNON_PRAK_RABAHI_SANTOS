import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axiosConfig';
import AddAnimal from '../addAnimal/AddAnimal';
import AnimalList from '../AnimalList/AnimalList';
import DemandeConsultation from '../DemandeConsultation/DemandeConsultation';
import ConsultationList from '../ConsultationList/ConsultationList';
import ProfilVeto from '../ProfilVeto/ProfilVeto';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);
    const [idProprio, setIdProprio] = useState<number | null>(null);
    const [idVeto, setIdVeto] = useState<number | null>(null);
    const [animalRefreshKey, setAnimalRefreshKey] = useState(0);
    const [consultRefreshKey, setConsultRefreshKey] = useState(0);
    const [showProfilVeto, setShowProfilVeto] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (!savedUser) { navigate('/login'); return; }

        const parsed = JSON.parse(savedUser);
        setUser(parsed);

        if (parsed.has_profile && parsed.id_user) {
            if (parsed.role === 'client') {
                api.get(`/proprietaires/me/${parsed.id_user}`)
                    .then(r => setIdProprio(r.data.id_proprietaire))
                    .catch(() => {});
            } else if (parsed.role === 'veto') {
                api.get(`/veterinaires/me/${parsed.id_user}`)
                    .then(r => setIdVeto(r.data.id_veterinaire))
                    .catch(() => {});
            }
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleDeactivate = async () => {
        const confirm = window.confirm("⚠️ Attention : Voulez-vous vraiment désactiver votre compte ? Vous ne pourrez plus vous connecter, mais vos données de consultation resteront enregistrées.");
        if (confirm && user) {
            try {
                // Route simple avec l'ID en paramètre
                await api.patch(`/users/desactiver/${user.id_user}`);
                localStorage.removeItem('user');
                navigate('/login');
            } catch (err) {
                alert("Erreur lors de la désactivation du compte.");
            }
        }
    };

    const handleCompleteProfile = () => {
        navigate('/register-profile', {
            state: { userId: user.id_user, role: user.role }
        });
    };

    const handleAnimalAdded = useCallback(() => setAnimalRefreshKey(k => k + 1), []);
    const handleConsultationAdded = useCallback(() => setConsultRefreshKey(k => k + 1), []);
    const handleProfilSaved = useCallback((nom: string, prenom: string) => {
        setUser((prev: any) => ({ ...prev, nom, prenom }));
    }, []);

    if (!user) return null;

    const userInitial = user.mail ? user.mail.charAt(0).toUpperCase() : 'U';
    const displayName = user.prenom ? `${user.prenom} ${user.nom ?? ''}`.trim() : user.mail;

    return (
        <div className="dashboard-wrapper">
            {/* BARRE DE NAVIGATION */}
            <nav className="dashboard-navbar">
                <div className="nav-brand">🐾 VetoApp</div>
                <div className="nav-actions">
                    <div className="nav-profile">
                        <div className="nav-avatar">{userInitial}</div>
                        <div className="nav-user-info">
                            <span className="nav-name">{displayName}</span>
                            <span className="nav-role">{user.role === 'veto' ? 'Vétérinaire' : 'Propriétaire'}</span>
                        </div>
                    </div>
                    {user.role === 'veto' && user.has_profile && (
                        <button className="nav-btn" onClick={() => setShowProfilVeto(true)} title="Paramètres">⚙️</button>
                    )}
                    <button className="nav-btn logout" onClick={handleLogout} title="Déconnexion">🚪</button>
                </div>
            </nav>

            {/* BANDEAU PROFIL INCOMPLET */}
            {!user.has_profile && (
                <div className="status-banner warning">
                    <p>⚠️ <strong>Profil incomplet :</strong> Finalisez votre inscription pour accéder à vos outils.</p>
                    <button onClick={handleCompleteProfile}>Compléter mon profil</button>
                </div>
            )}

            <main className="dashboard-main">
                <header className="main-header">
                    <h1>Tableau de bord</h1>
                    <p className="subtitle">Heureux de vous revoir, {user.prenom || 'à vous'}.</p>
                </header>

                <div className="dashboard-content">
                    {/* ZONE PROPRIÉTAIRE */}
                    {user.role === 'client' && user.has_profile && (
                        <div className="owner-dashboard-layout">
                            <div className="top-actions-grid">
                                <aside className="sidebar-action">
                                    <div className="dashboard-card small">
                                        <div className="card-header"><h4>🐾 Nouvel Animal</h4></div>
                                        <AddAnimal onAnimalAdded={handleAnimalAdded} />
                                    </div>
                                </aside>

                                <section className="main-action">
                                    <div className="dashboard-card large">
                                        <div className="card-header"><h4>📅 Prendre Rendez-vous</h4></div>
                                        {idProprio && (
                                            <DemandeConsultation 
                                                idProprio={idProprio} 
                                                onConsultationAdded={handleConsultationAdded} 
                                                refreshKey={animalRefreshKey}
                                            />
                                        )}
                                    </div>
                                </section>
                            </div>

                            <footer className="dashboard-footer">
                                <div className="dashboard-card full-width">
                                    <div className="card-header"><h3>📁 Dossiers Médicaux</h3></div>
                                    <AnimalList refreshKey={animalRefreshKey} />
                                </div>

                                <div className="danger-zone">
                                    <div className="danger-content">
                                        <h3>Zone de Danger</h3>
                                        <p>En désactivant votre compte, vous ne pourrez plus vous connecter. Vos archives resteront accessibles à la clinique.</p>
                                    </div>
                                    <button className="btn-deactivate" onClick={handleDeactivate}>
                                        Désactiver mon compte
                                    </button>
                                </div>
                            </footer>
                        </div>
                    )}

                    {/* ZONE VÉTÉRINAIRE */}
                    {user.role === 'veto' && user.has_profile && idVeto && (
                        <div className="veto-dashboard-layout">
                            <div className="dashboard-card full-width">
                                <div className="card-header"><h3>🩺 Consultations en cours</h3></div>
                                <ConsultationList idVeto={idVeto} refreshKey={consultRefreshKey} />
                            </div>
                        </div>
                    )}
                </div>
            </main>

            {showProfilVeto && <ProfilVeto userId={user.id_user} onClose={() => setShowProfilVeto(false)} onSaved={handleProfilSaved} />}
        </div>
    );
};

export default Dashboard;