import { useState } from 'react';
import AdminDashboard from '../AdminDashboard/AdminDashboard';
import AdminConsole from '../AdminConsole/AdminConsole';
import '../AdminPanel/AdminPanel.css';

const AdminPanel = () => {
    const [activeTab, setActiveTab] = useState<'stats' | 'manage'>('stats');

    return (
        <div className="admin-panel-wrapper">
            {/* Sidebar de navigation interne à l'admin */}
            <aside className="admin-sidebar">
                <div className="sidebar-header">
                    <h2>Admin Panel</h2>
                </div>
                <nav className="sidebar-nav">
                    <button 
                        className={activeTab === 'stats' ? 'active' : ''} 
                        onClick={() => setActiveTab('stats')}
                    >
                        📊 Vue d'ensemble
                    </button>
                    <button 
                        className={activeTab === 'manage' ? 'active' : ''} 
                        onClick={() => setActiveTab('manage')}
                    >
                        ⚙️ Gestion des données
                    </button>
                </nav>
            </aside>

            {/* Zone de contenu dynamique */}
            <main className="admin-content">
                {activeTab === 'stats' ? <AdminDashboard /> : <AdminConsole />}
            </main>
        </div>
    );
};

export default AdminPanel;