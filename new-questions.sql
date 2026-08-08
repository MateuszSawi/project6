-- ── Poprawka tresci (bezpieczne, nic nie kasuje) ────────────
insert into public.answers (game, question_id, question, mateusz_answer) values
  ('who-is-more-likely', 'apologize',      'Who is more likely to make peace first after an argument?',                     'mateusz')
on conflict (game, question_id) do update
  set question       = excluded.question,
      mateusz_answer = excluded.mateusz_answer;

-- ── Wyciete pytania — wiersze bez odpowiednika w kodzie ─────
delete from public.answers
where game = 'who-is-more-likely'
  and question_id in (
    'movie-sleep', 'lost', 'trouble', 'moods',
    'cry', 'funny', 'oral', 'break-heart'
  );
