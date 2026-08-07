-- ── Poprawki tresci (bezpieczne, nic nie kasuje) ────────────
insert into public.answers (game, question_id, question, mateusz_answer) values
  ('who-is-more-likely', 'prove',          'Who is more likely to have to prove themselves to the other?',                  'mateusz'),
  ('who-is-more-likely', 'trouble',        'Who is more likely to have to keep the other out of trouble?',                  'mateusz'),
  ('who-is-more-likely', 'apologize',      'Who is more likely to make peace first after Iza does something wrong?',        'mateusz'),
  ('who-is-more-likely', 'moods',          'Who is more likely not to survive the trip?',                                   'mateusz'),
  ('who-is-more-likely', 'love-first',     'Who is more likely to steal the other’s heart?',                                'mateusz')
on conflict (game, question_id) do update
  set question       = excluded.question,
      mateusz_answer = excluded.mateusz_answer;

-- ── Wyciete pytania i stare id — wiersze bez odpowiednika w kodzie ──
delete from public.answers
where game = 'who-is-more-likely'
  and question_id in (
    'plan', 'try-harder',                                   -- zmienione id
    'lose-mind', 'cheat-game', 'five-minutes', 'wrong',     -- wyciete
    'move', 'dance', 'blanket', 'getting-ready', 'danger',
    'ruin-plan', 'pay'
  );
