# Supabase Storage Analysis za FPL Live

## 📊 Analiza podataka za 38 Gameweek-ova

### 🔢 Osnovni podaci (po Gameweek-u):
- **Igrači**: ~700 igrača × 38 GW = ~26,600 redova u `fpl_live_players`
- **Fixtures**: ~10 mečeva × 38 GW = ~380 redova u `fpl_fixtures`  
- **Fixture Stats**: ~10 mečeva × 20 igrača × 8 statistika × 38 GW = ~60,800 redova
- **Events**: ~50 događaja po GW × 38 = ~1,900 redova
- **Manager Picks**: 15 igrača × broj managera × 38 GW

### 💾 Procena veličine podataka:

#### Veliki tabeli:
- **fpl_live_players**: 26,600 × ~200 bytes = ~5.3 MB
- **fpl_fixture_stats**: 60,800 × ~50 bytes = ~3.0 MB  
- **fpl_players**: 700 × ~150 bytes = ~105 KB (ažurira se retko)
- **fpl_events_stream**: 1,900 × ~100 bytes = ~190 KB

#### Manager specifični:
- **fpl_manager_picks**: 15 × manageri × 38 × ~50 bytes
- **fpl_manager_metrics**: manageri × 38 × ~100 bytes

### 📈 **Ukupno za 38 GW**: ~10-15 MB osnovnih podataka

## 💰 Supabase Free Tier Limitovi:

### ✅ **Database Storage**: 500 MB limit
- **FPL Live koristi**: ~15 MB (3% od limite)
- **SIGURAN**: Ima prostora za 1000+ managera tokom cele sezone

### ✅ **Database Bandwidth**: 2 GB/mesec
- **FPL Live koristi**: ~100 MB/mesec (5% od limite)  
- **SIGURAN**: API pozivi su optimizovani sa cache-om

### ✅ **Real-time subscriptions**: 200 concurrent
- **FPL Live koristi**: ~10-50 concurrent (25% od limite)
- **SIGURAN**: Samo aktivni korisnici tokom live GW

### ✅ **Broj redova**: Unlimited na Free tier-u

## 🎯 **Optimizacije implementirane**:

### 🚀 **Performance**:
- **Indexi** na često korišćenim kolonama (gw, player_id, fixture_id)
- **Upsert operacije** umesto insert+update
- **Batch operacije** za bulk data
- **No-store cache** za fresh data

### 💧 **Storage optimizacija**:
- **Kompaktni podaci** - samo potrebne kolone
- **Normalizacija** - timovi/igrači se ne dupliraju
- **Auto-cleanup** - stari events se mogu obrisati nakon GW

### 🔄 **API optimizacija**:
- **Delta detection** - samo novi događaji se čuvaju
- **Retry logic** sa exponential backoff
- **Rate limiting** zaštita
- **Server-side only** - nema CORS problema

## 🔒 **Sigurnost i održavanje**:

### 🛡️ **RLS Policies**:
- **Public read** za sve FPL podatke
- **Service role write** za API operacije
- **Nema sensitive podatke** - sve je javno FPL info

### 🧹 **Cleanup strategije**:
```sql
-- Obriši events starije od 7 dana
DELETE FROM fpl_events_stream 
WHERE occurred_at < now() - INTERVAL '7 days';

-- Obriši live stats za završene GW (starije od 30 dana)
DELETE FROM fpl_live_players 
WHERE gw IN (
  SELECT gw FROM fpl_gameweek_status 
  WHERE finished = true 
    AND updated_at < now() - INTERVAL '30 days'
);
```

## ✅ **Zaključak: POTPUNO BESPLATNO**

FPL Live sistem će raditi **kompletno besplatno** na Supabase Free tier-u tokom cele sezone:

- ✅ **Storage**: 3% od limite (15 MB od 500 MB)
- ✅ **Bandwidth**: 5% od limite (100 MB od 2 GB/mesec)  
- ✅ **Performance**: Optimizovano sa indexima
- ✅ **Scalable**: Može podržati 100+ aktivnih korisnika

### 🎮 **Bonus Prediction**:
**DA!** Bonus se računa **UŽIVO** tokom mečeva:
- BPS se ažurira svakih 15 sekundi
- Rangiranje igrača po BPS-u
- Primena 3/2/1 bonus pravila  
- Tie-breaking implementiran
- Finalizacija kada FPL označi bonus_added=true

System je spreman za produkciju! 🚀