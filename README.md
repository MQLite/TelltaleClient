# TelltaleClient 🎋

React + TypeScript frontend for [Telltale](https://github.com/MQLite/Telltale) — a bilingual children's story generator with AI illustrations and voice narration.

**Backend repo:** [MQLite/Telltale](https://github.com/MQLite/Telltale)

---

## Features

- **Keyword-driven story generation** — enter a few words, receive a full 4-page bilingual story
- **Canvas paint animation** — each illustration is revealed with a brush-stroke painting effect
- **Voice narration** — six voice options powered by Pollinations TTS; narration is prefetched before the story opens
- **Saved stories list** — previously generated stories are listed on the home page and can be reopened instantly
- **Language toggle** — switch between English-first and Chinese-first at any time
- **Responsive** — works on desktop and mobile browsers

---

## Tech Stack

| | |
|---|---|
| Framework | React 18 + TypeScript |
| Build tool | Vite |
| Styling | Plain CSS (custom properties, no UI library) |
| API communication | Fetch API with relative URLs |
| Audio | HTML5 Audio + Blob URLs (prefetched before story opens) |
| Canvas animation | HTML5 Canvas (grid shuffle + ellipse clip brush effect) |

---

## Getting Started (Development)

### Prerequisites

- [Node.js 18+](https://nodejs.org/)
- Backend running at `http://localhost:5000` — see [MQLite/Telltale](https://github.com/MQLite/Telltale)

### Install and run

```bash
git clone https://github.com/MQLite/TelltaleClient.git
cd TelltaleClient
npm install
npm run dev
# Open http://localhost:5173
```

The Vite dev server proxies all `/api/*` requests to `http://localhost:5000` — no manual CORS or URL configuration needed.

### Build for production

```bash
npm run build
# Static output in ./dist/
```

---

## Production Deployment

The frontend builds to a folder of static files (`index.html` + JS/CSS assets). It must be served alongside the backend so that `/api/*` routes reach the backend via a reverse proxy.

All API calls use relative URLs (`/api/...`), so the frontend works correctly as long as the reverse proxy forwards `/api/` to the backend.

---

### Ubuntu 22 (nginx)

```bash
# Copy dist/ to the web root
rsync -av dist/ user@server:/var/www/telltale/web/
```

nginx site config (`/etc/nginx/sites-available/telltale`):

```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/telltale/web;
    index index.html;

    # Forward API requests to the .NET backend
    location /api/ {
        proxy_pass         http://127.0.0.1:5000/api/;
        proxy_http_version 1.1;
        proxy_set_header   Host $host;
        proxy_set_header   X-Real-IP $remote_addr;
        proxy_read_timeout 120s;
    }

    # SPA fallback — all non-file routes serve index.html
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/telltale /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

---

### Windows Server (IIS)

#### Prerequisites

- [IIS](https://learn.microsoft.com/iis) — enable via *Server Manager → Add Roles → Web Server (IIS)*
- [URL Rewrite Module](https://www.iis.net/downloads/microsoft/url-rewrite)
- [Application Request Routing (ARR)](https://www.iis.net/downloads/microsoft/application-request-routing) — required for reverse proxy

After installing ARR, enable the proxy:  
*IIS Manager → Application Request Routing Cache → Server Proxy Settings → Enable proxy*

#### Deploy files

Copy the contents of `dist/` to:
```
C:\inetpub\telltale\web\
```

#### IIS site + web.config

Create a new IIS site pointing to `C:\inetpub\telltale\web\`, then add a `web.config` in that folder:

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <system.webServer>
    <rewrite>
      <rules>
        <!-- Forward /api/* to the .NET backend -->
        <rule name="API proxy" stopProcessing="true">
          <match url="^api/(.*)" />
          <action type="Rewrite"
                  url="http://127.0.0.1:5000/api/{R:1}"
                  appendQueryString="true" />
        </rule>
        <!-- SPA fallback — serve index.html for all other routes -->
        <rule name="SPA fallback" stopProcessing="true">
          <match url=".*" />
          <conditions logicalGrouping="MatchAll">
            <add input="{REQUEST_FILENAME}" matchType="IsFile" negate="true" />
          </conditions>
          <action type="Rewrite" url="/index.html" />
        </rule>
      </rules>
    </rewrite>
  </system.webServer>
</configuration>
```

---

## Project Structure

```
src/
  api/
    storyApi.ts         # fetch wrappers for all backend endpoints
  components/
    HomePage.tsx        # landing page, keyword form, voice selector, story list
    StoryViewer.tsx     # page-by-page story display with canvas and narration
    PaintCanvas.tsx     # canvas brush-stroke painting animation
    StoryList.tsx       # saved stories list
  hooks/
    useTextToSpeech.ts  # audio playback hook (plays prefetched blob URLs)
  types/
    story.ts            # shared TypeScript types
  App.tsx               # top-level state: language, voice, story, loading phases
  App.css               # all styles
```

---

## License

MIT
