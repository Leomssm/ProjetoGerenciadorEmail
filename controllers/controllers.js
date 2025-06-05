import axios from 'axios';
import { oAuth2Client } from './googleAuth.js';

export async function getMails(email) {
  try {
    const { token } = await oAuth2Client.getAccessToken();

    const threadsResponse = await axios({
      method: 'get',
      url: `https://gmail.googleapis.com/gmail/v1/users/${email}/threads?maxResults=25`,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const threads = threadsResponse.data.threads || [];
    console.log(threads);
    const emails = [];

    for (const thread of threads) {
      const threadId = thread.id;

      const messageResponse = await axios({
        method: 'get',
        url: `https://gmail.googleapis.com/gmail/v1/users/${email}/threads/${threadId}?format=full`,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const message = messageResponse.data.messages?.[0];
      if (!message) continue;

      const headers = message.payload.headers;
      console.log(headers);
      const subject = headers.find(h => h.name === 'Subject')?.value || '(Sem Assunto)';
      const from = headers.find(h => h.name === 'From')?.value || '(Remetente desconhecido)';
      const snippet = message.snippet || '';

      emails.push({
        id: threadId,
        subject,
        from,
        snippet,
      });
    }

    return emails;
  } catch (error) {
    console.error('Erro ao buscar emails:', error.response?.data || error.message || error);
    return [];
  }
}