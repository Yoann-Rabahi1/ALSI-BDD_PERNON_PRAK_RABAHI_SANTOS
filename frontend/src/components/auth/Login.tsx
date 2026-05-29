import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../api/axiosConfig';
import './Auth.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    const navigate = useNavigate();
    const location = useLocation();

    // Affiche le message de succès après une inscription
    useEffect(() => {
        if (location.state?.message) {
            setSuccessMsg(location.state.message);
        }
    }, [location.state]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/login', {
                mail: email,
                mot_de_passe: password,
            });

            const user = response.data.user;

            // Persiste les infos en localStorage
            localStorage.setItem('user', JSON.stringify(user));

            // Redirection selon l'état du profil
            // has_profile = false → le backend n'a pas trouvé de profil complet
            if (!user.has_profile) {
                navigate('/register-profile', {
                    state: { userId: user.id_user, role: user.role }
                });
            } else {
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError('Email ou mot de passe incorrect.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <form className="auth-form" onSubmit={handleSubmit}>
                    <h2>Bon retour !</h2>
                    <p className="auth-subtitle">Connectez-vous à votre espace VetoApp</p>

                    {successMsg && (
                        <p className="auth-success">✅ {successMsg}</p>
                    )}

                    <div className="input-field">
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="input-field">
                        <label>Mot de passe</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    {error && (
                        <p className="auth-error">⚠️ {error}</p>
                    )}

                    <button type="submit" className="btn-auth" disabled={loading}>
                        {loading ? 'Vérification...' : 'Se connecter'}
                    </button>

                    <p className="auth-footer">
                        Nouveau ici ? <Link to="/signup">Créer un compte</Link>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;