const CONFIG = {
  firebase: {
    apiKey: "AIzaSyAZRbc37dj2vaiACjAsD0mXUfyne_Wd9gw",
    authDomain: "lordinsxtest.firebaseapp.com",
    databaseURL: "https://lordinsxtest-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "lordinsxtest",
    storageBucket: "lordinsxtest.firebasestorage.app",
    messagingSenderId: "611910355892",
    appId: "1:611910355892:web:c6ecbd24579c8ee95800e1"
  },
  adminPass: "admin123",
  map: {
    bounds: [
      [54.749843, 55.929521],
      [54.700455, 56.008541]
    ],
    startCenter: [55.7558, 37.6173],
    startZoom: 13,
    minZoom: 2,
    maxZoom: 19,
    gridRows: 6,
    gridCols: 6,
    gridLetters: ['A','B','C','D','E','F','G','H','J','K'],
    gridColor: '#d4a017',
    gridOpacity: 0.4,
    borderColor: '#ef4444'
  },
  game: {
    defaultTimerMinutes: 30,
    waypointLifetimeMin: 10,
    captureRadiusDefault: 50,
    geoAccuracyMaxAge: 2000
  },
  theme: {
    bg: '#0a0d08', bg2: '#141812', bg3: '#1e241a',
    border: '#2a3020', accent: '#d4a017', accent2: '#f4c430',
    green: '#4ade80', red: '#ef4444', blue: '#60a5fa',
    text: '#c8d4c8', dim: '#5a6a5a'
  },
  texts: {
    gameTitle: "SQUADRON",
    adminTitle: "COMMAND CENTER",
    teams: {
      red: { name: "КРАСНЫЕ", emoji: "🔴" },
      blue: { name: "СИНИЕ", emoji: "🔵" }
    },
    poiTypes: {
      flag: { icon: "🚩", label: "Флаг" },
      ammo: { icon: "📦", label: "Снабжение" },
      medic: { icon: "🏥", label: "Медпункт" },
      danger: { icon: "⚠️", label: "Опасная зона" },
      base: { icon: "🏠", label: "База" }
    },
    waypointTypes: {
      enemy: { icon: "🎯", label: "Противник" },
      target: { icon: "📍", label: "Цель" },
      attention: { icon: "⚠️", label: "Внимание" },
      move: { icon: "➡️", label: "Движение" }
    }
  }
};
