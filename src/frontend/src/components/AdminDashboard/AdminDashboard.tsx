import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [data, setData] = useState<any[]>([]);
    const [category, setCategory] = useState("animaux");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchColumn, setSearchColumn] = useState("");
    const [actionMessage, setActionMessage] = useState("");
    const [showInactive, setShowInactive] = useState(false);

    const searchOptions: any = {
        animaux: [{ label: "Nom Animal", val: "nom_animal" }, { label: "Espèce", val: "espece" }, { label: "Race", val: "race" }],
        proprietaires: [{ label: "Nom", val: "nom" }, { label: "Prénom", val: "prenom" }, { label: "Téléphone", val: "telephone" }],
        veterinaires: [{ label: "Nom", val: "nom" }, { label: "Prénom", val: "prenom" }],
        etablissements: [{ label: "Nom Clinique", val: "nom_etablissement" }, { label: "Ville", val: "ville" }],
        medicaments: [{ label: "Nom Médicament", val: "nom_medicament" }],
        consultations: [
            { label: "ID Consultation", val: "id_consult" },
            { label: "Diagnostic", val: "diagnostic" },
            { label: "Date", val: "date_consult" }
        ],
        prescriptions: [
            { label: "ID Prescription", val: "id_prescription" },
            { label: "Posologie", val: "posologie" },
            { label: "Durée", val: "duree_traitement" }
        ]
    };

    const rowActions: Record<string, {
        deactivate: { method: 'delete' | 'patch'; getUrl: (item: any) => string };
        reactivate: { method: 'patch'; getUrl: (item: any) => string };
    }> = {
        animaux: {
            deactivate: { method: "delete", getUrl: (item) => `/animaux/${item.id_animal}` },
            reactivate: { method: "patch", getUrl: (item) => `/animaux/reactiver/${item.id_animal}` },
        },
        etablissements: {
            deactivate: { method: "delete", getUrl: (item) => `/etablissements/${item.id_etablissement}` },
            reactivate: { method: "patch", getUrl: (item) => `/etablissements/reactiver/${item.id_etablissement}` },
        },
        proprietaires: {
            deactivate: { method: "patch", getUrl: (item) => `/users/desactiver/${item.id_user}` },
            reactivate: { method: "patch", getUrl: (item) => `/users/reactiver/${item.id_user}` },
        },
        veterinaires: {
            deactivate: { method: "patch", getUrl: (item) => `/users/desactiver/${item.id_user}` },
            reactivate: { method: "patch", getUrl: (item) => `/users/reactiver/${item.id_user}` },
        },
    };

    useEffect(() => {
        loadStats();
        handleReset();
    }, [category]);

    const loadStats = async () => {
        try {
            const res = await api.get('/admin/stats');
            setStats(res.data);
        } catch (err) { console.error("Erreur stats", err); }
    };

    const loadAllData = async () => {
        try {
            const res = await api.get(`/${category}`);
            setData(res.data);
        } catch (err) { setData([]); }
    };

    const handleSearch = async () => {
        if (!searchTerm.trim()) {
            return loadAllData();
        }
        try {
            const res = await api.get(`/${category}/search`, {
                params: { q: searchTerm, column: searchColumn }
            });
            setData(res.data);
        } catch (err) { console.error("Erreur recherche", err); }
    };

    const handleReset = () => {
        setSearchTerm("");
        setActionMessage("");
        if (searchOptions[category]) {
            setSearchColumn(searchOptions[category][0].val);
        }
        loadAllData();
    };

    const handleToggleActive = async (item: any) => {
        const actions = rowActions[category];
        if (!actions) {
            setActionMessage("La suppression n'est pas disponible pour cette table.");
            return;
        }

        const isActive = item.est_actif === undefined || item.est_actif === null
            ? true
            : item.est_actif === true || item.est_actif === 1;
        const action = isActive ? actions.deactivate : actions.reactivate;

        const confirmed = window.confirm(
            `Confirmer la ${isActive ? 'désactivation' : 'réactivation'} de cette ligne dans ${category.toUpperCase()} ?`
        );
        if (!confirmed) {
            return;
        }

        try {
            if (action.method === 'patch') {
                await api.patch(action.getUrl(item));
            } else {
                await api.delete(action.getUrl(item));
            }
            setActionMessage(`Entrée ${isActive ? 'désactivée' : 'réactivée'} avec succès.`);
            await loadAllData();
        } catch (err: any) {
            setActionMessage(err.response?.data?.detail || `Impossible de ${isActive ? 'désactiver' : 'réactiver'} cette entrée.`);
        }
    };

    const visibleData = data.filter((item) => {
        if (item.est_actif === undefined || item.est_actif === null) {
            return true;
        }
        return showInactive || item.est_actif === true || item.est_actif === 1;
    });

    const columns = visibleData.length > 0 ? Object.keys(visibleData[0]) : [];
    const hasRowAction = Boolean(rowActions[category]);
    const canReactivateAnimal = (item: any) => {
        const isAnimalInactive = item.est_actif === false || item.est_actif === 0;
        const ownerActive = item.proprietaire_actif === undefined || item.proprietaire_actif === null
            ? true
            : item.proprietaire_actif === true || item.proprietaire_actif === 1;

        return isAnimalInactive && ownerActive;
    };

    return (
        <div className="admin-container">
            <header className="admin-header">
                <h1>Panel Administration</h1>
            </header>

            {/* SECTION STATISTIQUES GLOBALES */}
            {stats && (
                <>
                    <div className="stats-grid">
                        <div className="stat-card"><h3>🐾 Animaux</h3><p>{stats.counts.animaux}</p></div>
                        <div className="stat-card"><h3>👤 Proprios</h3><p>{stats.counts.proprietaires}</p></div>
                        <div className="stat-card"><h3>🩺 Vétos</h3><p>{stats.counts.veterinaires}</p></div>
                        <div className="stat-card"><h3>🏥 Cliniques</h3><p>{stats.counts.etablissements}</p></div>
                    </div>

                    {/* NOUVEAU : TOP 3 ESPÈCES */}
                    <div className="top-species-section">
                        <h3>🏆 Top 3 des Espèces Suivies</h3>
                        <div className="species-list">
                            {stats.top_especes.map((item: any, index: number) => (
                                <div key={index} className="species-item">
                                    <span className="rank">#{index + 1}</span>
                                    <span className="name">{item.espece}</span>
                                    <span className="count">{item.count} individus</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            <div className="admin-controls">
                <div className="control-group">
                    <label>Table :</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                        {Object.keys(searchOptions).map(key => (
                            <option key={key} value={key}>{key.toUpperCase()}</option>
                        ))}
                    </select>
                </div>

                <div className="control-group">
                    <label>Critère :</label>
                    <select value={searchColumn} onChange={(e) => setSearchColumn(e.target.value)}>
                        {searchOptions[category]?.map((opt: any) => (
                            <option key={opt.val} value={opt.val}>{opt.label}</option>
                        ))}
                    </select>
                </div>

                <div className="search-box">
                    <input 
                        type="text" 
                        placeholder="Rechercher... (vide pour tout voir)" 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button onClick={handleSearch}>🔍 Filtrer</button>
                    <label className="inactive-toggle">
                        <input
                            type="checkbox"
                            checked={showInactive}
                            onChange={(e) => setShowInactive(e.target.checked)}
                        />
                        <span>Non actifs</span>
                    </label>
                    <button className="reset-btn" onClick={handleReset}>🔄</button>
                </div>
            </div>

            {actionMessage && <div className="action-message">{actionMessage}</div>}

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            {columns.map(col => <th key={col}>{col.replace(/_/g, ' ').toUpperCase()}</th>)}
                            <th>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {visibleData.map((item, idx) => (
                            <tr key={idx}>
                                {columns.map(col => <td key={col}>{String(item[col] ?? '—')}</td>)}
                                <td>
                                    {hasRowAction ? (
                                        category === 'animaux' && (item.est_actif === false || item.est_actif === 0) && !canReactivateAnimal(item) ? (
                                            <span className="delete-unavailable">Propriétaire inactif</span>
                                        ) : (
                                            <button
                                                className={item.est_actif === false || item.est_actif === 0 ? "reactivate-btn" : "delete-btn"}
                                                onClick={() => handleToggleActive(item)}
                                            >
                                                {item.est_actif === false || item.est_actif === 0 ? "Réactiver" : "Désactiver"}
                                            </button>
                                        )
                                    ) : (
                                        <span className="delete-unavailable">—</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;