-- ════════════════════════════════════════════════════════════
--  GRA 4 — "Upgrade your trip"
--  game = 'upgrade-trip'
--
--  NIC NIE KASUJE. Dopisuje 5 wierszy — po jednym na kategorie.
--  Uruchom raz w Supabase: SQL Editor -> wklej caly plik -> Run.
--
--  Tabela i funkcje (save_answers / reset_answers) sa te same,
--  co przy pierwszej grze — patrz supabase-setup.sql.
--  mateusz_answer zostaje puste: tu nie ma czego zgadywac.
--
--  UWAGA — TU JEST WIELOKROTNY WYBOR. W iza_answer laduje LISTA
--  id opcji po przecinku, np.  'flower,plushie'  albo  'sweets'.
--  Kolejnosc jest taka, jak na ekranie, nie jak klikala.
--
--  NIE DA SIE POMINAC KATEGORII. Z kazdej musi cos wziac —
--  przycisk "dalej" nie dziala, dopoki nie zaznaczy chociaz
--  jednej rzeczy. Wiec kompletna gra to 5 wierszy, kazdy z
--  co najmniej jednym id.
--
--  Myslnik  '-'  to NIE blad. Znaczy: "odklikala wszystko
--  w kategorii, w ktorej juz cos miala". Gra czyta to jak
--  pusta kategorie i wraca ja tam — z takim wierszem nie da
--  sie przejsc dalej, wiec nie zostaje jako odpowiedz.
-- ════════════════════════════════════════════════════════════

insert into public.answers (game, question_id, question) values
  ('upgrade-trip', 'gift',
   'Welcome gift  [flower | warm | plushie | surprise]'),

  ('upgrade-trip', 'snacks',
   'Snacks waiting for you at home  [sweets | fruit | junk | everything]'),

  ('upgrade-trip', 'privileges',
   'Princess privileges  [breakfast | sleep | music | doors]'),

  ('upgrade-trip', 'complain',
   'Things you are allowed to complain about  [weather | food | compliments | everything]'),

  ('upgrade-trip', 'important',
   'The most important stuff  [hugs | laugh | massage | carried]')
on conflict (game, question_id) do update
  set question = excluded.question;

-- ── Co wzięła, kategoria po kategorii ─────────────────────────────────
select
  question_id as kategoria,
  question    as opcje,
  case
    when iza_answer is null then 'jeszcze nie doszla'
    when iza_answer = '-'   then 'odklikala wszystko — dla gry to nadal puste'
    else iza_answer
  end as wybor,
  iza_answered_at at time zone 'Europe/Warsaw' as kiedy
from public.answers
where game = 'upgrade-trip'
order by question_id;

-- ── Ile lacznie sobie dolozyla ────────────────────────────────────────
select coalesce(sum(
         case when iza_answer is null or iza_answer = '-' then 0
              else array_length(string_to_array(iza_answer, ','), 1)
         end), 0) as ile_upgradow
from public.answers
where game = 'upgrade-trip';

-- ── Czyszczenie jej wyborow (jej kolumna, nic wiecej) ─────────────────
--   update public.answers set iza_answer = null, iza_answered_at = null
--    where game = 'upgrade-trip';
