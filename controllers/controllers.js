import axios from 'axios';
import { oAuth2Client } from './googleAuth.js';

import axios from 'axios';
import { oAuth2Client } from './googleAuth.js';

export async function getMails(email) {
  try {
    const url = `https://gmail.googleapis.com/gmail/v1/users/${email}/threads?maxResults=25`;
    const { token } = await oAuth2Client.getAccessToken();

    const config = {
      method: 'get',
      url,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    // 1. Obtem lista de threads
    const response = await axios(config);
    const threads = response.data.threads || [];

    // 2. Para cada thread, busca os detalhes da mensagem
    const emails = await Promise.all(
      threads.map(async (thread) => {
        try {
          const threadDetail = await axios.get(
            `https://gmail.googleapis.com/gmail/v1/users/${email}/threads/${thread.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          const message = threadDetail.data.messages[0]; // primeira mensagem do thread
          const headers = message.payload.headers;

          const subject = headers.find(h => h.name === 'Subject')?.value || '(sem assunto)';
          const from = headers.find(h => h.name === 'From')?.value || '(desconhecido)';
          const snippet = message.snippet || '';
          const body = getMessageBody(message.payload);

          return {
            id: thread.id,
            subject,
            from,
            snippet,
            body,
          };
        } catch (err) {
          console.error('Erro ao obter detalhes do thread:', err.message);
          return null;
        }
      })
    );

    return emails.filter(e => e); // remove nulls
  } catch (error) {
    console.error('Erro ao buscar emails:', error.response?.data || error.message || error);
    return [];
  }
};

function getMessageBody(payload) {
  if (!payload) return '';

  const parts = payload.parts || [];
  const textPart = parts.find(p => p.mimeType === 'text/plain');

  if (textPart && textPart.body?.data) {
    const decoded = Buffer.from(textPart.body.data, 'base64').toString('utf-8');
    return decoded;
  }

  if (payload.body?.data) {
    const decoded = Buffer.from(payload.body.data, 'base64').toString('utf-8');
    return decoded;
  }

  return '';
}
