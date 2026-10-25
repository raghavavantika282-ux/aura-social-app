/* ==========================================================================
   AURA INTERACTIVE CORE SCRIPT WITH FIREBASE FIRESTORE SYNC
   ========================================================================== */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Aapka Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBlmeueJcBqi0HTuaQ1ZhNCtOry-s7FEeE",
  authDomain: "aura-app-31206.firebaseapp.com",
  projectId: "aura-app-31206",
  storageBucket: "aura-app-31206.firebasestorage.app",
  messagingSenderId: "624057494834",
  appId: "1:624057494834:web:bd682fd87f891d83ac3b2b"
};

// Initialize Firebase & Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
  const onboardingScreen = document.getElementById('onboardingScreen');
  const onboardingForm = document.getElementById('onboardingForm');
  const inputName = document.getElementById('inputName');
  const inputHandle = document.getElementById('inputHandle');
  const roomUserName = document.getElementById('roomUserName');

  const btnStage = document.getElementById('btnStage');
  const btnRoom = document.getElementById('btnRoom');
  const stageView = document.getElementById('stageView');
  const roomView = document.getElementById('roomView');
  const vibeBadge = document.getElementById('vibeBadge');
  const appContainer = document.getElementById('appContainer');
  const body = document.body;

  const fabCreate = document.getElementById('fabCreate');
  const createModal = document.getElementById('createModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const btnPublishDrop = document.getElementById('btnPublishDrop');
  const btnRecordAudio = document.getElementById('btnRecordAudio');
  const recordTimer = document.getElementById('recordTimer');

  const stageFeed = document.getElementById('stageFeed');
  const emptyStageState = document.getElementById('emptyStageState');

  const liveCanvas = document.getElementById('liveCanvas');
  const emptyBoardState = document.getElementById('emptyBoardState');
  const btnPinNote = document.getElementById('btnPinNote');
  const btnPinSong = document.getElementById('btnPinSong');

  const chatForm = document.getElementById('chatForm');
  const chatInput = document.getElementById('chatInput');
  const chatMessages = document.getElementById('chatMessages');
  const emptyChatState = document.getElementById('emptyChatState');

  let currentMode = 'stage';
  let userProfile = { name: '', handle: '' };

  // Onboarding Check
  const savedProfile = localStorage.getItem('aura_user_profile');
  if (savedProfile) {
    userProfile = JSON.parse(savedProfile);
    onboardingScreen.classList.add('hidden');
    roomUserName.innerText = userProfile.name.split(' ')[0];
  }

  onboardingForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = inputName.value.trim();
    let handle = inputHandle.value.trim();
    if (handle && !handle.startsWith('@')) handle = '@' + handle;

    if (name && handle) {
      userProfile = { name, handle };
      localStorage.setItem('aura_user_profile', JSON.stringify(userProfile));
      roomUserName.innerText = name.split(' ')[0];
      onboardingScreen.classList.add('hidden');
    }
  });

  // Mode Switcher
  function switchMode(mode) {
    currentMode = mode;
    if (mode === 'stage') {
      btnStage.classList.add('active');
      btnRoom.classList.remove('active');
      stageView.classList.add('active');
      roomView.classList.remove('active');
      body.classList.remove('mode-room');
      body.classList.add('mode-stage');
      vibeBadge.innerText = 'Stage Mode';
      document.documentElement.style.setProperty('--accent-current', 'var(--stage-accent)');
      document.documentElement.style.setProperty('--accent-glow', 'var(--stage-accent-glow)');
      document.documentElement.style.setProperty('--accent-gradient', 'var(--stage-gradient)');
    } else {
      btnRoom.classList.add('active');
      btnStage.classList.remove('active');
      roomView.classList.add('active');
      stageView.classList.remove('active');
      body.classList.remove('mode-stage');
      body.classList.add('mode-room');
      vibeBadge.innerText = 'Room Mode';
      document.documentElement.style.setProperty('--accent-current', 'var(--room-accent)');
      document.documentElement.style.setProperty('--accent-glow', 'var(--room-accent-glow)');
      document.documentElement.style.setProperty('--accent-gradient', 'var(--room-gradient)');
    }
  }

  btnStage.addEventListener('click', () => switchMode('stage'));
  btnRoom.addEventListener('click', () => switchMode('room'));

  // Swipe Gestures
  let touchStartX = 0;
  let touchEndX = 0;

  appContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  appContainer.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    const diff = touchStartX - touchEndX;
    if (diff > 50 && currentMode === 'stage') switchMode('room');
    else if (diff < -50 && currentMode === 'room') switchMode('stage');
  }, { passive: true });

  // REAL-TIME FIRESTORE DATA SYNC
  
  // 1. Fetch Stage Posts
  const qStage = query(collection(db, "stage_posts"), orderBy("createdAt", "desc"));
  onSnapshot(qStage, (snapshot) => {
    if (!snapshot.empty) {
      if (emptyStageState) emptyStageState.style.display = 'none';
      // Purane dynamic cards hata kar fresh render karein
      const existingCards = stageFeed.querySelectorAll('.aura-card');
      existingCards.forEach(card => card.remove());

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const card = document.createElement('article');
        card.className = 'glass-card aura-card';
        card.innerHTML = `
          <div class="card-header">
            <div class="user-info">
              <div class="avatar-glow">
                <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80" alt="Avatar">
              </div>
              <div>
                <h3 class="user-name">${data.name}</h3>
                <span class="user-handle">${data.handle}</span>
              </div>
            </div>
            <button class="icon-btn-ghost"><i class="ph-bold ph-dots-three-vertical"></i></button>
          </div>
          <div class="card-body">
            <p class="post-caption">${data.caption}</p>
            ${data.hasAudio ? `
              <div class="audio-player-box">
                <button class="play-btn"><i class="ph-fill ph-play"></i></button>
                <div class="waveform-container">
                  <div class="waveform-bars">
                    <span style="--h: 40%"></span><span style="--h: 70%"></span><span style="--h: 30%"></span>
                    <span style="--h: 90%"></span><span style="--h: 100%"></span><span style="--h: 60%"></span>
                  </div>
                  <div class="time-stamp"><span>0:00</span> / 0:15</div>
                </div>
              </div>
            ` : ''}
          </div>
          <div class="card-actions">
            <button class="action-btn like-btn"><i class="ph-bold ph-heart"></i> <span>0</span></button>
            <button class="action-btn"><i class="ph-bold ph-chat-circle-dots"></i> <span>0</span></button>
            <button class="action-btn share-btn"><i class="ph-bold ph-paper-plane-tilt"></i></button>
          </div>
        `;
        stageFeed.appendChild(card);
      });
    }
  });

  // 2. Fetch Room Board Items
  const qBoard = query(collection(db, "room_board"), orderBy("createdAt", "desc"));
  onSnapshot(qBoard, (snapshot) => {
    if (!snapshot.empty) {
      if (emptyBoardState) emptyBoardState.style.display = 'none';
      const existingNotes = liveCanvas.querySelectorAll('.canvas-card');
      existingNotes.forEach(note => note.remove());

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const card = document.createElement('div');
        card.className = data.type === 'note' ? 'canvas-card sticky-note' : 'canvas-card music-vibe';
        card.style.setProperty('--rot', `${Math.floor(Math.random() * 8) - 4}deg`);
        
        if (data.type === 'note') {
          card.innerHTML = `
            <div class="card-pin"></div>
            <p>“${data.content}”</p>
            <span class="author">— ${data.author}</span>
          `;
        } else {
          card.innerHTML = `
            <div class="card-pin"></div>
            <div class="vibe-icon"><i class="ph-bold ph-disc"></i></div>
            <div class="song-info">
              <h4>${data.content}</h4>
              <p>Shared by ${data.author}</p>
            </div>
          `;
        }
        liveCanvas.appendChild(card);
      });
    }
  });

  // 3. Fetch Room Chat Messages
  const qChat = query(collection(db, "room_chat"), orderBy("createdAt", "asc"));
  onSnapshot(qChat, (snapshot) => {
    if (!snapshot.empty) {
      if (emptyChatState) emptyChatState.style.display = 'none';
      const existingMsgs = chatMessages.querySelectorAll('.msg-bubble');
      existingMsgs.forEach(msg => msg.remove());

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const msg = document.createElement('div');
        msg.className = 'msg-bubble sent';
        msg.innerHTML = `<span style="font-size: 0.65rem; opacity: 0.8; display: block; font-weight: 700;">${data.sender}</span><p>${data.text}</p>`;
        chatMessages.appendChild(msg);
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  });

  // Add Note / Song to Room Board
  btnPinNote.addEventListener('click', async () => {
    const noteText = prompt("Enter note for the group board:");
    if (noteText) {
      await addDoc(collection(db, "room_board"), {
        type: 'note',
        content: noteText,
        author: userProfile.name || 'You',
        createdAt: serverTimestamp()
      });
    }
  });

  btnPinSong.addEventListener('click', async () => {
    const songName = prompt("Enter Song name:");
    if (songName) {
      await addDoc(collection(db, "room_board"), {
        type: 'song',
        content: songName,
        author: userProfile.name || 'You',
        createdAt: serverTimestamp()
      });
    }
  });

  // Send Chat Message
  chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = chatInput.value.trim();
    if (text) {
      await addDoc(collection(db, "room_chat"), {
        text: text,
        sender: userProfile.name || 'You',
        createdAt: serverTimestamp()
      });
      chatInput.value = '';
    }
  });

  // Modal & Publishing Logic
  fabCreate.addEventListener('click', () => createModal.classList.add('active'));
  btnCloseModal.addEventListener('click', () => createModal.classList.remove('active'));

  let isRecording = false;
  let recInterval;
  let hasAudioRecorded = false;
  
  btnRecordAudio.addEventListener('click', () => {
    isRecording = !isRecording;
    if (isRecording) {
      btnRecordAudio.classList.add('recording');
      let count = 0;
      recordTimer.innerText = "Recording... 0s";
      recInterval = setInterval(() => {
        count++;
        recordTimer.innerText = `Recording... ${count}s`;
        if (count >= 30) btnRecordAudio.click();
      }, 1000);
    } else {
      btnRecordAudio.classList.remove('recording');
      clearInterval(recInterval);
      hasAudioRecorded = true;
      recordTimer.innerText = "Audio Drop Recorded! (Click publish)";
    }
  });

  btnPublishDrop.addEventListener('click', async () => {
    const caption = document.getElementById('modalCaption').value.trim();
    const destination = document.querySelector('input[name="dest"]:checked').value;

    if (!caption && !hasAudioRecorded) {
      alert("Please record a voice drop or write a caption!");
      return;
    }

    if (destination === 'stage') {
      await addDoc(collection(db, "stage_posts"), {
        name: userProfile.name || 'You',
        handle: userProfile.handle || '@you',
        caption: caption || 'Voice Drop',
        hasAudio: hasAudioRecorded,
        createdAt: serverTimestamp()
      });
      switchMode('stage');
    } else {
      await addDoc(collection(db, "room_board"), {
        type: 'note',
        content: caption || 'Voice Drop',
        author: userProfile.name || 'You',
        createdAt: serverTimestamp()
      });
      switchMode('room');
    }

    createModal.classList.remove('active');
    document.getElementById('modalCaption').value = '';
    hasAudioRecorded = false;
    recordTimer.innerText = "Tap to record (Max 30s)";
  });
});
