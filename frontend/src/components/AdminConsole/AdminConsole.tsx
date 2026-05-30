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
        setError("");
        setResults([]);
        setColumns([]);
        try {
            const response = await api.post('/admin/query', { sql_query: query });
            if (response.data.results && response.data.results.length > 0) {
                setColumns(Object.keys(response.data.results[0]));
                setResults(response.data.results);
            } else {
                setError(response.data.message || "Requête exécutée avec succès.");
            }
        } catch (err: any) {
            setError(err.response?.data?.detail || "Erreur SQL détectée.");
        }
    };

    return (
        <div className="admin-wrapper">
            {/* Header de session */}
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
                        placeholder="Saisissez votre requête SQL ici..."
                    />
                    <button onClick={handleExecute} className="btn-run">
                        ⚡ Exécuter
                    </button>
                </div>

                {error && <div className="console-log">{error}</div>}

                <div className="console-output">
                    {results.length > 0 ? (
                        <div className="table-scroll">
                            <table>
                                <thead>
                                    <tr>{columns.map(col => <th key={col}>{col}</th>)}</tr>
                                </thead>
                                <tbody>
                                    {results.map((row, i) => (
                                        <tr key={i}>
                                            {columns.map(col => <td key={col}>{row[col]}</td>)}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="empty-state">En attente d'instruction...</div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminConsole;