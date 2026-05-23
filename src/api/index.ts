import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';

export const apiRouter = Router();

const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Muitas tentativas de login. Tente novamente mais tarde.' } });
const contactLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { error: 'Muitas mensagens enviadas. Tente novamente mais tarde.' } });

interface DatabaseProject { id: string; title: string; description: string; icon: string; tech: string[]; action_label: string; url: string; sort_order: number; }
interface DatabaseFaq { id: string; question: string; answer: string; sort_order: number; }
interface DatabaseSocial { id: string; platform: string; icon: string; url: string; sort_order: number; }

// Middleware to check auth from cookie
const authMiddleware = async (req: any, res: any, next: any) => {
  const cookieStr = req.headers.cookie || '';
  const cookies = cookieStr.split(';').reduce((acc: any, cookie: string) => {
    if (!cookie) return acc;
    const [key, value] = cookie.split('=').map(c => c.trim());
    if (key && value) {
      acc[key] = value;
    }
    return acc;
  }, {});

  const token = cookies['admin_token'];
  const sbUrl = process.env['SUPABASE_URL'];
  const sbKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_ANON_KEY'];

  if (!sbUrl || !sbKey || !sbUrl.startsWith('http')) {
    res.status(500).json({ error: 'Supabase URL/Key missing' });
    return;
  }

  if (token) {
    const supabase = createClient(sbUrl, sbKey);
    const { data: user, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      res.status(401).json({ error: 'Não autorizado. Token inválido ou expirado.' });
      return;
    }
    req.user = user;
    next();
  } else {
    res.status(401).json({ error: 'Não autorizado. Faça login no CMS.' });
    return;
  }
};

apiRouter.post('/messages', contactLimiter, async (req, res) => {
  const { name, email, message } = req.body;
  
  if (!name || !email || !message) {
    res.status(400).json({ error: 'Todos os campos são obrigatórios' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email) || name.length > 100 || message.length > 2000) {
    res.status(400).json({ error: 'Dados em formato inválido' });
    return;
  }

  const sbUrl = process.env['SUPABASE_URL'];
  const sbKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_ANON_KEY'];

  if (sbUrl && sbKey && sbUrl.startsWith('http')) {
    try {
      const supabase = createClient(sbUrl, sbKey);
      const { error } = await supabase.from('contact_messages').insert([{ name, email, message }]);

      if (error) {
        res.status(500).json({ error: `Supabase error: ${error.message}. Você já criou a tabela?` });
        return;
      }
    } catch (clientError) {
      res.status(500).json({ error: 'Failed to initialize Supabase client.' });
      return;
    }
  }

  // Send Email using Nodemailer pointing to Gmail
  const gmailUser = process.env['GMAIL_USER'];
  const gmailPass = process.env['GMAIL_APP_PASSWORD'];

  if (gmailUser && gmailPass) {
    try {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      });

      const mailOptions = {
        from: `"${name}" <${gmailUser}>`,
        replyTo: email,
        to: gmailUser, // send to your own email Let's use gmailUser
        subject: `Novo contato via Portfólio: ${name}`,
        text: `Nome: ${name}\nE-mail: ${email}\n\nMensagem:\n${message}`,
        html: `<p><strong>Nome:</strong> ${name}</p>
               <p><strong>E-mail:</strong> ${email}</p>
               <p><strong>Mensagem:</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`
      };

      await transporter.sendMail(mailOptions);
    } catch (e) {
      console.error('Failed to send email:', e);
      // We still want to return a success to the user that the message was received by the system.
    }
  }

  res.status(200).json({ success: true });
});

