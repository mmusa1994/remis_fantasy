# 🎨 Beautiful AI Usage Card Design

## ✨ **Nova kartica za "3/3 remaining":**

### 🎨 **Design Features:**
- **Zelena providna pozadina** sa `bg-green-500/10` (dark) / `bg-green-50/80` (light)
- **Tanki zeleni border** sa `border-green-500/30` / `border-green-200/50`
- **Backdrop blur efekt** sa `backdrop-blur-lg`
- **Hover animacije**: scale-[1.02] i shadow povećanje
- **Animirana pozadina**: pulse gradijent od green-400 do green-600
- **Shimmer efekt**: horizontalno klizanje sjajna

### 📊 **Layout struktura:**
```
┌─────────────────────────────────────────┐
│ [💬] Free Questions      [3/3]         │
│      Weekly allowance    remaining      │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │ • Resets on Monday, 8 September... │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### 🎯 **Key Elements:**

1. **Icon Container:**
   - Rounded-xl pozadina
   - 6x6 Chat icon u zelenoj boji
   - Hover: dodatna transparentnost

2. **Main Counter:**
   - `text-2xl font-black` za brojke
   - Zelena boja kad ima remaining
   - Crvena kad nema (0/3)
   - Uppercase "REMAINING" sa tracking-wide

3. **Info Section:**
   - Nested card sa blur pozadinom
   - Pulsing dot indikator
   - Reset datum i vrijeme

4. **Animacije:**
   - **Pulse**: pozadinski gradijent
   - **Shimmer**: -skew-x-12 transform preko kartice
   - **Hover**: scale-[1.02] sa shadow-lg

### 🌍 **Internationalization:**
- **English**: "Weekly allowance"
- **Bosanski**: "Sedmična kvota"

### 💻 **Technical:**
```css
/* Shimmer keyframes dodano u tailwind.config.ts */
shimmer: {
  "0%": { transform: "translateX(-100%) skewX(-12deg)" },
  "50%": { transform: "translateX(100%) skewX(-12deg)" },
  "100%": { transform: "translateX(100%) skewX(-12deg)" }
}
```

### 🎨 **Color Palette:**
```css
Light Theme:
- bg-green-50/80 (pozadina)
- border-green-200/50 (border)
- text-green-800 (naslov)
- text-green-600 (counter)

Dark Theme:
- bg-green-500/10 (pozadina)  
- border-green-500/30 (border)
- text-green-100 (naslov)
- text-green-400 (counter)
```

### 🚀 **Interactive States:**
- **Normal**: Zelena tema, pulse animacija
- **Hover**: Scale + glow shadow
- **Loading**: Shimmer placeholder
- **Empty (0/3)**: Crvena boja za warning

## 🎉 **Result:**
Umjesto običnog teksta "Free Questions 3/3 remaining", sada imamo prelepu karticu koja je:
- ✅ Vizuelno atraktivna
- ✅ Animirana i interaktivna  
- ✅ Responzivna za sve uređaje
- ✅ Podržava light/dark theme
- ✅ Lokalizovana (BS/ENG)
- ✅ Accessible sa hover states