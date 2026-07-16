# 19 — Islamic Features

> **Source basis:** `src/features/islamic/prayer-times-widget.tsx`, `src/features/islamic/hijri-date-widget.tsx`, `src/features/islamic/prayer-config-panel.tsx`, `src/features/islamic/ramadan-settings-panel.tsx`, `src/features/islamic/islamic-api.ts`, `src/features/islamic/hijri-date-widget.test.tsx`  

---

## 19.1 Overview

The dashboard includes Islamic features specifically designed for the Arabic market. These are integrated into the home dashboard and settings, providing prayer times, Hijri date display, and Ramadan-specific functionality.

---

## 19.2 Prayer Times Widget (`src/features/islamic/prayer-times-widget.tsx`)

### Location
Rendered on the home dashboard (`ClientHomeDashboard`) in a grid alongside `HijriDateWidget`.

### Layout
```tsx
<div className="grid gap-4 md:grid-cols-[1fr_auto]">
  <PrayerTimesWidget />
  <HijriDateWidget />
</div>
```

### Features
- Displays the five daily Islamic prayer times:
  - Fajr (dawn)
  - Dhuhr (noon)
  - Asr (afternoon)
  - Maghrib (sunset)
  - Isha (night)
- Shows current time and next prayer countdown
- Highlights the next upcoming prayer
- Location-based calculation (uses workspace or user location)
- Calculation method selection (MWL, ISNA, Egypt, Makkah, Karachi, Tehran)

### Data Fetching
- Calls Islamic API for prayer times based on coordinates and calculation method
- Caches results per day
- Updates countdown timer every minute

### UI
- Card with prayer icon header
- List of prayer names with times
- Next prayer highlighted with countdown
- Location display
- Link to prayer configuration panel

---

## 19.3 Hijri Date Widget (`src/features/islamic/hijri-date-widget.tsx`)

### Location
Rendered alongside `PrayerTimesWidget` on the home dashboard.

### Features
- Displays current Hijri (Islamic) date
- Shows Gregorian date alongside
- Day name in Arabic and English
- Month name in Arabic (e.g., رمضان, شوال)
- Year in Hijri calendar

### Test Coverage
`src/features/islamic/hijri-date-widget.test.tsx` — Tests widget rendering and date conversion logic.

---

## 19.4 Prayer Config Panel (`src/features/islamic/prayer-config-panel.tsx`)

### Purpose
Configuration panel for prayer time settings (~10KB).

### Settings
| Setting | Type | Options |
|---------|------|---------|
| Calculation method | select | MWL, ISNA, Egypt, Makkah, Karachi, Tehran |
| Location | text + coordinates | City name, lat/lng |
| Asr method | select | Standard (Shafi), Hanafi |
| Adjustments | number inputs | Per-prayer minute adjustments |
| Show prayer times on screens | switch | Enable/disable |
| Prayer notification | switch | In-app notification before prayer |

### Integration with Schedules
- Can create schedule entries that automatically pause content during prayer times
- Configurable pre-prayer and post-prayer buffer
- Can assign emergency overlay for prayer time

---

## 19.5 Ramadan Settings Panel (`src/features/islamic/ramadan-settings-panel.tsx`)

### Purpose
Ramadan-specific configuration (~11KB).

### Settings
| Setting | Type | Purpose |
|---------|------|---------|
| Ramadan mode | switch | Enable Ramadan-specific features |
| Suhoor time | time | Suhoor (pre-dawn meal) time |
| Iftar time | time | Iftar (breaking fast) time |
| Taraweeh prayer | switch | Show Taraweeh prayer time |
| Ramadan overlay | select | Choose overlay for prayer times |
| Auto-pause during prayer | switch | Pause content during prayer |
| Ramadan greeting | text | Custom greeting for screens |
| Quran recitation | switch | Play Quran recitation at specific times |

### Ramadan Schedule Integration
- Automatically generates schedule entries for Ramadan prayer times
- Adjusts for Suhoor and Iftar times
- Can override regular schedules during Ramadan period
- Auto-disables after Ramadan ends (based on Hijri calendar)

