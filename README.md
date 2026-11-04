# 🗾 Japan

Trip planner: **Itinerary**, **Saved** places and **Expenses**. It's a single `index.html` page hosted on GitHub Pages, and a Google Sheet is the database (connected through `Code.gs`).

## One-time setup

1. **Create the sheet.** Make a new Google Sheet (name it anything, e.g. *Japan Trip*).
2. **Add the script.** In the sheet, open **Extensions → Apps Script**. Delete the starter code, paste in all of `Code.gs`, and save.
3. **Create the tabs.** Choose `setup` in the function dropdown, click **Run**, and approve the permissions prompt. This creates the `Itinerary`, `Saved` and `Expenses` tabs with their headers.
4. **Deploy.** Click **Deploy → New deployment**, pick the type **Web app**, and set:
   - Execute as: **Me**
   - Who has access: **Anyone**

   Click **Deploy** and copy the **Web app URL** (it ends in `/exec`).
5. **Connect the site.** In `index.html`, paste that URL into the line near the top of the script:
   ```js
   const API_URL = "https://script.google.com/macros/s/…/exec";
   ```
6. **Publish.** Push to `github.com/lhendg/japan`, then in the repo go to **Settings → Pages → Deploy from branch → `main` / root**. The site goes live at **https://lhendg.github.io/japan/**.

Until `API_URL` is set, the site runs in **demo mode**: data is saved only in that browser, and an orange banner says so.

> **Changed `Code.gs` later?** Use **Deploy → Manage deployments → ✏️ → Version: New version → Deploy**. This keeps the same URL. Choosing *New deployment* instead gives you a new URL, which you'd then have to paste into `index.html` again.

## Using it

| Tab | What it does |
|---|---|
| **Itinerary** | Stops grouped by date (Day 1, Day 2, …). Every stop needs a start day, picked from a Day dropdown (Day 1 · Nov 8 …); the time is optional. Set an end day only for stops that run over several days. Each day is sorted by time, with stops that have no time at the end, until you reorder it with ▲ ▼ or the *Order* field (1 shows first). Then the day keeps your order, so you can put sightseeing between a morning stop and an evening train. Filter by day, area, tag or search text. Tap a card to edit or delete it; **📍 Open in Maps** opens Google Maps in a new tab. |
| **Schedule** | A calendar view of one day, with hours down the side (24-hour clock). Only stops with a start time show; stops with no time stay in Itinerary only. A start and end time fill that span, a start time alone shows a 30-minute block, and overlapping stops sit side by side. Stops lasting several days show in a strip above the hours. Pick a day from the chips at the top (the same day as the Itinerary's Day filter) and tap a block to edit it. |
| **Saved** | Places you might visit. Group them by area or tag, or not at all, and filter by tag or area. **＋ Itinerary** copies a place into the itinerary, and the saved card then shows *✓ In itinerary*. |
| **Expenses** | **New expense** works like the expense_bot form, plus a currency picker (¥ JPY / ₱ PHP / $ USD). **History** shows the total in whichever currency you pick (converted at the day's rates from open.er-api.com), what each person paid and owes, who owes whom, spending by label, and the full list by day. Tap an expense to edit it. |

**Flag:** in the form, *🟠 Flagged* makes a card orange (like the DAY pill) so it stands out; on the Schedule tab it's a solid orange block. *⚪ Optional* greys a card out with a dashed border and an *Optional* pill, for maybe-stops. It's saved in the sheet's `color` column (`orange` / `grey`).

**Links:** a card shows **📍 Maps** only when you paste a Maps link. Add as many *Other links* as you like (tickets, website, menu) with **＋ Add link**; each becomes a **🔗** button named by its button name, or by the site's name if you leave that blank. They're stored as a list in the sheet's `links` column.

## Customizing

Everything you're likely to change is in the `CUSTOMIZE HERE` block at the top of the script in `index.html`: people, trip dates (`TRIP_START` / `TRIP_END`, which set Day 1 and the days in the Day filter), cities and areas, tags, currencies, payment methods, labels and payment tags. To add a currency, add one line, e.g. `KRW: { symbol: "₩", decimals: 0 }`.

## Notes

- The sheet is the source of truth. You can edit rows directly in Google Sheets; tap ↻ in the site to reload.
- Columns are matched by header name, so you can reorder them or add your own columns.
- Anyone with the web-app URL can read and write the sheet. Don't share the `/exec` URL publicly. Note that it is visible in the page source of the GitHub Pages site.
