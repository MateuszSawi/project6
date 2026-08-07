-- ════════════════════════════════════════════════════════════
--  UWAGA: TEN SKRYPT KASUJE TABELE I WSZYSTKO, CO W NIEJ JEST.
--  Pierwsza linia to `drop table ... cascade`, wiec razem z nia
--  znikaja odpowiedzi Izy. To skrypt "od zera", nie aktualizacja.
--
--  Dodajesz nowe pytanie? Uzyj samego `insert ... on conflict`
--  z konca tego pliku (wzor: new-questions.sql). Nic nie kasuje,
--  dopisuje brakujace wiersze i poprawia istniejace.
--
--  Chcesz tylko wyczyscic jej odpowiedzi przed wyslaniem strony?
--    update public.answers set iza_answer = null, iza_answered_at = null;
-- ════════════════════════════════════════════════════════════
--  JEDNA TABELA. JEDEN WIERSZ = JEDNO PYTANIE.
--  mateusz_answer -> TWOJA odpowiedz, wpisujesz recznie
--  iza_answer     -> JEJ odpowiedz, wpisuje gra po kazdym tapnieciu
-- ════════════════════════════════════════════════════════════

-- Stare podejscia, jesli jeszcze sa.
drop table if exists public.answers cascade;
drop table if exists public.my_answers cascade;
drop table if exists public.game_results cascade;
drop function if exists public.save_result(text, text, jsonb, text);

create table public.answers (
  game            text not null,
  question_id     text not null,
  question        text,          -- tresc pytania, zebys wiedzial co czytasz
  mateusz_answer  text,          -- TY. Wpisujesz recznie.
  iza_answer      text,          -- ONA. Wpisuje gra.
  iza_answered_at timestamptz,   -- kiedy odpowiedziala
  primary key (game, question_id)
);

-- Widok z poprzedniej wersji, juz niepotrzebny.
drop view if exists public.game_questions;

alter table public.answers enable row level security;

-- Strona CZYTA cala tabele: to jest pamiec gry. Dzieki temu ona widzi swoje
-- odpowiedzi po powrocie z dowolnego telefonu, nie tylko z tego jednego.
drop policy if exists "anon reads answers" on public.answers;
create policy "anon reads answers"
  on public.answers for select to anon using (true);

-- ...ale PISZE wylacznie przez ponizsze funkcje. Zadnego insert/update dla
-- anon: moja kolumna, tresci pytan i cudze gry sa nie do ruszenia z zewnatrz.

-- Zapis jej odpowiedzi. Dotyka wylacznie iza_answer.
create or replace function public.save_answers(p_game text, p_answers jsonb)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.answers (game, question_id, iza_answer, iza_answered_at)
  select p_game, key, value, now()
  from jsonb_each_text(p_answers)
  on conflict (game, question_id) do update
    set iza_answer = excluded.iza_answer, iza_answered_at = now();
$$;

