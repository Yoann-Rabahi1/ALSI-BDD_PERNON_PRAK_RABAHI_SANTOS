import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

const Dashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setUser(JSON.parse(savedUser));
        } else {
            navigate('/login');
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (!user) return null;

    // On récupère l'initiale pour l'avatar
    const userInitial = user.mail ? user.mail.charAt(0).toUpperCase() : 'U';

    return (
        <div className="dashboard-container">
            {/* BARRE DE NAVIGATION SUPÉRIEURE */}
            <nav className="dashboard-navbar">
                <div className="navbar-left">
                    <span className="brand-name">🐾 VetoApp</span>
                </div>

                <div className="navbar-right">
                    <div className="profile-section">
                        <div className="user-avatar">{userInitial}</div>
                        <div className="user-meta">
                            <span className="user-name">{user.mail}</span>
                            <span className="user-status">
                                {user.role === 'veto' ? '● Vétérinaire' : '● Propriétaire'}
                            </span>
                        </div>
                    </div>
                    
                    <button onClick={handleLogout} className="btn-logout-icon" title="Déconnexion">
                         🚪
                    </button>
                </div>
            </nav>

            {/* CONTENU PRINCIPAL */}
            <main className="dashboard-main">
                <section className="welcome-section">
                    <h1>Tableau de bord</h1>
                    <p className="subtitle">Heureux de vous revoir sur votre interface de gestion.</p>
                </section>

                <div className="grid-cards">
                    {/* On pourra injecter ici des composants selon la page choisie */}
                    <div className="card">
                        <h3>Aperçu</h3>
                        <p>Statistiques et activités récentes apparaîtront ici.</p>
                    </div>
                    
                    {user.role === 'veto' && (
                        <div className="card">
                            <h3>Gestion Clinique</h3>
                            <p>Accès aux dossiers médicaux et planning.</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;