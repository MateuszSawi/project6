-- ════════════════════════════════════════════════════════════
--  GRA 2 — "A guide to keeping Iza happy in Poland"
--  game = 'guide'
--
--  NIC NIE KASUJE. Dopisuje 21 wierszy z trescia pytan, zebys
--  w tabeli `answers` widzial CO ona wybrala, a nie same id.
--  Uruchom raz w Supabase: SQL Editor -> wklej caly plik -> Run.
--
--  Tabela i funkcje (save_answers / reset_answers) sa te same,
--  co przy pierwszej grze — patrz supabase-setup.sql. Tu nie ma
--  kolumny "moja odpowiedz": w tej grze nie zgaduje, tylko
--  wykonuje. mateusz_answer zostaje puste.
--
--  W iza_answer laduje ID OPCJI (np. 'cafe'), nie jej tresc.
--  Legenda ponizej, przy kazdym pytaniu.
-- ════════════════════════════════════════════════════════════

insert into public.answers (game, question_id, question) values
  -- ── Morning ──────────────────────────────────────────────
  ('guide', 'breakfast',     'Breakfast?  [bed | cafe | skip]'),
  ('guide', 'morning-drink', 'First drink of the day?  [coffee | tea | energy | wine]'),
  ('guide', 'wake',          'How early are we waking up?  [8 | 9 | 10 | sleep]'),

  -- ── Day ──────────────────────────────────────────────────
  ('guide', 'transport',     'Which transport are you picking?  [car | shoulders]'),
  ('guide', 'planning',      'How planned should the trip be?  [planned | chaos | half]'),
  ('guide', 'vibe',          'Pick the vibe:  [romantic | boring]'),
  ('guide', 'rain',          'Weather is terrible. What now?  [movie | gallery | cafe | massage]'),
  ('guide', 'spontaneous',   'One spontaneous thing:  [drive | buy | restaurant]'),

  -- ── Food ─────────────────────────────────────────────────
  ('guide', 'cook',          'Who cooks?  [iza | mateusz | together | order | restaurant]'),
  ('guide', 'dinner',        'What is for dinner?  [shrimps | pasta | sushi | pierogi]'),
  ('guide', 'dessert',       'What is for dessert?  [cake | icecream | polish | iza]'),

  -- ── Evening ──────────────────────────────────────────────
  ('guide', 'sunset',        'Where are we watching the sunset?  [beach | rooftop | outdoor | surprise]'),
  ('guide', 'evening-drink', 'Evening drink?  [wine | cocktails | beer | water]'),
  ('guide', 'movie',         'Movie type?  [horror | comedy | romance | sad]'),
  ('guide', 'music',         'Who is picking the music?  [iza | mateusz | laughing]'),
  ('guide', 'date',          'Where are we going on the date?  [your-job]  (jedna opcja, nie ma z czego wybierac)'),

  -- ── Important matters ────────────────────────────────────
  ('guide', 'temperature',   'Sleeping temperature?  [arctic | normal | albanian]'),
  ('guide', 'blanket',       'Blanket policy?  [separate | share | steal]'),
  ('guide', 'compliments',   'How much am I complimenting you?  [lots | more]'),

  -- ── The trip ─────────────────────────────────────────────
  ('guide', 'first-evening', 'First evening should be:  [restaurant | cooking | movie | asleep]'),
  ('guide', 'last-day',      'What are we doing on the last day?  [slow | trip | home | surprise]')
on conflict (game, question_id) do update
  set question = excluded.question;

-- ── Sprawdzenie: 21 wierszy, iza_answer puste do pierwszego tapniecia ──
select question_id, question, iza_answer, iza_answered_at
from public.answers
where game = 'guide'
order by iza_answered_at nulls last, question_id;

-- ── Czyszczenie jej wyborow przed wyslaniem strony (nic wiecej) ────────
-- update public.answers set iza_answer = null, iza_answered_at = null
--  where game = 'guide';
