-- ════════════════════════════════════════════════════════════
--  LICZNIK WEJSC
--
--  Dopisek do bazy, NIE kasuje niczego. Skopiuj calosc, wklej
--  w Supabase -> SQL Editor -> Run. Mozna puszczac wielokrotnie.
--
--  Szesc licznikow: strona glowna i piec podstron z grami.
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
  ('book-trip')
on conflict (key) do nothing;

alter table public.visits enable row level security;

-- Nikt nie czyta tego z przegladarki: liczniki sa dla Ciebie, nie
-- dla odwiedzajacych. Zadnej polityki select, wiec anon nie widzi
-- nic. Pisze wylacznie funkcja nizej.


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
end;
$$;

revoke all on function public.count_visit(text) from public;
grant execute on function public.count_visit(text) to anon;


-- Podglad, wiersz po wierszu:
--   select key, hits, last_at from public.visits order by key;
--
-- Podglad jako jeden wiersz z szescioma polami:
--   select
--     max(hits) filter (where key = 'home')         as home,
--     max(hits) filter (where key = 'runner')       as runner,
--     max(hits) filter (where key = 'guide')        as guide,
--     max(hits) filter (where key = 'likely')       as likely,
--     max(hits) filter (where key = 'upgrade-trip') as upgrade_trip,
--     max(hits) filter (where key = 'book-trip')    as book_trip
--   from public.visits;
--
-- Wyzerowanie przed wyslaniem strony:
--   update public.visits set hits = 0, last_at = null;
--
-- Dolozenie szostej gry:
--   insert into public.visits (key) values ('cos-nowego')
--   on conflict (key) do nothing;
