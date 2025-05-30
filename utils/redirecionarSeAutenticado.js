import { verificarGoogleToken } from './verificarToken.js';

export const redirecionarSeAutenticado = async (req, res, next) => {
    try {
        const token = req.cookies.session;

        if (!token) {
            return next();
        }

        const payload = await verificarGoogleToken(token);

        if (!payload) {
            return next();
        }
        
        return res.redirect('/home');
    } catch (error) {
        console.error("Erro ao verificar autenticação:", error.message);
        return next();
    }
};