---

## 19.6 Islamic API (`src/features/islamic/islamic-api.ts`)

| Function | Method | Path | Purpose |
|----------|--------|------|---------|
| `fetchPrayerTimes(lat, lng, method)` | GET | `/islamic/prayer-times` | Get prayer times |
| `fetchHijriDate(date)` | GET | `/islamic/hijri-date` | Convert to Hijri |
| `savePrayerConfig(workspaceId, config)` | PUT | `/workspaces/{ws}/prayer-config` | Save prayer settings |
| `fetchPrayerConfig(workspaceId)` | GET | `/workspaces/{ws}/prayer-config` | Get prayer settings |
| `saveRamadanConfig(workspaceId, config)` | PUT | `/workspaces/{ws}/ramadan-config` | Save Ramadan settings |
| `fetchRamadanConfig(workspaceId)` | GET | `/workspaces/{ws}/ramadan-config` | Get Ramadan settings |

---

## 19.7 [V2] UX Analysis — Islamic Features

### Prayer Times Widget — Cultural UX Evaluation

**[V2] Market-Specific Feature:**
Prayer times integration is a critical feature for the Saudi/Arabian digital signage market. Screens in public spaces (malls, restaurants, mosques) need to display prayer times and potentially switch content during prayer.

**[V2] Location-Based Prayer Times:**
Prayer times require latitude/longitude coordinates. The config panel likely allows manual location entry or uses the workspace's configured location. Key UX considerations:
- Location search should support Arabic city names
- Prayer calculation method selection (Umm al-Qura, MWL, ISNA, etc.)
- Asr calculation method (Standard/Hanafi)
- DST handling

**[V2] Prayer Time Display:**
The widget shows the five daily prayer times (Fajr, Dhuhr, Asr, Maghrib, Isha) plus Sunrise. The display should:
- Highlight the next prayer time
- Show countdown to next prayer
- Use 12-hour or 24-hour format based on locale
- Show both Gregorian and Hijri dates

### Hijri Date Widget — UX Analysis

**[V2] Dual Calendar Display:**
The Hijri date widget shows the Islamic calendar date alongside the Gregorian date. This is important for Arabic users who reference both calendars. The display should:
- Show day, month name (Arabic), year
- Use correct Hijri month names (Muharram, Safar, Rabi al-Awwal, etc.)
- Handle date conversion accurately (Umm al-Qura calendar)

### Ramadan Settings — UX Analysis

**[V2] Ramadan Mode:**
Ramadan settings allow automatic schedule overrides during Ramadan. This is a sophisticated feature that:
- Adjusts content schedules for Suhoor and Iftar
- Can override regular schedules
- Auto-disables after Ramadan ends (based on Hijri calendar)

**[V2] Ramadan Configuration Complexity:**
The Ramadan config involves: start/end dates (Hijri), override schedules, special content playlists. This is a complex configuration that benefits from a wizard or guided setup. Key UX considerations:
- Clear explanation of what Ramadan mode does
- Preview of override schedule before applying
- Easy revert after Ramadan ends
- Support for different Ramadan schedules per branch

### [V2] Cultural Sensitivity Assessment

**[V2] Localization Quality:**
Islamic features require careful Arabic localization — prayer time names, Hijri month names, and religious terms must be accurate. Using `next-intl` with dedicated translation namespaces is the correct approach.

**[V2] RTL Considerations:**
Prayer times and Hijri dates are primarily Arabic features used in RTL mode. The widgets must:
- Display text right-to-left
- Use Arabic numerals (Eastern Arabic numerals ٠١٢٣٤٥٦٧٨٩) optionally
- Align prayer times in RTL table format
- Show Hijri date in Arabic format (day/month/year)

### Cross-References
- See `22-i18n-and-localization.md` for Arabic translation and RTL support
- See `12-schedules-feature.md` for schedule override system
- See `02-design-system-and-tokens.md` for RTL CSS support
- See `24-accessibility-audit.md` for RTL accessibility evaluation
