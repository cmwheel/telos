# Telos

A personal operating system for the long game. Built for Charlie Wheeler, July 2026.

*Telos* (τέλος): Greek for "ultimate purpose" — the end a thing is designed for.

## What it is

A single-page PWA that tracks the **system, not the plate**. No calorie logging, no food
surveillance, no streaks that can be lost. The design encodes five principles drawn from
Charlie's own life-design documents:

1. **Shame-proof math.** The headline metrics are *recovery rate* (hard days turned around
   by the next day) and *urges defeated*. Showing up after a bad day is how you score —
   the shame-avoidance loop that kills tracking apps is mathematically impossible here.
2. **The weld stays cut.** A slip never colors the day. Keystone wins (movement, kitchen
   closed, phone lines, faith) are scored independently of eating. A bad meal and a good
   workout can both be true on the same day.
3. **Vision delivered, not remembered.** The "I'm being pulled" button opens a Break Glass
   flow: a letter from calm Charlie, a 15-minute urge timer, and concrete escape actions.
   Outlasting an urge logs a permanent point on the board.
4. **Compassion as a performance tool.** Slips answered with the friend-voice are tracked,
   because self-compassion measurably reduces the next collapse and contempt loads it.
5. **Faith-framed accountability.** A weekly summary for Jackson, generated from real data,
   framed as stewardship — a witness, not a parole officer.

## Running it

```bash
python3 -m http.server 4173
# open http://localhost:4173
```

## Getting it on your iPhone (one-time, ~5 minutes)

The offline magic (service worker) only activates on **https** or localhost, so the
right move is free static hosting — then the app lives on your phone permanently,
works offline, and never needs your Mac again:

1. Push this repo to GitHub (private is fine):
   `git remote add origin <your-repo-url> && git push -u origin main`
2. On GitHub: **Settings → Pages → Source: main branch, / (root)** → Save.
3. Open the Pages URL in Safari on your phone → Share → **Add to Home Screen**.

It installs as a standalone app with the Telos icon. After the first load it works
fully offline. All data lives in localStorage **on the device** — nothing is sent
anywhere. Use **More → Data → Export backup** every few weeks.

(Serving over local Wi-Fi from your Mac also works for trying it out, but iOS won't
cache it offline over plain http — use Pages for the permanent install.)

## Dynamic Island timer (optional, one-time setup)

Web apps can't create Live Activities, so the Break Glass screen has a
**"Mirror on the iOS timer"** link that runs a Shortcut which starts the native
iOS timer — and *that* one shows in the Dynamic Island and on the Lock Screen.

One-time setup on your iPhone:

1. Open **Shortcuts** → **+** → name it exactly **Telos Wave**.
2. Add the action **Set timer** (Clock).
3. Tap the duration → **Select Variable → Shortcut Input** (so it uses the
   minutes Telos passes in). If that feels fiddly, just hard-code 15 minutes.
4. Done. Tapping the link in Telos now starts the countdown in the Island.

Even without this, the in-app wave timer survives closing the app: the end time
is persisted, and reopening Telos drops you straight back into the countdown at
the correct remaining time.

## Views

- **Today** — daily win boxes, slip check-in, one thing that went right (60 seconds)
- **Board** — urges defeated, recovery rate, calendar with recovery rings
- **Vision** — the letter from calm Charlie, identity statement, editable win boxes
- **Review** — Sunday review questions + Jackson summary generator
- **Print** — monthly wall chart and wallet-sized "way of escape" card