-- "Start again" w grze. Czysci TYLKO jej kolumne.
create or replace function public.reset_answers(p_game text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.answers
     set iza_answer = null, iza_answered_at = null
   where game = p_game;
$$;

revoke all on function public.save_answers(text, jsonb)  from public;
revoke all on function public.reset_answers(text)        from public;
grant execute on function public.save_answers(text, jsonb) to anon;
grant execute on function public.reset_answers(text)       to anon;

-- ── Pytania + TWOJE odpowiedzi (na razie wypelnione na losowo) ──
insert into public.answers (game, question_id, question, mateusz_answer) values
  ('who-is-more-likely', 'movie-sleep',    'Who is more likely to fall asleep during a movie?',                             'iza'),
  ('who-is-more-likely', 'lost',           'Who is more likely to get us lost?',                                            'mateusz'),
  ('who-is-more-likely', 'trouble',        'Who is more likely to have to keep the other out of trouble?',                    'mateusz'),
  ('who-is-more-likely', 'ruin-plan',      'Who is more likely to ruin the plan?',                                          'iza'),
  ('who-is-more-likely', 'blanket',        'Who is more likely to steal the blanket?',                                      'iza'),
  ('who-is-more-likely', 'drunk',          'Who is more likely to get drunk first?',                                        'iza'),
  ('who-is-more-likely', 'bad-idea',       'Who is more likely to say “this was a bad idea” and secretly love it?',         'mateusz'),
  ('who-is-more-likely', 'argument',       'Who is more likely to start an argument over nothing?',                         'iza'),
  ('who-is-more-likely', 'getting-ready',  'Who is more likely to spend more time getting ready in the morning?',           'iza'),
  ('who-is-more-likely', 'responsible',    'Who is more likely to be the responsible one?',                                 'mateusz'),
  ('who-is-more-likely', 'pay',            'Who is more likely to pay for everything?',                                     'mateusz'),
  ('who-is-more-likely', 'arrested',       'Who is more likely to get arrested?',                                           'mateusz'),
  ('who-is-more-likely', 'moods',          'Who is more likely not to survive the trip?',                                     'mateusz'),
  ('who-is-more-likely', 'carry',          'Who is more likely to carry the other in their arms?',                          'mateusz'),
  ('who-is-more-likely', 'ass',            'Who is more likely to have better ass?',                                        'iza'),
  ('who-is-more-likely', 'cry',            'Who is more likely to cry at a sad movie?',                                     'iza'),
  ('who-is-more-likely', 'horror',         'Who is more likely to shit themselves from fear while watching a horror?',      'mateusz'),
  ('who-is-more-likely', 'dance',          'Who is more likely to dance in the kitchen?',                                   'iza'),
  ('who-is-more-likely', 'funny',          'Who is more likely to have to pretend that Iza is funny?',                      'mateusz'),
  ('who-is-more-likely', 'sing',           'Who is more likely to sing in the shower?',                                     'mateusz'),
  ('who-is-more-likely', 'danger',         'Who is more likely to be in danger because of the other?',                      'mateusz'),
  ('who-is-more-likely', 'lose-mind',      'Who is more likely to lose their mind ?',                                       'iza'),
  ('who-is-more-likely', 'cheat-game',     'Who is more likely to cheat at a game?',                                        'iza'),
  ('who-is-more-likely', 'five-minutes',   'Who is more likely to say “5 more minutes” and sleep another hour?',            'iza'),
  ('who-is-more-likely', 'first-move',     'Who is more likely to make the first move?',                                    'mateusz'),
  ('who-is-more-likely', 'jealous',        'Who is more likely to get jealous?',                                            'iza'),
  ('who-is-more-likely', 'flirt',          'Who is more likely to do more of the flirting?',                                'iza'),
  ('who-is-more-likely', 'apologize',      'Who is more likely to make peace first after Iza does something wrong?',   'mateusz'),
  ('who-is-more-likely', 'wrong',          'Who is more likely to admit they were wrong first?',                            'mateusz'),
  ('who-is-more-likely', 'prove',          'Who is more likely to have to prove themselves to the other?',                    'mateusz'),
  ('who-is-more-likely', 'miss-first',     'Who is more likely to miss the other one first?',                               'mateusz'),
  ('who-is-more-likely', 'hugs',           'Who is more likely to give better hugs?',                                       'mateusz'),
  ('who-is-more-likely', 'kiss',           'Who is more likely to kiss better?',                                            'iza'),
  ('who-is-more-likely', 'surprise',       'Who is more likely to plan a ridiculous surprise?',                             'mateusz'),
  ('who-is-more-likely', 'pretend',        'Who is more likely to pretend they don’t give a fuck when they obviously do?',  'iza'),
  ('who-is-more-likely', 'love-first',     'Who is more likely to steal the other’s heart?',                                'mateusz'),
  ('who-is-more-likely', 'break-heart',    'Who is more likely to break the other’s heart?',                                'iza'),
  ('who-is-more-likely', 'one-more-day',   'Who is more likely to want one more day together?',                             'mateusz'),
  ('who-is-more-likely', 'oral',           'Who is more likely to give better oral?',                                       'mateusz'),
  ('who-is-more-likely', 'obsessed',       'Who is more likely to become obsessed with the other’s country?',               'mateusz'),
  ('who-is-more-likely', 'move',           'Who is more likely to move to Albania/Poland because of someone?',              'mateusz'),
  ('who-is-more-likely', 'lied',           'Did you lie at least once during the test?',                                    null)
on conflict (game, question_id) do update
  set question       = excluded.question,
      mateusz_answer = excluded.mateusz_answer;
