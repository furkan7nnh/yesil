# Yesil Ekip Fedaileri

Bu proje Flask tabanli bir web uygulamasidir.

## Dosyalar

- `index.html`: ana sayfa
- `styles.css`: tema ve stiller
- `script.js`: kartlar, filtreleme ve ana sayfa mantigi
- `admin.js`: admin paneli ve kart silme mantigi
- `server.py`: API ve statik dosya sunumu

## Lokal Calistirma

1. `pip install -r requirements.txt`
2. `python server.py`
3. `http://localhost:8088` adresini ac

## Deploy

### Render (onerilen)

1. Repoyu Render Web Service olarak bagla.
2. Build Command: `pip install -r requirements.txt`
3. Start Command: `gunicorn server:app`
4. Environment Variable ekle:
	- `DATA_DIR=/var/data`
5. Render uzerinde Persistent Disk bagla ve mount path olarak `/var/data` kullan.

Bu ayarlarla kartlar SQLite dosyasinda tutulur ve yeniden deploy/restart sonrasinda kaybolmaz.

### Vercel / Netlify / GitHub Pages

Bu platformlar backend (Flask + yazilabilir depolama) gerektiren mevcut yapi icin tek basina uygun degildir.

## Eski Notlar

Asagidaki adimlar onceki statik kurulum icindi:

1. Bu klasoru bir GitHub reposuna yukle.
2. Vercel'de `Add New Project` sec.
3. Repoyu bagla.
4. Framework secmeden deploy et.

### Netlify

1. Bu klasoru bir GitHub reposuna yukle.
2. Netlify'da `Add new site` sec.
3. Repoyu bagla.
4. Publish directory olarak `.` kullan.

### GitHub Pages

1. Bu klasoru bir GitHub reposuna yukle.
2. GitHub'da `Settings -> Pages` ac.
3. Branch olarak `main` ve root `/` sec.
4. Kaydet.

## Not

- Admin sifresi istemci tarafindadir; bu gercek guvenlik saglamaz.
- `tools/` klasoru deploy edilmemeli, `.gitignore` ile haric tutuldu.
