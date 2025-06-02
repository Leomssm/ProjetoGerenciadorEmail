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

    const response = await axios(config);
    return response.data.threads || [];
  } catch (error) {
    console.error('Erro ao buscar emails:', error.response?.data || error.message || error);
    return [];
  }
};