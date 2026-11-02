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
| **Itinerary** | Stops grouped by date (Day 1, Day 2, …) and sorted by time. Stops with no date appear under *Not scheduled yet*. Filter by day, area, tag or search text. Tap a card to edit or delete it; **📍 Open in Maps** opens Google Maps in a new tab. |
| **Saved** | Places you might visit. Group them by area or tag, or not at all, and filter by tag or area. **＋ Itinerary** copies a place into the itinerary, and the saved card then shows *✓ In itinerary*. |
| **Expenses** | **New expense** works like the expense_bot form, plus a currency picker (¥ JPY / ₱ PHP / $ USD). **History** shows the total in whichever currency you pick (converted at the day's rates from open.er-api.com), what each person paid and owes, who owes whom, spending by label, and the full list by day. Tap an expense to edit it. |

**Maps links:** paste a Google Maps share link if you have one. If you leave it blank, the button searches Google Maps for *name + area + Tokyo*.

## Customizing

Everything you're likely to change is in the `CUSTOMIZE HERE` block at the top of the script in `index.html`: people, tags, areas, currencies, payment methods, labels and payment tags. To add a currency, add one line, e.g. `KRW: { symbol: "₩", decimals: 0 }`.

## Notes

- The sheet is the source of truth. You can edit rows directly in Google Sheets; tap ↻ in the site to reload.
- Columns are matched by header name, so you can reorder them or add your own columns.
- Anyone with the web-app URL can read and write the sheet. Don't share the `/exec` URL publicly. Note that it is visible in the page source of the GitHub Pages site.
