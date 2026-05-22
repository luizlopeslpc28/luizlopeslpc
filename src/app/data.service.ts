import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface Project {
  id: string;
  title: string;
  description: string;
  icon: string;
  tech: string[];
  actionLabel: string;
  url?: string;
}

export interface Faq {
  id: string;
  question: string;
  answer: string;
}

export interface Social {
  id: string;
  platform: string;
  icon: string;
  url: string;
}

export interface AppData {
  config: {
    name: string;
  };
  home: {
    greeting: string;
    headline: string;
    description: string;
    ctaLabel: string;
  };
  about: {
    text1: string;
    text2: string;
    skills: string[];
  };
  projects: Project[];
  faqs: Faq[];
  socials: Social[];
  contact: {
    title: string;
    description: string;
    email: string;
    footerText: string;
  };
}

export const defaultData: AppData = {
  config: {
    name: 'Luiz.'
  },
  home: {
    greeting: 'Olá, eu sou Luiz 👋',
    headline: 'Sistemas de gestão, automação de dados e organização.',
    description: 'Transformo dados complexos em ferramentas eficientes, criando fluxos otimizados e aplicações inteligentes para facilitar o dia a dia.',
    ctaLabel: 'Ver Projetos'
  },
  about: {
    text1: 'Sou apaixonado por organizar informações e construir ferramentas que realmente resolvem problemas. Acredito firmemente que a tecnologia deve simplificar processos e não criar novas complexidades e barreiras para o negócio.',
    text2: 'Minhas experiências com modelagem de banco de dados e integrações me permitem identificar gargalos rapidamente e desenhar soluções unificadas, garantindo integridade e confiabilidade em cada sistema.',
    skills: ['AppSheet', 'Google Sheets', 'Modelagem de Banco de Dados', 'Lógica de Precificação', 'Gestão de Estoque', 'UI/UX Design']
  },
  projects: [
    {
      id: '1',
      title: 'Sistema de Gestão de Estoque',
      description: 'Um catálogo consolidado para bazar que unifica modelos de produtos, exibe quantidades totais e organiza a natureza dos itens de forma automatizada.',
      icon: 'lucide:package',
      tech: ['AppSheet', 'Google Sheets', 'Automação'],
      actionLabel: 'Acessar Sistema',
      url: '#'
    },
    {
      id: '2',
      title: 'Automação de Precificação',
      description: 'Sistema que aplica estratégias de markup (aumentos percentuais em massa) e formata automaticamente dados financeiros integrados a banco de dados.',
      icon: 'lucide:circle-dollar-sign',
      tech: ['Google Sheets', 'Lógica de Negócios'],
      actionLabel: 'Ver Lógica',
      url: '#'
    },
    {
      id: '3',
      title: 'Dashboard de Vendas',
      description: 'Painel interativo para análise de vendas, cruzando dados de múltiplos canais para fornecer insights acionáveis sobre performance e metas.',
      icon: 'lucide:bar-chart',
      tech: ['Modelagem de Dados', 'Visualização'],
      actionLabel: 'Visualizar Dashboard',
      url: '#'
    }
  ],
  faqs: [
    {
      id: '1',
      question: 'Quais tipos de sistemas você desenvolve?',
      answer: 'Especializo-me em ferramentas eficientes de controle de estoque, automações para precificação em massa e painéis gerenciais focados em resultados, desenvolvidas majoritariamente com soluções low-code e planilhas.'
    },
    {
      id: '2',
      question: 'Você atende negócios de qual porte?',
      answer: 'Ajudo principalmente pequenos e médios empreendedores (bazar, lojistas, prestadores de serviços) que precisam urgentemente colocar ordem na casa para crescer sem depender de processos engessados.'
    }
  ],
  socials: [
    { id: '1', platform: 'LinkedIn', icon: 'lucide:linkedin', url: '#' },
    { id: '2', platform: 'GitHub', icon: 'lucide:github', url: '#' }
  ],
  contact: {
    title: 'Vamos conversar?',
    description: 'Estou sempre aberto a novas conexões e parcerias. Se você tem um projeto em mente ou precisa organizar os dados da sua empresa, me chame na caixa de entrada.',
    email: 'desenvolveluiz@gmail.com',
    footerText: '© 2026 Luiz • Desenvolvedor & Especialista UI/UX'
  }
};

@Injectable({ providedIn: 'root' })
export class DataService {
  private platformId = inject(PLATFORM_ID);
  private http = inject(HttpClient);
  
  data = signal<AppData>(defaultData);

  constructor() {
    this.loadData();
  }

  private async loadData() {
    try {
      const baseUrl = isPlatformServer(this.platformId) ? (process.env['APP_URL'] || 'http://0.0.0.0:3000') : '';
      const response = await firstValueFrom(this.http.get<any>(`${baseUrl}/api/content`, { withCredentials: true }));
      if (response && response.config) {
        this.data.set(response);
      }
    } catch (e) {
      console.error('Failed to load CMS data from Supabase API', e);
    }
  }

  async updateData(newData: AppData) {
    await firstValueFrom(this.http.post<any>('/api/content', newData, { withCredentials: true }));
    this.data.set(newData);
  }
}
