import { redirect } from 'next/navigation';
import { requireChatGPTUser } from './chatgpt-auth';

const ADMIN_EMAIL = 'contato.joycemagia@gmail.com';

export async function requireDashboardAdmin(returnTo = '/painel') {
  const user = await requireChatGPTUser(returnTo);
  if (user.email.toLowerCase() !== ADMIN_EMAIL) redirect('/');
  return user;
}

