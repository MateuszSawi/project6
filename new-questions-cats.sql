-- ════════════════════════════════════════════════════════════
--  Podmiana dwoch pytan: 'argument' + 'apologize'  ->  'stray-cats' + 'seagull'
--  Uruchom w Supabase: SQL Editor -> wklej caly plik -> Run.
--
--  ZANIM URUCHOMISZ: w kroku 1 stoja moje zgadywanki w kolumnie
--  mateusz_answer. Podmien je na swoje. Dozwolone: 'iza' albo 'mateusz'.
--  Nic innego w tabeli nie jest ruszane — jej odpowiedzi zostaja.
-- ════════════════════════════════════════════════════════════

-- ── 1. Nowe pytania (dopisze; przy powtorce tylko poprawi tresc) ──
insert into public.answers (game, question_id, question, mateusz_answer) values
  ('who-is-more-likely', 'stray-cats', 'Who is more likely to be approached by every stray cat in the city?', 'iza'),
  ('who-is-more-likely', 'seagull',    'Who is more likely to be attacked by a seagull?',                     'mateusz')
on conflict (game, question_id) do update
  set question       = excluded.question,
      mateusz_answer = excluded.mateusz_answer;

-- ── 2. Stare pytania — juz ich nie ma w kodzie, wiec znikaja z bazy ──
delete from public.answers
where game = 'who-is-more-likely'
  and question_id in ('argument', 'apologize');

-- ── 3. Sprawdzenie: powinny wyjsc dwa wiersze z Twoimi odpowiedziami ──
select question_id, question, mateusz_answer, iza_answer
from public.answers
where game = 'who-is-more-likely'
  and question_id in ('stray-cats', 'seagull');

-- ── Gdybys chcial zmienic zdanie pozniej, bez ruszania reszty ────────
-- update public.answers set mateusz_answer = 'mateusz'
--  where game = 'who-is-more-likely' and question_id = 'stray-cats';
