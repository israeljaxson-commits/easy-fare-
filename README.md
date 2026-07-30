# Easy Fare — Flight Fare Comparison Site

A simple flight fare search site (like Skyscanner) powered by the Duffel API.

## What's included
- `server.js` — backend that talks to Duffel's live fare search, caches results, and normalizes the data
- `public/index.html` — the actual website: search form + results list, all in one file
- `.env.example` — template for your Duffel token

## How to run this on your computer

1. **Install Node.js** (if you haven't) from https://nodejs.org — get the LTS version.

2. **Unzip/copy this folder** somewhere on your computer, then open a terminal in that folder.

3. **Install dependencies**:
   ```
   npm install
   ```

4. **Set up your token**:
   - Copy `.env.example` to a new file called `.env`
   - Open `.env` and replace `duffel_test_your_token_here` with your real test token from the Duffel dashboard (Developers → Access tokens)

5. **Start the server**:
   ```
   npm start
   ```

6. **Open your browser** to:
   ```
   http://localhost:3000
   ```

You should see the Easy Fare search page. Type an airport code (e.g. `JFK`) in "From", another (e.g. `LHR`) in "To", pick a date, and hit Search. Since you're using a test token, you'll get realistic sandbox data, not live production fares — but the whole flow (search → normalize → display) works exactly the same way it will in production.

## What happens when you search
1. Your browser calls `/api/search?origin=JFK&destination=LHR&date=2026-09-15`
2. The server checks its cache first (5 min TTL) to avoid hitting Duffel repeatedly for the same search
3. If not cached, it calls Duffel's Offer Request API, gets back raw offers, and normalizes them into a clean shape (airline, price, times, stops)
4. Results are sorted cheapest-first and sent back to the page

## Deploying it live (Render — free, no card required)

1. **Push this project to GitHub**
   - Create a new repo on github.com (e.g. `fareway`)
   - In your project folder:
     ```
     git init
     git add .
     git commit -m "Initial Easy Fare site"
     git branch -M main
     git remote add origin https://github.com/YOUR_USERNAME/fareway.git
     git push -u origin main
     ```
   - `.gitignore` is already set up so `.env` and `node_modules` never get committed — your token stays private.

2. **Create a Render account** at https://render.com (sign up with GitHub — fastest)

3. **New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repo (`fareway`)
   - Render will detect `render.yaml` automatically and pre-fill the build/start commands. If it doesn't, set them manually:
     - Build command: `npm install`
     - Start command: `npm start`
   - Choose the **Free** plan

4. **Add your environment variable**
   - In the service's "Environment" tab, add:
     - Key: `DUFFEL_TOKEN`
     - Value: your real Duffel token (test token for now, production token later)
   - Render restarts the service automatically after you save

5. **Deploy**
   - Render builds and starts your app — takes 1-2 minutes
   - You'll get a live URL like `https://fareway.onrender.com`
   - That's it — your site is now live on the internet, not just localhost

### Notes on the free plan
- Free Render services "spin down" after 15 minutes of no traffic, and take ~30-50 seconds to wake back up on the next request. Fine for testing/showing people; if you want it always-instant later, upgrade to a paid instance (~$7/mo).
- Every time you `git push` to `main`, Render auto-redeploys.

### Alternative hosts (if you'd rather not use Render)
- **Railway** (railway.app) — very similar flow, also free tier, slightly more generous limits
- **Fly.io** — free tier, slightly more setup (CLI-based) but very fast/no sleep on their free tier depending on current terms
All three work with this exact codebase unchanged — it's a standard Node/Express app.


- **Filters sidebar** appears once you search: filter by stops (direct / 1 stop / 2+), airline (checkboxes built from whatever airlines came back), and a max-price slider. Filtering happens instantly in the browser, no new API call needed.
- **"Select" button** now links out (via `buildBookingLink()` in `index.html`) instead of showing an alert. Right now it points to a placeholder `#book?...` link — swap the body of that function for your real affiliate URL (TravelPayouts, Kiwi, Duffel checkout, etc.) once you have one.

## Next steps once this works
- Wire `buildBookingLink()` to a real affiliate/booking URL
- Add a loading state for slow searches and error handling for invalid airport codes
- Move from test token to a production token once you're ready to go live (this involves Duffel's verification process)
- Deploy the server somewhere (Render, Railway, Vercel) so it's live on the internet instead of just localhost
