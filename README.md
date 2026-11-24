# 🏎️ Apex Circuit

### High-Speed Racing. Precision Driving. Pure Adrenaline.

Apex Circuit is a browser-based racing game built with **React, TypeScript, and Vite**. Experience fast-paced racing, customize your car, explore challenging circuits, and compete against AI drivers.

---

## 🌐 Live Demo

🚀 **Play the Game:** [Add Your Vercel Live Link Here]

📂 **Source Code:** [GitHub Repository](https://github.com/YOUR_USERNAME/apex-circuit)

---

## 🎮 Features

- **Six Unique Racing Cars** – Choose from GT, Formula, Muscle, Prototype, Rally, and Street Drift categories.
- **Five Custom Racing Circuits** – Race across different environments and track layouts.
- **AI Opponents** – Compete against computer-controlled rival drivers.
- **Custom Car Garage** – Select your vehicle and personalize its paint color.
- **Nitro Boost System** – Use additional power to gain a competitive advantage.
- **Drifting Mechanics** – Experience dynamic steering and drifting physics.
- **Race Configurations** – Customize race distance, opponent count, and difficulty.
- **Lap Timing & Records** – Track your lap times and save your personal bests.
- **Dynamic Audio** – Enjoy synthesized engine sounds, tire effects, and selectable soundtracks.
- **Responsive Controls** – Play using keyboard controls or available touch controls.

---

## 🏁 Racing Circuits

| Circuit | Location | Difficulty |
|---|---|---|
| Sunset Speedway | Nevada Tri-Oval | Easy |
| Apex Grand Prix | Silvercrest Circuit | Medium |
| Neon Harbor Street | Yokohama Waterfront | Technical |
| Redrock Canyon | Utah Mesa | Technical |
| Emerald Alpine Pass | Dolomite Ridge | Varies by game configuration |

---

## 🚗 Available Vehicles

- Apex GT-R – GT3 Endurance
- Veloce F1 – Open-Wheel Formula
- Titan V8 Muscle – V8 Stock Coupe
- Phantom Prototype – Le Mans Hypercar
- Strada Rally AWD – Turbo Rally Spec
- Kuro Nightrunner – Street Drift Tuner

---

## 🎯 Game Controls

| Key | Action |
|---|---|
| W / ↑ | Accelerate |
| S / ↓ | Brake / Reverse |
| A / ← | Steer Left |
| D / → | Steer Right |
| Space | Drift |
| Shift | Nitro Boost |
| R | Restart Race |
| P | Pause / Resume |

---

## 🛠️ Technologies Used

- **React 19** – User interface development
- **TypeScript** – Type-safe application logic
- **Vite 8** – Development server and build tool
- **Tailwind CSS 4** – Styling and responsive layouts
- **Lucide React** – Interface icons
- **HTML5 Canvas** – Racing graphics and rendering
- **Web Audio API** – Sound effects and synthesized audio
- **Local Storage** – Saving game settings and lap records

---

## 💻 Run Locally

### Prerequisites

- Node.js 22.12.0 or newer
- npm
- Git

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/apex-circuit.git
```

### 2. Navigate to the project directory

```bash
cd apex-circuit
```

### 3. Install dependencies

```bash
npm install
```

### 4. Start the development server

```bash
npm run dev
```

### 5. Open the game

Visit:

```text
http://localhost:3000
```

---

## 📦 Production Build

To create an optimized production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

The production files will be generated inside the `dist` directory.

---

## 📁 Project Structure

```text
apex-circuit/
│
├── public/
│   └── assets/
│
├── src/
│   ├── assets/
│   │   └── images/
│   │
│   ├── components/
│   │   ├── MainMenu.tsx
│   │   ├── RaceView.tsx
│   │   ├── TopBar.tsx
│   │   ├── CarPreviewCanvas.tsx
│   │   └── TrackPreviewCanvas.tsx
│   │
│   ├── game/
│   │   ├── audio.ts
│   │   ├── cars.ts
│   │   ├── engine.ts
│   │   ├── renderer.ts
│   │   ├── storage.ts
│   │   ├── tracks.ts
│   │   └── types.ts
│   │
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
│
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## 💾 Game Data

Apex Circuit uses browser Local Storage to preserve:

- Selected racing vehicle
- Custom vehicle paint
- Race configuration
- Audio preferences
- Best lap records

Saved data is stored locally in the browser.

---

## 🚀 Deployment

The application can be deployed using platforms that support Vite applications, including:

- [Vercel](https://vercel.com/)
- [Netlify](https://www.netlify.com/)
- [GitHub Pages](https://pages.github.com/)

For Vercel, connect your GitHub repository and use the following build settings:

| Setting | Value |
|---|---|
| Framework | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |

---

## 👨‍💻 Author

**Your Name**

GitHub: [Your GitHub Profile](https://github.com/YOUR_USERNAME)

---

## 📄 License

No license has been specified yet. All rights are reserved by the project owner unless a license is added.

---

<p align="center">
  <strong>🏁 Apex Circuit — Start Your Engine. Own The Track.</strong>
</p>
