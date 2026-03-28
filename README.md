# Yesil Ekip Fedaileri

Bu proje statik bir web sitesidir. Dogrudan Vercel, Netlify veya GitHub Pages uzerine yayinlanabilir.

## Dosyalar

- `index.html`: ana sayfa
- `styles.css`: tema ve stiller
- `script.js`: kartlar, filtreleme ve admin panel mantigi

## Hizli Deploy

### Vercel

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
- Kart verileri tarayicida `localStorage` icinde tutulur.
