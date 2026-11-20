# Classroom Comeback website: go-live order

Custom-coded static site (HTML, CSS, a little JavaScript). No builder, no framework, no monthly fees. Hosted on GitHub Pages at **classroomcomeback.com**.

## What's in this folder

| File | What it is |
|---|---|
| `index.html` | Home page: hero, mission, services, who we serve, process, before/after carousel, testimonials, pricing, vision teaser, inquiry form |
| `vision.html` | Military-connected children vision page (independent vision, with non-affiliation disclaimer) |
| `404.html` | Not-found page |
| `assets/styles.css` | All styling. Brand colors are the tokens at the top of the file |
| `assets/site.js` | Behavior. **Two settings at the top:** `LEADS_ENDPOINT` and `BOOKING_URL` |
| `assets/logo-placeholder.svg`, `favicon.svg` | Placeholder logo until the real files arrive |
| `lead-tracker/Code.gs` | Google Apps Script that logs every inquiry to a Google Sheet and emails the leads inbox |
| `CNAME` | Tells GitHub Pages to serve the site at classroomcomeback.com |

---

## Step by step

### 1. Review the design (now)
Look over the screenshots and the files. Changes are cheap at this stage. Shavonda's palette can be swapped in later by editing the color tokens at the top of `assets/styles.css`; nothing else needs to change.

### 2. Create the GitHub repository (Erica, 1 minute)
On GitHub, create a new **empty public** repository under `beepboop-lettuce` named **`classroomcomeback-site`** (no README). Tell Claude when it exists, and Claude will push the site to it.

### 3. Turn on GitHub Pages (Erica, 2 minutes)
Repo → **Settings → Pages** → Source: *Deploy from a branch* → Branch: `main`, folder `/ (root)` → Save.
Under **Custom domain**, enter `classroomcomeback.com` and save.

### 4. Verify the domain with GitHub (recommended, 5 minutes)
Your profile → **Settings → Pages → Add a domain** → `classroomcomeback.com`. GitHub shows a TXT record. Add it in Squarespace (step 5) and click Verify. This stops anyone else from ever pointing a GitHub site at your domain.

### 5. Point the domain at GitHub (Erica, in Squarespace Domains → DNS)
**Do not delete the MX or email-related TXT records.** Those run classroomcomeback@classroomcomeback.com. Only remove any old A records for `@` and the `www` CNAME if Squarespace added defaults pointing at a Squarespace site.

Add:

| Type | Host | Value |
|---|---|---|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| AAAA | @ | 2606:50c0:8000::153 |
| AAAA | @ | 2606:50c0:8001::153 |
| AAAA | @ | 2606:50c0:8002::153 |
| AAAA | @ | 2606:50c0:8003::153 |
| CNAME | www | beepboop-lettuce.github.io |

DNS usually updates within an hour, occasionally up to 24 hours.

### 6. Turn on HTTPS
Back in repo **Settings → Pages**, once the domain check passes, tick **Enforce HTTPS**. The site is live.

### 7. Set up the lead tracker (Erica, about 10 minutes)
Every inquiry goes to the leads email **and** into a Google Sheet that follows SOP CC-SOP-001 (date, contact, organization, location, lead type, service, classrooms, challenges, timeline, budget, referral, assigned owner, stage, next action, follow-up date).

1. Signed into the **Classroom Comeback business Google account** (ideally the one tied to the leads inbox, not a personal or assistant account, so the business owns its own lead data), create a Google Sheet named **Classroom Comeback Lead Tracker**.
2. **Extensions → Apps Script**. Delete the sample code, paste in all of `lead-tracker/Code.gs`, save.
3. Pick the `setup` function in the toolbar and click **Run**. Approve the permissions (Sheets and send email as you). A **Leads** tab appears with headers and stage/owner dropdowns.
4. **Deploy → New deployment → Web app**. Execute as: **Me**. Who has access: **Anyone**. Deploy and copy the URL ending in `/exec`.
5. Send that URL to Claude (or paste it into `LEADS_ENDPOINT` in `assets/site.js`).

Until step 7 is done, the form still works: it opens the visitor's email app addressed to the leads inbox with their answers filled in. So no lead is lost if the site goes live first.

The form has a hidden spam trap, and the script blocks spreadsheet formula injection.

### 8. Add the booking link
Create a discovery-call scheduler (Calendly free plan, or a Google Calendar appointment schedule) and send the link. It goes in `BOOKING_URL` in `assets/site.js`, and every "Book a call" button starts using it. Until then those buttons scroll to the inquiry form.

### 9. Swap in the real assets
- **Logo:** send SVG or high-resolution PNG files. They replace `assets/logo-placeholder.svg` and `favicon.svg`.
- **Before/after photos:** pairs taken from the same angle work best for the slider, landscape, at least 1600px wide. Name them like `project1-before.jpg` / `project1-after.jpg`, plus a project name, location, and one-line scope for each.
- **Testimonials:** the exact quote, name, role, and school, plus the client's written OK to publish (an email is fine).
- **Social share image:** once the logo is in, Claude adds a 1200×630 preview image so links look good when shared.

### 10. Shavonda's review
The site can be live before she sees it. Collect her notes (palette, wording) and Claude applies them in one pass.

### 11. After the LLC is filed
Update the footer copyright to the legal name (for example "Classroom Comeback LLC") and add Google Search Console so the site shows up properly in search.

---

## Notes and guardrails
- No statistics or research claims are on the site yet. Add them only with a source once the research thread delivers.
- The vision page says plainly that this is an independent vision with no government or military affiliation. Keep that disclaimer on any page that discusses the military-base idea.
- Testimonials stay as clearly marked placeholders until real, approved quotes arrive. Never publish invented quotes.
- No links to or from shavondalawson.com.
