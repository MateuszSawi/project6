-- ════════════════════════════════════════════════════════════
--  LICZNIK WEJSC
--
--  Dopisek do bazy, NIE kasuje niczego. Skopiuj calosc, wklej
--  w Supabase -> SQL Editor -> Run. Mozna puszczac wielokrotnie.
--
--  Siedem licznikow: strona glowna i szesc podstron z grami,
--  kazdy dodatkowo w rozbiciu na kraje.
--  Liczone sa WEJSCIA NA PODSTRONE, nie klikniecia w kafelke —
--  kafelka moze byc jeszcze zapieczetowana, a adres i tak da sie
--  wpisac recznie, i to nadal jest wejscie.
-- ════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────
--  Adresy, ktore sie nie licza — wspolne dla calej strony
--
--  Ten sam kawalek jest w runner-setup.sql, oba razy jako
--  "if not exists", wiec kolejnosc puszczania plikow nie ma
--  znaczenia. Jedna lista dla licznika wejsc i dla podejsc w
--  runnerze, zeby nie dopisywac nowego adresu w dwoch miejscach.
--
--  RLS wlaczone i CELOWO bez zadnej polityki: klucz anon siedzi
--  w kodzie strony, wiec kazda tabela z polityka select jest
--  publiczna. Ta ma zostac prywatna. Funkcje nizej czytaja ja
--  mimo to, bo sa security definer.
-- ────────────────────────────────────────────────────────────

create table if not exists public.ignored_ip (
  ip   text primary key,
  note text
);

alter table public.ignored_ip enable row level security;

insert into public.ignored_ip (ip, note) values
  ('217.171.61.37', 'komputer'),
  ('31.175.42.26',  'telefon')
on conflict (ip) do nothing;


-- ────────────────────────────────────────────────────────────
--  Liczniki
--
--  Wiersz na licznik, nie kolumna. Szosta gra to wtedy jeden
--  insert zamiast przebudowy tabeli i funkcji. Zapytanie na dole
--  pliku pokazuje to jako jeden wiersz z szescioma polami, jesli
--  wolisz tak patrzec.
-- ────────────────────────────────────────────────────────────

create table if not exists public.visits (
  key      text primary key,
  hits     bigint not null default 0,
  last_at  timestamptz
);

-- Klucze sa zalozone z gory i funkcja nie przyjmie zadnego innego.
-- Bez tego kazdy z kluczem anon moglby zasmiecic tabele dowolnym
-- napisem — a klucz anon jest w kodzie strony.
insert into public.visits (key) values
  ('home'),
  ('runner'),
  ('guide'),
  ('likely'),
  ('upgrade-trip'),
  ('book-trip'),
  ('last')
on conflict (key) do nothing;

alter table public.visits enable row level security;

-- Nikt nie czyta tego z przegladarki: liczniki sa dla Ciebie, nie
-- dla odwiedzajacych. Zadnej polityki select, wiec anon nie widzi
-- nic. Pisze wylacznie funkcja nizej.


-- ────────────────────────────────────────────────────────────
--  To samo w rozbiciu na kraje
--
--  Osobna tabela, a nie kolumna w visits: sumy zostaja tam, gdzie
--  byly, wiec nic co juz dziala sie nie psuje, a rozbicie mozna
--  kiedys skasowac jednym dropem.
--
--  Klucz obcy do visits(key) pelni tu druga role: jest lista
--  dozwolonych kluczy. Nie da sie zalozyc wiersza dla klucza,
--  ktorego nie ma w visits.
--
--  Kraj bierzemy z naglowka cf-ipcountry — Supabase stoi za
--  Cloudflare, wiec przychodzi za darmo, bez pytania kogokolwiek
--  o cokolwiek i bez opozniania strony. Dwie litery ISO, 'XX' gdy
--  Cloudflare nie wie, 'T1' dla Tora, '??' gdy naglowka nie ma
--  wcale. Jesli w tabeli beda same '??', to znaczy ze naglowek nie
--  dochodzi i trzeba innej drogi.
-- ────────────────────────────────────────────────────────────

create table if not exists public.visits_country (
  key      text not null references public.visits(key) on delete cascade,
  country  text not null,
  hits     bigint not null default 0,
  last_at  timestamptz,
  primary key (key, country)
);

alter table public.visits_country enable row level security;


-- Kraj tak, jak podaje go Cloudflare. Osobno, bo czytaja to dwie
-- funkcje — ta i save_runner_best w runner-setup.sql.
create or replace function public.request_country()
returns text
language sql
stable
as $$
  select coalesce(
    nullif(upper(left(trim(
      nullif(current_setting('request.headers', true), '')::json ->> 'cf-ipcountry'
    ), 2)), ''),
    '??'
  );
