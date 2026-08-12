-- ════════════════════════════════════════════════════════════
--  RUNNER — "Iza on her way to Poland"
--
--  Dopisek do bazy, NIE kasuje niczego. Skopiuj calosc, wklej
--  w Supabase -> SQL Editor -> Run. Mozna puszczac wielokrotnie.
--
--  Trzyma dwie liczby: najdalszy przejechany dystans w km oraz
--  ilosc podejsc. Jeden wiersz, bo to rekord jednej osoby, nie
--  tablica wynikow. Podejscia dodatkowo w rozbiciu na kraje.
-- ════════════════════════════════════════════════════════════

create table if not exists public.runner_best (
  game    text primary key,
  best_km integer not null default 0,
  set_at  timestamptz
);

-- Licznik podejsc. Osobnym krokiem, zeby ten plik dalo sie puscic
-- na bazie, ktora powstala przed jego dodaniem.
alter table public.runner_best
  add column if not exists attempts bigint default 0;

update public.runner_best set attempts = 0 where attempts is null;

insert into public.runner_best (game, best_km, attempts)
values ('runner', 0, 0)
on conflict (game) do nothing;

alter table public.runner_best enable row level security;

-- Strona CZYTA rekord: pokazuje go na ekranie startowym i przy koncu gry.
drop policy if exists "anon reads runner best" on public.runner_best;
create policy "anon reads runner best"
  on public.runner_best for select to anon using (true);


-- ────────────────────────────────────────────────────────────
--  Adresy, ktore nie licza sie do podejsc
--
--  Ta sama tabela obsluguje licznik wejsc — ten sam kawalek jest
--  w visits-setup.sql, oba razy jako "if not exists", wiec
--  kolejnosc puszczania plikow nie ma znaczenia. Jedna lista, zeby
--  nie dopisywac nowego adresu w dwoch miejscach.
--
--  RLS wlaczone i CELOWO bez zadnej polityki: klucz anon siedzi
--  w kodzie strony, wiec kazdy moglby przeczytac kazda tabele,
--  ktora ma polityke select. Ta ma zostac prywatna. Funkcja
--  nizej czyta ja mimo to, bo jest security definer.
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

-- 2001:4860:7:224::f4 NIE jest tu dopisane celowo — patrz uwaga
-- pod plikiem. Jesli to jednak Twoj adres:
--   insert into public.ignored_ip (ip, note)
--   values ('2001:4860:7:224::f4', 'telefon v6') on conflict do nothing;


-- ────────────────────────────────────────────────────────────
--  Podejscia w rozbiciu na kraje
--
--  Osobna tabela, bo runner_best to jeden wiersz i kraj nie ma
--  gdzie sie w nim zmiescic. Suma zostaje tam gdzie byla.
--
--  request_country() jest w obu plikach, oba razy jako "create or
--  replace" z ta sama trescia — tak jak ignored_ip, wiec kolejnosc
--  puszczania nie ma znaczenia. Kraj bierze sie z naglowka
--  cf-ipcountry, ktory Cloudflare doklada przed Supabase.
-- ────────────────────────────────────────────────────────────

create table if not exists public.runner_attempt_country (
  country  text primary key,
  attempts bigint not null default 0,
  last_at  timestamptz
);

alter table public.runner_attempt_country enable row level security;

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


-- ────────────────────────────────────────────────────────────
--  Zapis. Strona PISZE wylacznie przez ta funkcje — zadnego
--  update dla anon, wiec z przegladarki nie da sie rekordu
--  obnizyc ani skasowac.
-- ────────────────────────────────────────────────────────────

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
  v_mine    boolean;
begin
  -- Gorna granica jest tu po to, zeby zepsuty klient nie wpisal liczby,
  -- ktorej nie da sie potem pobic. Ponizej zera tez nie schodzimy.
  -- Taki przejazd nie liczy sie tez jako podejscie.
  if p_km is null or p_km < 0 or p_km > 1000000 then
    select best_km into v_best from public.runner_best where game = 'runner';
    return coalesce(v_best, 0);
  end if;

  -- Adres klienta tak, jak zobaczyl go gateway. inet_client_addr() zwrocilby
  -- adres samego Supabase, bo polaczenie do bazy idzie stamtad, a nie z
  -- przegladarki — PostgREST podstawia oryginalne naglowki tutaj.
  -- x-forwarded-for potrafi byc lancuchem "klient, proxy, proxy", wiec
  -- bierzemy pierwszy element.
  v_headers := nullif(current_setting('request.headers', true), '')::json;
  v_ip := nullif(trim(split_part(
    coalesce(
      v_headers ->> 'cf-connecting-ip',
      v_headers ->> 'x-forwarded-for',
      v_headers ->> 'x-real-ip',
      ''
    ), ',', 1)), '');

  select exists (
    select 1 from public.ignored_ip where ip = v_ip
  ) into v_mine;

  update public.runner_best
     set best_km  = greatest(best_km, p_km),
         set_at   = case when p_km > best_km then now() else set_at end,
         -- Rekord zapisuje sie z kazdego adresu; nie licza sie tylko
         -- podejscia z Twoich.
         attempts = coalesce(attempts, 0) + case when v_mine then 0 else 1 end
   where game = 'runner'
  returning best_km into v_best;

  -- To samo podejscie, tylko z kraju. Wylaczone adresy pomijamy tak
  -- samo jak w sumie wyzej — inaczej rozbicie nie zgadzaloby sie z nia.
  if not v_mine then
    insert into public.runner_attempt_country (country, attempts, last_at)
    values (public.request_country(), 1, now())
    on conflict (country) do update
      set attempts = runner_attempt_country.attempts + 1,
          last_at  = now();
  end if;

  return coalesce(v_best, 0);
end;
$$;

revoke all on function public.save_runner_best(integer) from public;
grant execute on function public.save_runner_best(integer) to anon;

-- Podglad (czas lokalny, nie UTC):
--   select game, best_km, attempts,
--          set_at at time zone 'Europe/Warsaw' as set_at_pl
--   from public.runner_best;
-- Skad probowano:
--   select country, attempts from public.runner_attempt_country
--   order by attempts desc;
-- Wyzerowanie przed wyslaniem strony:
--   update public.runner_best set best_km = 0, attempts = 0, set_at = null;
--   delete from public.runner_attempt_country;
-- Sprawdzenie, jaki adres widzi baza (odpal z przegladarki, nie z SQL
-- Editora — tam naglowkow nie ma):
--   select current_setting('request.headers', true);
