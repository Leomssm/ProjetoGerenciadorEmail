import { verificarGoogleToken } from '../utils/verificarToken.js';
import sql from '../db/db.js';

export const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies.session;

        if (!token) {
            return res.redirect('/login');
        }

        const payload = await verificarGoogleToken(token);

        if (!payload) {
            return res.redirect('/login');
        }

        const { sub: googleId } = payload;

        const result = await sql`
            SELECT * FROM usuarios WHERE google_id = ${googleId}
        `;

        if (result.length === 0) {
            return res.redirect('/login');
        }

        req.user = result[0];
        next();
    } catch (error) {
        console.error("Erro na autenticação:", error.message);
        return res.redirect('/login');
    }
};