$$;

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
  -- Adres klienta tak, jak zobaczyl go gateway. inet_client_addr()
  -- zwrocilby adres samego Supabase, bo polaczenie do bazy idzie
  -- stamtad, a nie z przegladarki — PostgREST podstawia oryginalne
  -- naglowki tutaj. x-forwarded-for potrafi byc lancuchem
  -- "klient, proxy, proxy", wiec bierzemy pierwszy element.
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

  -- Zaden insert: nieznany klucz po prostu niczego nie trafia.
  update public.visits
     set hits    = hits + 1,
         last_at = now()
   where key = p_key;

  -- ...i dopiero jesli cos trafil, to samo w rozbiciu na kraje.
  -- Bez tego nieznany klucz wywrocilby sie na kluczu obcym zamiast
  -- po cichu nic nie zrobic.
  if not found then
    return;
  end if;

  insert into public.visits_country (key, country, hits, last_at)
  values (p_key, public.request_country(), 1, now())
  on conflict (key, country) do update
    set hits    = visits_country.hits + 1,
        last_at = now();
end;
$$;

revoke all on function public.count_visit(text) from public;
grant execute on function public.count_visit(text) to anon;


-- Podglad, wiersz po wierszu (czas lokalny, nie UTC):
--   select key, hits, last_at at time zone 'Europe/Warsaw' as last_at_pl
--   from public.visits order by key;
--
-- Skad przychodza:
--   select country, sum(hits) as hits from public.visits_country
--   group by country order by hits desc;
--
-- Kraje na kazdej podstronie osobno:
--   select key, country, hits from public.visits_country
--   order by key, hits desc;
--
-- Podglad jako jeden wiersz z siedmioma polami:
--   select
--     max(hits) filter (where key = 'home')         as home,
--     max(hits) filter (where key = 'runner')       as runner,
--     max(hits) filter (where key = 'guide')        as guide,
--     max(hits) filter (where key = 'likely')       as likely,
--     max(hits) filter (where key = 'upgrade-trip') as upgrade_trip,
--     max(hits) filter (where key = 'book-trip')    as book_trip,
--     max(hits) filter (where key = 'last')         as last_game
--   from public.visits;
--
-- Wyzerowanie przed wyslaniem strony:
--   update public.visits set hits = 0, last_at = null;
--   delete from public.visits_country;
--
-- Dolozenie szostej gry:
--   insert into public.visits (key) values ('cos-nowego')
--   on conflict (key) do nothing;


-- ────────────────────────────────────────────────────────────
--  Diagnostyka: jaki adres widzi baza?
--
--  Wykluczanie po IP dziala tylko wtedy, gdy adres na liscie
--  zgadza sie z tym, ktory dociera do bazy — a adresy domowe i
--  komorkowe potrafia sie zmienic. Tego nie da sie sprawdzic z
--  SQL Editora, bo tam nie ma naglowkow zadania.
--
--  Ponizsze jest CELOWO zakomentowane: to funkcja na chwile, nie
--  na stale. Odkomentuj, puść, otwórz podany adres w przegladarce
--  (na telefonie tez — to zwykly GET, dziala z paska adresu),
--  porownaj z lista, i skasuj funkcje.
--
--  Zwraca sam adres, nie cale naglowki — te zawieraja rowniez
--  klucz autoryzacji i nie ma powodu ich wystawiac.
-- ────────────────────────────────────────────────────────────

-- create or replace function public.moje_ip()
-- returns text
-- language sql
-- stable                       -- musi byc stable, inaczej nie zadziala przez GET
-- security definer
-- set search_path = public
-- as $$
--   select nullif(trim(split_part(coalesce(
--     nullif(current_setting('request.headers', true), '')::json ->> 'cf-connecting-ip',
--     nullif(current_setting('request.headers', true), '')::json ->> 'x-forwarded-for',
--     nullif(current_setting('request.headers', true), '')::json ->> 'x-real-ip',
--     ''), ',', 1)), '') || ' / ' || public.request_country();
-- $$;
-- grant execute on function public.moje_ip() to anon;
--
--   otworz w przegladarce:
--     <NEXT_PUBLIC_SUPABASE_URL>/rest/v1/rpc/moje_ip?apikey=<NEXT_PUBLIC_SUPABASE_ANON_KEY>
--
--   a na koniec:
--     drop function public.moje_ip();
