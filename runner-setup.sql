-- ════════════════════════════════════════════════════════════
--  RUNNER — "Iza on her way to Poland"
--
--  Dopisek do bazy, NIE kasuje niczego. Skopiuj calosc, wklej
--  w Supabase -> SQL Editor -> Run. Mozna puszczac wielokrotnie.
--
--  Trzyma jedna liczbe: najdalszy przejechany dystans w km.
--  Jeden wiersz, bo to rekord jednej osoby, nie tablica wynikow.
-- ════════════════════════════════════════════════════════════

create table if not exists public.runner_best (
  game    text primary key,
  best_km integer not null default 0,
  set_at  timestamptz
);

insert into public.runner_best (game, best_km)
values ('runner', 0)
on conflict (game) do nothing;

alter table public.runner_best enable row level security;

-- Strona CZYTA rekord: pokazuje go na ekranie startowym i przy koncu gry.
drop policy if exists "anon reads runner best" on public.runner_best;
create policy "anon reads runner best"
  on public.runner_best for select to anon using (true);

-- ...ale PISZE wylacznie przez ponizsza funkcje. Zadnego update dla anon,
-- wiec z przegladarki nie da sie rekordu obnizyc ani skasowac.
create or replace function public.save_runner_best(p_km integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_best integer;
begin
  -- Gorna granica jest tu po to, zeby zepsuty klient nie wpisal liczby,
  -- ktorej nie da sie potem pobic. Ponizej zera tez nie schodzimy.
  if p_km is null or p_km < 0 or p_km > 1000000 then
    select best_km into v_best from public.runner_best where game = 'runner';
    return coalesce(v_best, 0);
  end if;

  -- Tylko w gore. Slabszy przejazd nie kasuje lepszego.
  update public.runner_best
     set best_km = greatest(best_km, p_km),
         set_at  = case when p_km > best_km then now() else set_at end
   where game = 'runner'
  returning best_km into v_best;

  return coalesce(v_best, 0);
end;
$$;

revoke all on function public.save_runner_best(integer) from public;
grant execute on function public.save_runner_best(integer) to anon;

-- Podglad:
--   select game, best_km, set_at from public.runner_best;
-- Wyzerowanie rekordu przed wyslaniem strony:
--   update public.runner_best set best_km = 0, set_at = null;
