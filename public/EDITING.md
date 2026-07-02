# Updating the Wallaroo FC Website

A guide for committee members. **No code, no technical jargon.** If you can fill in a form, you can update the website.

## Quick map

| What you want to change | Where to go |
|---|---|
| The round number / next match | **Homepage — Round & Next Match** |
| The 6 grade fixtures shown this week | **This Week — Per-Grade Fixtures** |
| Ladders after a round | **Ladders** |
| Latest match results | **Round Results** |
| Add a news article | **News Articles** |
| WFNC social calendar | **Social Calendar** |
| Add a sponsor | **Sponsors** |
| Finals series fixtures | **Finals Series** |

You'll find all of these listed on the left side of the admin screen.

## Getting in

1. Go to **wallaroofc.com.au/admin/**
2. Click **Login with GitHub** and use the account the club admin set up for you. *(One-time: a club admin grants you access — see the section below.)*
3. You'll land on a dashboard listing every section of the site you can edit.

## The weekly routine (every Monday after a round)

Plan to spend about 15 minutes. Do these in order:

### 1. Update the round number

Open **Homepage — Round & Next Match → Current Round Setup**.

- Change **Current round number** from last week's to this week's (e.g. 5 → 6).
- Update **Current week date** (top banner), **Next match date**, **Next match bounce**, **Next match venue**, **Home or away?**, **Opponent club**, **Opponent display name**, **Opponent record line**, **Wallaroo's record line**.
- Update **This-week section venue label** (e.g. "Ardrossan Oval") and **This-week venue badge** (e.g. "AWAY ROUND" or "HOME ROUND").
- Click **Save** then **Publish**.

### 2. Update the 6 grade fixtures

Open **This Week — Per-Grade Fixtures**. There are six entries (A-Grade, B Grade, Senior Colts, Junior Colts, U11, U9). For each:

- Confirm the bounce time and AM/PM.
- Confirm home / away club slugs and display names.
- Tick **Is the match at Wallaroo Oval?** if it's a home match.
- Save + Publish.

### 3. Update the four ladders

Open **Ladders**. There are four entries (A-Grade, B Grade, Senior Colts, Junior Colts). For each:

- Set **After round** to the round just played.
- For each row, update **Played / Won / Lost / Percentage** (or **Points** for the colts ladders).
- Make sure the **Highlight** box stays ticked on Wallaroo's row.
- Re-order rows if needed by dragging.
- Save + Publish.

### 4. Add the round's results

Open **Round Results → New Round**.

- **Round number** + **Date**.
- Add each match under **Games**: grade, both team names, both scores (in the format `9.13 (67)`), and the margin.
- For the bye, set **Grade** to "Bye" and fill in **Bye team**, leaving the other fields blank.
- Save + Publish.

*The homepage results ticker automatically shows whichever round has the highest round number.*

### 5. (Optional) Add a match report

Open **News Articles → New Article**.

- **Title**: e.g. "Bulldogs hold on for tight win over Bute"
- **Category**: RESULT
- **Date**: today
- **Summary**: one or two sentences for the homepage tile
- **Hero image**: upload a match photo if you have one (optional)
- **Body**: write the match report

Save + Publish.

The 3 most recent news items appear automatically on the homepage. Older ones live on `/news/`.

## Less-frequent edits

### Season fixtures (start of season)

Open **Season Fixtures**. The 18 rounds are pre-loaded for the 2026 season. If the YPFL reshuffles a round, open that round and update the date or opponent. You can also create new rounds (e.g. R19 if the league adds one) via **New Fixture**.

When a round becomes the current week, set its **Status** to `now`. After it's played, set it to `past`. Leave it blank for upcoming rounds.

### Finals series

Open **Finals Series**. Once finals venues are known, edit each entry:

- Tick **Wallaroo Oval hosts?** if Wallaroo is hosting that final.
- Tick **Is this the Grand Final?** on the Grand Final card.

### Social calendar

Open **Social Calendar**. The 18 rounds are pre-loaded with current event hosts. For "Club to confirm" entries, update the **Host** and **Venue** when finalised. Tick **Featured event** for big-ticket items (Bulldog Ball, Reunions, etc.) to highlight them in red.

### Sponsors

Open **Sponsors → New Sponsor**.

- **Sponsor name**: the display name as it should appear on the website
- **Tier**: platinum, gold, silver, or bronze (Platinum & Gold show on the homepage; Silver & Bronze only on `/sponsors/`)
- **Website**: optional sponsor link
- **Order within tier**: lower numbers appear first (use this for premium platinum placement)

To remove a sponsor, open them and click the **Delete** button at the bottom.

## What can't be edited via this admin

The following are deliberately in the code (not via this UI), because they almost never change. **Tell the developer if you need them updated:**

- Club roster (the 9 YPFL clubs and their crests)
- Game-day info cards (gates open, parking, canteen menu, etc.)
- Junior pathway stages (Auskick → A-Grade)
- Volunteer role list
- Premiership year list and heritage stats
- Hero copy ("HOME OF THE BULLDOGS", "159 winters…")
- Acknowledgment of Country
- Footer link structure

## When changes go live

When you click **Publish**, your change is committed to the website's source repository on GitHub. Cloudflare Pages then rebuilds the site automatically — **usually within 2 minutes**. Refresh the live site to see your change.

If a change doesn't appear after 5 minutes, ask the club admin to check the build status.

## Uploading photos

In any field that accepts an image (e.g. news article hero image), click **Choose an image** then drag-drop or upload. Photos are saved in the website's photo library and can be reused.

**Best practice for match-day photos:**

- Crop to landscape (e.g. 1600×900 px or similar)
- File size under 500 KB if possible (use a free tool like [Squoosh](https://squoosh.app/) to compress)
- Descriptive filename like `r6-vs-ardrossan-mark-takes-mark.jpg`

The website automatically generates phone-sized and high-resolution versions of every uploaded photo — you only need to upload once at high quality.

## Troubleshooting

**"I clicked Save but nothing changed on the website."**
You need to **Publish** as well as **Save**. Save is a draft; Publish commits it.

**"The site shows old data after I published."**
Cloudflare's build takes about 60–120 seconds. Wait a minute and refresh.

**"I broke something — how do I undo?"**
Every change is a Git commit. Ask the club admin or developer to roll back; nothing is permanently lost.

**"I can't log in."**
Make sure you've been added as a collaborator on the GitHub repo. The club admin can do this from GitHub.

---

## For the club admin (one-time setup)

This section is for whoever runs the GitHub side of things.

### Granting an editor access

1. Go to **github.com/wallaroofc/wallaroofc.com.au/settings/access**
2. Click **Invite a collaborator** and enter their GitHub username (have them create an account first if they don't have one).
3. They'll get an email; once they accept they can log in at `wallaroofc.com.au/admin/`.

### Setting up the GitHub OAuth (one-time, by developer)

The Decap CMS admin uses Decap's hosted OAuth proxy at `api.decapcms.org` — no OAuth app of your own needed. Just make sure:

- `public/admin/config.yml` has the correct `backend.repo` value (e.g. `wallaroofc/wallaroofc.com.au`)
- The GitHub repo is private OR public — both work
- Each editor has been added as a collaborator on the repo

### Local editing (no internet)

If you ever need to edit content offline:

```bash
# Terminal 1
npx decap-server

# Terminal 2
npm run dev
```

Visit `http://localhost:4321/admin/`. Decap will edit your local files directly and you can commit when you're back online. Used mainly by developers — the committee should stick to the web UI.
