import api from './axiosConfig';

// userService.ts
export const registerUserFull = async (formData: any) => {
    // formData contient : email, password, role, nom, prenom, phone
    const response = await api.post('/signup-full', {
        mail: formData.email,
        mot_de_passe: formData.password,
        role: formData.role,
        nom: formData.nom,
        prenom: formData.prenom,
        telephone: formData.phone
    });
    return response.data;
};