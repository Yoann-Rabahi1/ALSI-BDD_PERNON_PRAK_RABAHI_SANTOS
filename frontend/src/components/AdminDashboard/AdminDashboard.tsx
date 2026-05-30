import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './AdminDashboard.css';

const AdminDashboard = () => {
    const [stats, setStats] = useState<any>(null);
    const [data, setData] = useState<any[]>([]);
    const [category, setCategory] = useState("animaux");
    const [searchTerm, setSearchTerm] = useState("");
    const [searchColumn, setSearchColumn] = useState("");

    const searchOptions: any = {
        animaux: [{ label: "Nom Animal", val: "nom_animal" }, { label: "Espèce", val: "espece" }, { label: "Race", val: "race" }],
        proprietaires: [{ label: "Nom", val: "nom" }, { label: "Prénom", val: "prenom" }, { label: "Téléphone", val: "telephone" }],
        veterinaires: [{ label: "Nom", val: "nom" }, { label: "Prénom", val: "prenom" }],
        etablissements: [{ label: "Nom Clinique", val: "nom_etablissement" }, { label: "Ville", val: "ville" }],
        medicaments: [{ label: "Nom Médicament", val: "nom_medicament" }]
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
        if (searchOptions[category]) {
            setSearchColumn(searchOptions[category][0].val);
        }
        loadAllData();
    };

    const columns = data.length > 0 ? Object.keys(data[0]) : [];

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
                    <button className="reset-btn" onClick={handleReset}>🔄</button>
                </div>
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            {columns.map(col => <th key={col}>{col.replace(/_/g, ' ').toUpperCase()}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item, idx) => (
                            <tr key={idx}>
                                {columns.map(col => <td key={col}>{String(item[col] ?? '—')}</td>)}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;