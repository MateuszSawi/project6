# Supabase — co masz zrobić

**Otwórz [supabase-setup.sql](supabase-setup.sql), skopiuj całość, wklej
w Supabase → SQL Editor → Run.** Można puszczać wielokrotnie, kasuje po sobie
stare podejścia. To wszystko po stronie bazy.

Potem tylko dwie zmienne w `.env.local` (patrz niżej) i restart `npm run dev`.

---

## Jak wygląda tabela

Jedna tabela `answers`, **jeden wiersz = jedno pytanie**. Otwierasz Table
Editor i widzisz wszystko obok siebie:

| game | question_id | question | **mateusz_answer** | **iza_answer** | iza_answered_at |
|---|---|---|---|---|---|
| who-is-more-likely | blanket | Who is more likely to steal the blanket? | `iza` | `mateusz` | 2026-08-07 21:14 |
| who-is-more-likely | kiss | Who is more likely to kiss better? | `iza` | `iza` | 2026-08-07 21:15 |

- **`mateusz_answer` = TWOJA** odpowiedź. Wpisujesz ręcznie, klikając w komórkę
  w Table Editor albo puszczając `INSERT` z końca `supabase-setup.sql`. Na
  razie jest wypełniona losowo, żeby było co testować — podmień na swoje.
- **`iza_answer` = JEJ** odpowiedź. Wpisuje gra, po każdym tapnięciu.
- **`question`** to treść pytania. Aplikacja jej nie używa — jest tylko po to,
  żeby dało się to czytać bez zaglądania w kod.

Wartości w obu kolumnach to `iza` albo `mateusz` (czyli: *kto* jest bardziej
skłonny). Przy pytaniu `lied` jest `yes` / `no`, a moja kolumna zostaje pusta —
to jej pytanie, nie moje.

Kto ile trafił:

```sql
select question, mateusz_answer as ja, iza_answer as ona,
       case when iza_answer = mateusz_answer then '=' else 'x' end as zgoda
from public.answers
where game = 'who-is-more-likely' and iza_answer is not null
order by iza_answered_at;
```

## Bezpieczeństwo

Ze strony **nie da się odczytać jej odpowiedzi**. Tabela ma włączone RLS
i zero polityk, czyli zero bezpośredniego dostępu. Przeglądarka widzi tylko:

- widok `game_questions` — wyłącznie `game`, `question_id`, `mateusz_answer`.
  Jej kolumny w nim po prostu nie ma.
- funkcję `save_answers` — dotyka wyłącznie `iza_answer`.
- funkcję `reset_answers` — czyści wyłącznie `iza_answer`. Twoja kolumna nie
  jest ruszana, więc „Start again" w grze resetuje tylko ją.

## Klucze

Supabase → **Project Settings → API**. **Project URL** i **anon public**
(`service_role` ani „Secret key" nigdy — ten klucz ląduje w przeglądarce).

`.env.local` w katalogu projektu (jest w `.gitignore`):

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Netlify → Site configuration → Environment variables → te same dwie.

> To statyczny eksport, więc `NEXT_PUBLIC_*` są wklejane do bundla **w czasie
> builda**. Po zmianie: redeploy na Netlify, lokalnie restart `npm run dev`.

Bez kluczy strona działa dalej — da się klikać, ale nic się nie zapisuje
i w kolumnie „I said" jest *Not yet*. Strona mówi o tym wprost.

## Jak działa zapis i odczyt

**Baza jest jedyną pamięcią.** Nic nie siedzi w przeglądarce — żadnego
`localStorage`, żadnych ciasteczek.

- **Wejście na stronę** = odczyt obu kolumn. Ona widzi swoje wcześniejsze
  odpowiedzi z dowolnego telefonu i może je tylko zmieniać. Ty, wchodząc na to
  samo, widzisz dokładnie to samo — jej wybory obok swoich.
- **Nic się nie rysuje, dopóki baza nie odpowie.** Przez chwilę jest „Finding
  where you left off…". Bez tego pusty stos wyglądałby jak gra nierozpoczęta
  i dałoby się odpowiedzieć na wierzch tego, co już jest w tabeli.
- **Każde tapnięcie** wysyła cały komplet, nie pojedynczą odpowiedź. Dlatego
  nieudany zapis nie potrzebuje kolejki: następne tapnięcie nadrabia.
- **Przy pasku postępu** mały znaczek: kręcące się kółko, płomienny ✓,
  przekreślona chmurka gdy nie ma zasięgu. Jeśli ostatni zapis nie przeszedł,
  na końcu gry jest „Send them again".
- **Bez zasięgu nie da się grać** — i tak jest napisane wprost, zamiast udawać,
  że zapisało. To cena za jedno źródło prawdy.

## Nowe pytanie / zmiana treści

Pytania są w [lib/games/who-is-more-likely.ts](lib/games/who-is-more-likely.ts).
`text` możesz przepisywać do woli — `id` **nie**, bo to klucz wiersza.
Po dodaniu nowego pytania dopisz mu wiersz w bazie (`insert … on conflict`
z końca `supabase-setup.sql`), inaczej pokaże jej *Not yet* w mojej kolumnie.
