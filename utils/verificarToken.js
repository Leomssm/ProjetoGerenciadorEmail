import axios from 'axios';

export const verificarGoogleToken = async (idToken) => {
    try {
        const { data } = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
        return data;
    } catch (error) {
        console.error("Erro ao verificar token do Google:", error.message);
        return null;
    }
};
