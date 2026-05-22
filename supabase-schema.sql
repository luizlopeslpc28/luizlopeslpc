-- Estrutura de Banco de Dados para o Portfólio

-- 1. Criação da tabela para receber mensagens de contato
CREATE TABLE public.contact_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  CONSTRAINT contact_messages_pkey PRIMARY KEY (id)
);

-- Habilita o RLS na tabela de mensagens
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- 2. Sistema do CMS (Múltiplas Tabelas)

-- Tabela Configurações Gerais
CREATE TABLE public.portfolio_settings (
  id integer NOT NULL DEFAULT 1,
  config_name text NOT NULL,
  home_greeting text NOT NULL,
  home_headline text NOT NULL,
  home_description text NOT NULL,
  home_cta_label text NOT NULL,
  about_text1 text NOT NULL,
  about_text2 text NOT NULL,
  about_skills text[] NOT NULL,
  contact_title text NOT NULL,
  contact_description text NOT NULL,
  contact_email text NOT NULL,
  contact_footer_text text NOT NULL,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT portfolio_settings_pkey PRIMARY KEY (id)
);

-- Tabela de Projetos
CREATE TABLE public.portfolio_projects (
  id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  tech text[] NOT NULL,
  action_label text NOT NULL,
  url text,
  sort_order integer,
  CONSTRAINT portfolio_projects_pkey PRIMARY KEY (id)
);

-- Tabela de Dúvidas (Faqs)
CREATE TABLE public.portfolio_faqs (
  id text NOT NULL,
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer,
  CONSTRAINT portfolio_faqs_pkey PRIMARY KEY (id)
);

-- Tabela de Redes Sociais
CREATE TABLE public.portfolio_socials (
  id text NOT NULL,
  platform text NOT NULL,
  icon text NOT NULL,
  url text NOT NULL,
  sort_order integer,
  CONSTRAINT portfolio_socials_pkey PRIMARY KEY (id)
);

-- Habilitando RLS para segurança (backend via server.ts lida com a chave service_role bypassando RLS)
ALTER TABLE public.portfolio_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_socials ENABLE ROW LEVEL SECURITY;
