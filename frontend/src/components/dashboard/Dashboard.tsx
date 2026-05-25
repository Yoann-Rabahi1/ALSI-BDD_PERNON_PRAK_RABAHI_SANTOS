import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AddAnimal from '../addAnimal/AddAnimal'; 
import AnimalList from '../animalList/AnimalList'; // On importe la liste
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

                {/* Utilisation d'une div pour séparer les sections si besoin, ou rester en grid */}
                <div className="dashboard-content">
                    
                    {/* ZONE PROPRIÉTAIRE */}
                    {user.role === 'client' && (
                        <div className="owner-layout">
                            <div className="grid-cards">
                                <AddAnimal />
                                <div className="card">
                                    <h3>Aperçu</h3>
                                    <p>Statistiques et activités récentes.</p>
                                </div>
                            </div>
                            
                            {/* On affiche la liste des animaux en dessous ou à côté */}
                            <div className="full-width-section" style={{marginTop: '20px'}}>
                                <AnimalList />
                            </div>
                        </div>
                    )}

                    {/* ZONE VÉTO */}
                    {user.role === 'veto' && (
                        <div className="grid-cards">
                            <div className="card">
                                <h3>Gestion Clinique</h3>
                                <p>Accès aux dossiers médicaux et planning.</p>
                            </div>
                            <div className="card">
                                <h3>Statistiques</h3>
                                <p>Nombre de consultations ce mois-ci.</p>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default Dashboard;