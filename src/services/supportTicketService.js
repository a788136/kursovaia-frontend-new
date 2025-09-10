// src/services/supportTicketService.js
import http from '../api/http';

/**
 * Create support ticket and upload JSON to OneDrive/Dropbox via backend.
 * @param {{summary: string, priority: 'High'|'Average'|'Low', link?: string, template?: string}} data 
 */
export async function createSupportTicket(data) {
  const res = await http.post('/support/tickets', data);
  return res.data;
}
