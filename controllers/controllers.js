import axios from 'axios';
import { oAuth2Client } from './googleAuth.js';

import axios from 'axios';

export async function getMails(req, res) {
    try {
        const { access_token } = req.user;

        const threadsRes = await axios.get('https://gmail.googleapis.com/gmail/v1/users/me/threads', {
            headers: {
                Authorization: `Bearer ${access_token}`
            },
            params: {
                maxResults: 25,
                labelIds: 'INBOX',
            }
        });

        const threads = threadsRes.data.threads || [];

        const emails = await Promise.all(
            threads.map(async (thread) => {
                const threadDetail = await axios.get(`https://gmail.googleapis.com/gmail/v1/users/me/threads/${thread.id}`, {
                    headers: {
                        Authorization: `Bearer ${access_token}`
                    }
                });

                const message = threadDetail.data.messages[0];
                const headers = message.payload.headers;

                const subject = headers.find(h => h.name === 'Subject')?.value || '(sem assunto)';
                const from = headers.find(h => h.name === 'From')?.value || '(desconhecido)';
                const snippet = message.snippet;

                return {
                    id: thread.id,
                    subject,
                    from,
                    snippet
                };
            })
        );

        res.render('home', { emails });
    } catch (error) {
        console.error("Erro ao buscar emails:", error.response?.data || error.message);
        res.status(500).send("Erro ao buscar emails");
    }
}
