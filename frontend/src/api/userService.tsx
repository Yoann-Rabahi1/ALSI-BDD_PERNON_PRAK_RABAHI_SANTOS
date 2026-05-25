import api from './axiosConfig';

// 1. Créer le compte et récupérer l'ID
export const createAccount = async (email : string, password : string, role : string) => {
    const response = await api.post('/users/', {
        mail: email,
        mot_de_passe: password,
        role: role
    });
    return response.data;
};

// 2. Créer le profil propriétaire avec l'ID injecté
export const createProprietaireProfile = async (id_user: number, nom: string, prenom: string, telephone: string) => {
    const response = await api.post('/proprietaires/', {
        nom,
        prenom,
        telephone,
        id_user,
        id_animal: null 
    });
    return response.data;
};