apiRouter.post('/login', loginLimiter, async (req, res) => {
  const { email, password } = req.body;
  const sbUrl = process.env['SUPABASE_URL'];
  const sbKey = process.env['SUPABASE_ANON_KEY'] || process.env['SUPABASE_SERVICE_ROLE_KEY'];

  if (!sbUrl || !sbKey || !sbUrl.startsWith('http')) {
    res.status(500).json({ error: 'Supabase URL/Key missing' });
    return;
  }

  try {
    const supabase = createClient(sbUrl, sbKey);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      res.status(401).json({ error: error.message });
      return;
    }
    
    res.cookie('admin_token', data.session.access_token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
    
    res.status(200).json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

apiRouter.post('/logout', (req, res) => {
    res.clearCookie('admin_token', {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
    });
    res.status(200).json({ success: true });
});

apiRouter.get('/auth/status', authMiddleware, (req, res) => {
    res.status(200).json({ success: true });
});

apiRouter.get('/content', async (req, res) => {
  const sbUrl = process.env['SUPABASE_URL'];
  const sbKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_ANON_KEY'];

  if (!sbUrl || !sbKey || !sbUrl.startsWith('http')) {
    res.status(404).json({ error: 'Supabase URL/Key missing' });
    return;
  }

  try {
    const supabase = createClient(sbUrl, sbKey);
    
    const [settingsRes, projectsRes, faqsRes, socialsRes] = await Promise.all([
      supabase.from('portfolio_settings').select('*').eq('id', 1).single(),
      supabase.from('portfolio_projects').select('*').order('sort_order', { ascending: true }),
      supabase.from('portfolio_faqs').select('*').order('sort_order', { ascending: true }),
      supabase.from('portfolio_socials').select('*').order('sort_order', { ascending: true })
    ]);

    if (settingsRes.error && settingsRes.error.code !== 'PGRST116') {
       res.status(500).json({ error: `Erro no Supabase: ${settingsRes.error.message}. Você já criou as tabelas no SQL Editor?` });
       return;
    }

    if (settingsRes.error?.code === 'PGRST116') {
       res.status(404).json({ error: 'Content not found' });
       return;
    }

    const rawSettings = settingsRes.data || {};
    
    const combinedData = {
      config: { name: rawSettings.config_name || 'Luiz.' },
      home: {
        greeting: rawSettings.home_greeting || '',
        headline: rawSettings.home_headline || '',
        description: rawSettings.home_description || '',
        ctaLabel: rawSettings.home_cta_label || ''
      },
      about: {
        text1: rawSettings.about_text1 || '',
        text2: rawSettings.about_text2 || '',
        skills: rawSettings.about_skills || []
      },
      contact: {
        title: rawSettings.contact_title || '',
        description: rawSettings.contact_description || '',
        email: rawSettings.contact_email || '',
        footerText: rawSettings.contact_footer_text || ''
      },
      projects: (projectsRes.data || []).map((p: DatabaseProject) => ({
        id: p.id, title: p.title, description: p.description, 
        icon: p.icon, tech: p.tech, actionLabel: p.action_label, url: p.url
      })),
      faqs: (faqsRes.data || []).map((f: DatabaseFaq) => ({
        id: f.id, question: f.question, answer: f.answer
      })),
      socials: (socialsRes.data || []).map((s: DatabaseSocial) => ({
        id: s.id, platform: s.platform, icon: s.icon, url: s.url
      }))
    };

    res.status(200).json(combinedData);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

apiRouter.post('/content', authMiddleware, async (req, res) => {
  const content = req.body;
  const sbUrl = process.env['SUPABASE_URL'];
  const sbKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_ANON_KEY'];

  try {
    const supabase = createClient(sbUrl as string, sbKey as string);

    const settingsPayload = {
      id: 1,
      config_name: content.config.name,
      home_greeting: content.home.greeting,
      home_headline: content.home.headline,
      home_description: content.home.description,
      home_cta_label: content.home.ctaLabel,
      about_text1: content.about.text1,
      about_text2: content.about.text2,
      about_skills: content.about.skills,
      contact_title: content.contact.title,
      contact_description: content.contact.description,
      contact_email: content.contact.email,
      contact_footer_text: content.contact.footerText,
      updated_at: new Date().toISOString()
    };

    const projectsPayload: DatabaseProject[] = (content.projects || []).map((p: any, i: number) => ({
      id: p.id || crypto.randomUUID(),
      title: p.title, description: p.description, icon: p.icon, 
      tech: p.tech, action_label: p.actionLabel, url: p.url, sort_order: i
    }));

    const faqsPayload: DatabaseFaq[] = (content.faqs || []).map((f: any, i: number) => ({
      id: f.id || crypto.randomUUID(),
      question: f.question, answer: f.answer, sort_order: i
    }));

    const socialsPayload: DatabaseSocial[] = (content.socials || []).map((s: any, i: number) => ({
      id: s.id || crypto.randomUUID(),
      platform: s.platform, icon: s.icon, url: s.url, sort_order: i
    }));

    const { error: settingsError } = await supabase.from('portfolio_settings').upsert(settingsPayload);
    if (settingsError) throw new Error(`Settings table: ${settingsError.message}`);

    const syncTable = async (tableName: string, payload: any[]) => {
        const { data: existingIds } = await supabase.from(tableName).select('id');
        const payloadIds = payload.map(item => item.id);
        const idsToDelete = existingIds?.map((item: {id: string}) => item.id).filter((id: string) => !payloadIds.includes(id)) || [];
        
        if (idsToDelete.length > 0) {
           const { error: delError } = await supabase.from(tableName).delete().in('id', idsToDelete);
           if (delError) throw new Error(`${tableName} delete: ${delError.message}`);
        }
        
        if(payload.length > 0) {
           const { error } = await supabase.from(tableName).upsert(payload, { onConflict: 'id' });
           if (error) throw new Error(`${tableName} upsert: ${error.message}`);
        }
    };

    await syncTable('portfolio_projects', projectsPayload);
    await syncTable('portfolio_faqs', faqsPayload);
    await syncTable('portfolio_socials', socialsPayload);
    
    res.status(200).json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: `Falha ao salvar: ${e.message}` });
  }
});
