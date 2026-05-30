import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
                import('../../api/axiosConfig').then(({ default: api }) => {
                    api.get(`/proprietaires/me/${parsed.id_user}`)
                        .then(r => setIdProprio(r.data.id_proprietaire))
                        .catch(() => {});
                });
            } else if (parsed.role === 'veto') {
                import('../../api/axiosConfig').then(({ default: api }) => {
                    api.get(`/veterinaires/me/${parsed.id_user}`)
                        .then(r => setIdVeto(r.data.id_veterinaire))
                        .catch(() => {});
                });
            }
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    const handleCompleteProfile = () => {
        navigate('/register-profile', {
            state: { userId: user.id_user, role: user.role }
        });
    };

    const handleAnimalAdded = useCallback(() => setAnimalRefreshKey(k => k + 1), []);
    const handleConsultationAdded = useCallback(() => setConsultRefreshKey(k => k + 1), []);

    // Appelé après sauvegarde du profil veto — met à jour l'affichage navbar
    const handleProfilSaved = useCallback((nom: string, prenom: string) => {
        setUser((prev: any) => ({ ...prev, nom, prenom }));
    }, []);

    if (!user) return null;

    const userInitial = user.mail ? user.mail.charAt(0).toUpperCase() : 'U';
    const displayName = user.prenom
        ? `${user.prenom} ${user.nom ?? ''}`.trim()
        : user.mail;

    return (
        <div className="dashboard-container">
            {/* NAVBAR */}
            <nav className="dashboard-navbar">
                <div className="navbar-left">
                    <span className="brand-name">🐾 VetoApp</span>
                </div>
                <div className="navbar-right">
                    <div className="profile-section">
                        <div className="user-avatar">{userInitial}</div>
                        <div className="user-meta">
                            <span className="user-name">{displayName}</span>
                            <span className="user-status">
                                {user.role === 'veto' ? '● Vétérinaire' : '● Propriétaire'}
                            </span>
                        </div>
                    </div>

                    {/* Bouton paramètres — veto uniquement */}
                    {user.role === 'veto' && user.has_profile && (
                        <button
                            className="btn-settings-icon"
                            title="Modifier mon profil"
                            onClick={() => setShowProfilVeto(true)}
                        >
                            ⚙️
                        </button>
                    )}

                    <button onClick={handleLogout} className="btn-logout-icon" title="Déconnexion">
                        🚪
                    </button>
                </div>
            </nav>

            {/* MODAL PROFIL VETO */}
            {showProfilVeto && user.role === 'veto' && (
                <ProfilVeto
                    userId={user.id_user}
                    onClose={() => setShowProfilVeto(false)}
                    onSaved={handleProfilSaved}
                />
            )}

            {/* BANDEAU PROFIL INCOMPLET */}
            {!user.has_profile && (
                <div className="profile-incomplete-banner">
                    <div className="banner-content">
                        <span className="banner-icon">⚠️</span>
                        <div>
                            <strong>Votre profil est incomplet.</strong>
                            <p>
                                {user.role === 'veto'
                                    ? 'Complétez votre profil vétérinaire pour accéder à toutes les fonctionnalités.'
                                    : 'Complétez votre profil propriétaire pour gérer vos animaux.'}
                            </p>
                        </div>
                        <button className="btn-complete-profile" onClick={handleCompleteProfile}>
                            Compléter mon profil →
                        </button>
                    </div>
                </div>
            )}

            <main className="dashboard-main">
                <section className="welcome-section">
                    <h1>Tableau de bord</h1>
                    <p className="subtitle">
                        Bonjour{user.prenom ? `, ${user.prenom}` : ''} ! Heureux de vous revoir.
                    </p>
                </section>

                <div className="dashboard-content">

                    {/* ── ZONE PROPRIÉTAIRE ── */}
                    {user.role === 'client' && user.has_profile && (
                        <div className="owner-layout">
                            <div className="grid-cards">
                                <AddAnimal onAnimalAdded={handleAnimalAdded} />
                                {idProprio && (
                                    <DemandeConsultation
                                        idProprio={idProprio}
                                        onConsultationAdded={handleConsultationAdded}
                                    />
                                )}
                            </div>
                            <div className="full-width-section">
                                <AnimalList refreshKey={animalRefreshKey} />
                            </div>
                        </div>
                    )}

                    {/* ── ZONE VÉTÉRINAIRE ── */}
                    {user.role === 'veto' && user.has_profile && (
                        <div className="veto-layout">
                            {idVeto && (
                                <ConsultationList
                                    idVeto={idVeto}
                                    refreshKey={consultRefreshKey}
                                />
                            )}
                        </div>
                    )}

                    {/* ÉTAT VIDE */}
                    {!user.has_profile && (
                        <div className="empty-state">
                            <p className="empty-icon">{user.role === 'veto' ? '🩺' : '🐾'}</p>
                            <h3>Bienvenue sur VetoApp !</h3>
                            <p>Complétez votre profil pour débloquer toutes les fonctionnalités.</p>
                            <button className="btn-auth" onClick={handleCompleteProfile}
                                style={{ maxWidth: 280, margin: '16px auto 0' }}>
                                Finaliser mon inscription →
                            </button>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;