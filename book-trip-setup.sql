-- ════════════════════════════════════════════════════════════
--  GRA 3 — "Book your trip"
--  game = 'book-trip'
--
--  NIC NIE KASUJE. Dopisuje JEDEN wiersz — bo to jedno pytanie:
--  ktory termin. Uruchom raz w Supabase: SQL Editor -> Run.
--
--  Tabela i funkcje (save_answers / reset_answers) sa te same,
--  co przy pierwszej grze — patrz supabase-setup.sql.
--  mateusz_answer zostaje puste: tu nie ma czego zgadywac.
--
--  W iza_answer laduje ID TERMINU:
--    'sep-15' -> 15-19 wrzesnia, tam wt 13:00-15:20, z powrotem so 12:40-15:00
--    'sep-22' -> 22-26 wrzesnia, tam wt 13:00-15:20, z powrotem so 12:40-15:00
--    'talk'   -> zaden termin nie pasuje, chce pogadac
--
--  UWAGA: gra jest JEDNORAZOWA. Jak juz potwierdzi termin, to
--  strona sie zamyka i ona nie moze tego zmienic. Odblokowanie
--  jest tylko stad — patrz zapytanie na koncu pliku.
-- ════════════════════════════════════════════════════════════

insert into public.answers (game, question_id, question) values
  ('book-trip', 'dates',
   'Ktory termin wybrala?  [sep-15 = 15-19.09 | sep-22 = 22-26.09 | talk = zaden, chce pogadac]')
on conflict (game, question_id) do update
  set question = excluded.question;

-- ── Co wybrala i kiedy (czas polski) ──────────────────────────────────
select
  iza_answer as termin,
  case iza_answer
    when 'sep-15' then '15-19 wrzesnia, wt 13:00-15:20, powrot so 12:40-15:00'
    when 'sep-22' then '22-26 wrzesnia, wt 13:00-15:20, powrot so 12:40-15:00'
    when 'talk'   then 'zaden — chce pogadac'
    else 'jeszcze nie wybrala'
  end as co_to_znaczy,
  iza_answered_at at time zone 'Europe/Warsaw' as kiedy
from public.answers
where game = 'book-trip' and question_id = 'dates';

-- ── ODBLOKOWANIE ──────────────────────────────────────────────────────
--  Jedyny sposob, zeby mogla wybrac jeszcze raz. Po tym strona
--  znowu pokazuje jej dwie karty pokladowe.
--
--   update public.answers set iza_answer = null, iza_answered_at = null
--    where game = 'book-trip' and question_id = 'dates';

-- ── Recznie ustawiony termin (gdybyscie sie dogadali poza strona) ──────
--   update public.answers set iza_answer = 'sep-22', iza_answered_at = now()
--    where game = 'book-trip' and question_id = 'dates';
