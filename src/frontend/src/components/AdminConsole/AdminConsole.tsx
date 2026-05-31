import { useState, useEffect } from 'react';
import api from '../../api/axiosConfig';
import './AdminConsole.css';

const AdminConsole = () => {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [error, setError] = useState("");
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) setUser(JSON.parse(storedUser));
    }, []);

    const handleExecute = async () => {
        // Reset des états avant l'exécution
        setError("");
        setResults([]);
        setColumns([]);
        
        try {
            const response = await api.post('/admin/query', { sql_query: query });
            
            // Vérification stricte de la présence de données (DQL: SELECT)
            if (response.data.results && response.data.results.length > 0) {
                const data = response.data.results;
                setColumns(Object.keys(data[0]));
                setResults(data);
            } 
            // Cas des requêtes de modification (DML: INSERT, UPDATE, DELETE)
            else if (response.data.message) {
                setError(response.data.message);
            } else {
                setError("Requête exécutée avec succès (aucun résultat à afficher).");
            }
        } catch (err: any) {
            // Affichage de l'erreur SQL brute renvoyée par FastAPI
            setError(err.response?.data?.detail || "Erreur de syntaxe SQL ou problème de connexion.");
        }
    };

    return (
        <div className="admin-wrapper">
            <header className="admin-topbar">
                <div className="admin-info">
                    <span className="status-indicator"></span>
                    <strong>{user?.prenom} {user?.nom}</strong>
                    <span className="badge-role">{user?.role}</span>
                </div>
                <div className="admin-title">VetoApp System Terminal</div>
            </header>

            <main className="admin-content">
                <div className="console-input-area">
                    <textarea 
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="SELECT * FROM animaux WHERE age > 5..."
                    />
                    <button onClick={handleExecute} className="btn-run">
                        ⚡ Exécuter
                    </button>
                </div>

                {/* Zone de logs pour les messages de succès ou les erreurs */}
                {error && <div className="console-log">{error}</div>}

                <div className="console-output">
                    {results.length > 0 ? (
                        <div className="table-scroll">
                            <table>
                                <thead>
                                    <tr>
                                        {columns.map(col => <th key={col}>{col}</th>)}
                                    </tr>
                                </thead>
                                <tbody>
                                    {results.map((row, i) => (
                                        <tr key={i}>
                                            {columns.map(col => (
                                                <td key={col}>{row[col] !== null ? String(row[col]) : "NULL"}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">
                            {!error && "En attente d'instruction SQL..."}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminConsole;