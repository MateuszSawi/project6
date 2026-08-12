-- ════════════════════════════════════════════════════════════
--  ODSIEWANIE BOTOW
--
--  Dopisek do bazy, NIE kasuje niczego. Odpal CALOSC naraz —
--  Supabase -> SQL Editor -> wklej -> Run. Mozna puszczac
--  wielokrotnie, nic sie nie zdubluje.
--
--  Wymaga wczesniejszego runner-setup.sql i visits-setup.sql,
--  bo podmienia funkcje, ktore tamte zakladaja.
--
--  Po czym poznajemy bota: po user-agencie, nie po adresie.
--  Adresy Google zmieniaja sie ciagle, nazwa nie — Googlebot
--  przedstawia sie tak samo od lat.
-- ════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────
--  Lista wzorcow
--
--  Osobna tabela, zeby dopisanie nowego bota bylo jednym
--  insertem, a nie przeklejaniem funkcji. Porownanie jest
--  fragmentem, malymi literami: wystarczy ze wzorzec wystepuje
--  gdziekolwiek w user-agencie.
-- ────────────────────────────────────────────────────────────

create table if not exists public.bot_pattern (
  pattern text primary key,
  note    text
);

alter table public.bot_pattern enable row level security;

insert into public.bot_pattern (pattern, note) values
  -- Google. CELOWO nie samo "google": user-agent aplikacji Google
  -- i Gmaila na Androidzie tez je zawiera, a to sa prawdziwi ludzie.
  ('googlebot',              'wyszukiwarka'),
  ('google-safety',          'skaner bezpieczenstwa'),
  ('googleother',            'pobieraczka Google'),
  ('google-inspectiontool',  'Search Console'),
  ('apis-google',            'uslugi Google'),
  ('mediapartners-google',   'AdSense'),
  ('adsbot-google',          'reklamy'),
  ('feedfetcher-google',     'czytnik'),
  ('google favicon',         'pobieranie ikony'),
  ('google web preview',     'podglad'),
  ('chrome-lighthouse',      'audyt wydajnosci'),
  ('pagespeed',              'audyt wydajnosci'),

  -- Ogolne. "bot" lapie wiekszosc crawlerow za jednym zamachem
  -- i nie wystepuje w user-agencie zadnej normalnej przegladarki.
  ('bot',                    'cokolwiek z bot w nazwie'),
  ('crawl',                  'crawlery'),
  ('spider',                 'crawlery'),
  ('slurp',                  'Yahoo'),
  ('headless',               'przegladarka bez okna — skanery'),
  ('archive.org',            'archiwum'),
  ('ia_archiver',            'archiwum'),

  -- Podglady linkow w komunikatorach. Wchodza po wklejeniu linku
  -- i ignoruja robots.txt, bo dzialaja w imieniu czlowieka.
  ('facebookexternalhit',    'Facebook / Messenger'),
  ('whatsapp',               'WhatsApp'),
  ('telegrambot',            'Telegram'),
  ('discordbot',             'Discord'),
  ('slackbot',               'Slack'),
  ('twitterbot',             'Twitter / X'),
  ('skypeuripreview',        'Skype'),
  ('linkedinbot',            'LinkedIn'),

  -- Skrypty i narzedzia. Zadne z nich nie jest przegladarka.
  ('curl/',                  'curl'),
  ('wget',                   'wget'),
  ('python-requests',        'skrypt'),
  ('python-urllib',          'skrypt'),
  ('scrapy',                 'skrypt'),
  ('axios',                  'skrypt'),
  ('node-fetch',             'skrypt'),
  ('go-http-client',         'skrypt'),
  ('okhttp',                 'skrypt'),
  ('libwww',                 'skrypt'),

  -- Monitoring i SEO.
  ('uptime',                 'monitoring'),
  ('pingdom',                'monitoring'),
  ('semrush',                'SEO'),
  ('ahrefs',                 'SEO'),
  ('mj12',                   'SEO'),
  ('dotbot',                 'SEO'),
  ('bytespider',             'TikTok'),
  ('petalbot',               'Huawei'),
  ('yandex',                 'Yandex'),
  ('baidu',                  'Baidu'),
  ('applebot',               'Apple')
on conflict (pattern) do nothing;


-- ────────────────────────────────────────────────────────────
--  Rozpoznanie
-- ────────────────────────────────────────────────────────────

create or replace function public.request_agent()
returns text
language sql
stable
as $$
  select lower(coalesce(
    nullif(current_setting('request.headers', true), '')::json ->> 'user-agent',
    ''));
$$;

-- Uwaga: wywolane z SQL Editora zwroci TRUE, bo tam nie ma zadnych
-- naglowkow, wiec user-agent jest pusty. To nie blad — pusty
-- user-agent to prawie zawsze skrypt. Skutek uboczny: recznego
-- "select count_visit('home')" z Edytora juz nie policzy. Sposob na
-- sprawdzenie, ze wszystko dziala, jest na dole pliku.
create or replace function public.is_bot()
returns boolean
language sql
stable
-- MUSI byc security definer: bot_pattern ma wlaczone RLS bez zadnej
-- polityki, wiec wywolana jako anon nie zobaczylaby ani jednego wzorca
-- i odpowiadalaby "to nie bot" na wszystko. Wywolana z wnetrza
-- count_visit (ktora jest security definer) widzialaby je, ale nie ma
-- powodu, zeby ta funkcja dawala rozna odpowiedz zaleznie od tego,
-- skad ja zawolano — a bez tego nie da sie jej tez przetestowac wprost.
security definer
set search_path = public
as $$
  select public.request_agent() = ''
      or exists (
           select 1 from public.bot_pattern
            where position(pattern in public.request_agent()) > 0
         );
$$;


-- ────────────────────────────────────────────────────────────
--  Co odsialismy
--
--  Bez tego nie da sie odroznic "filtr dziala" od "nikt nie
--  wchodzil". Nazwy sa obcinane do 200 znakow i grupuja sie same.
-- ────────────────────────────────────────────────────────────

create table if not exists public.bot_seen (
  agent   text primary key,
  hits    bigint not null default 0,
  last_at timestamptz
);

alter table public.bot_seen enable row level security;


-- ────────────────────────────────────────────────────────────
--  Podmiana funkcji — te same co wczesniej, plus odsiew
-- ────────────────────────────────────────────────────────────

create or replace function public.count_visit(p_key text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_headers json;
  v_ip      text;
begin
  -- Bot: zapisujemy sam fakt i wychodzimy. Zadnego licznika.
  if public.is_bot() then
    insert into public.bot_seen (agent, hits, last_at)
    values (left(coalesce(public.request_agent(), '(brak)'), 200), 1, now())
    on conflict (agent) do update
      set hits = bot_seen.hits + 1, last_at = now();
    return;
  end if;

  v_headers := nullif(current_setting('request.headers', true), '')::json;
  v_ip := nullif(trim(split_part(
    coalesce(
      v_headers ->> 'cf-connecting-ip',
      v_headers ->> 'x-forwarded-for',
      v_headers ->> 'x-real-ip',
      ''
    ), ',', 1)), '');

  if exists (select 1 from public.ignored_ip where ip = v_ip) then
    return;
  end if;

  update public.visits
     set hits = hits + 1, last_at = now()
   where key = p_key;

  if not found then
    return;
  end if;

  insert into public.visits_country (key, country, hits, last_at)
  values (p_key, public.request_country(), 1, now())
  on conflict (key, country) do update
    set hits = visits_country.hits + 1, last_at = now();
end;
$$;

revoke all on function public.count_visit(text) from public;
grant execute on function public.count_visit(text) to anon;


create or replace function public.save_runner_best(p_km integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_best    integer;
  v_headers json;
  v_ip      text;
  v_skip    boolean;
begin
  if p_km is null or p_km < 0 or p_km > 1000000 then
    select best_km into v_best from public.runner_best where game = 'runner';
    return coalesce(v_best, 0);
  end if;

  v_headers := nullif(current_setting('request.headers', true), '')::json;
  v_ip := nullif(trim(split_part(
    coalesce(
      v_headers ->> 'cf-connecting-ip',
      v_headers ->> 'x-forwarded-for',
      v_headers ->> 'x-real-ip',
      ''
    ), ',', 1)), '');

  -- Nie liczy sie ani z Twoich adresow, ani od bota.
  v_skip := public.is_bot()
         or exists (select 1 from public.ignored_ip where ip = v_ip);

  update public.runner_best
     set best_km  = greatest(best_km, p_km),
         set_at   = case when p_km > best_km then now() else set_at end,
         attempts = coalesce(attempts, 0) + case when v_skip then 0 else 1 end
   where game = 'runner'
  returning best_km into v_best;

  if not v_skip then
    insert into public.runner_attempt_country (country, attempts, last_at)
    values (public.request_country(), 1, now())
    on conflict (country) do update
      set attempts = runner_attempt_country.attempts + 1, last_at = now();
  end if;

  return coalesce(v_best, 0);
end;
$$;

revoke all on function public.save_runner_best(integer) from public;
grant execute on function public.save_runner_best(integer) to anon;


-- ════════════════════════════════════════════════════════════
--  PODGLAD
--
--  Kto byl z Albanii:
--    select key, hits, last_at at time zone 'Europe/Warsaw' as kiedy_pl
--    from public.visits_country where country = 'AL'
--    order by last_at desc;
--
--  Co odsialismy — jesli to rosnie, filtr dziala:
--    select agent, hits, last_at at time zone 'Europe/Warsaw' as kiedy_pl
--    from public.bot_seen order by hits desc;
--
--  Dopisanie nowego bota, gdy zobaczysz go w licznikach:
--    insert into public.bot_pattern (pattern, note)
--    values ('jakis-fragment', 'skad') on conflict do nothing;
--
--  Cofniecie odsiewu (gdyby wycinal za duzo):
--    delete from public.bot_pattern where pattern = 'bot';
--
--  Wyzerowanie wszystkiego przed wyslaniem strony:
--    update public.runner_best set best_km = 0, attempts = 0, set_at = null;
--    update public.visits set hits = 0, last_at = null;
--    delete from public.visits_country;
--    delete from public.runner_attempt_country;
--    delete from public.bot_seen;
-- ════════════════════════════════════════════════════════════
