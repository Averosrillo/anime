const musicData = [
    {
        title: "Storyteller",
        artist: "TRUE",
        duration: "4:31",
        thumbnail: "https://i.pinimg.com/736x/ac/ad/16/acad1679f9f1f5d2a226ed09bed9a414.jpg",
        audio: "https://www.dropbox.com/scl/fi/2lum9k9icuy7j1xjqiwjm/BEST-VGM-1383.mp3?rlkey=grcw8q0hjgvic4ickmfmg7om0&raw=1",
        rating: 5,
        featured: true,
        popular: true
    }
];

const musicGrid = document.getElementById('music-grid');
const popularGrid = document.getElementById('popular-grid');
const audioPlayer = document.getElementById('audio-player');
const progress = document.getElementById('progress');
const progressContainer = document.getElementById('progress-container');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const playIcon = document.getElementById('play-icon');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const repeatBtn = document.getElementById('repeat-btn');
const nowPlaying = document.getElementById('now-playing');
const nowPlayingImg = document.getElementById('now-playing-img');
const nowPlayingTitle = document.getElementById('now-playing-title');
const nowPlayingArtist = document.getElementById('now-playing-artist');
const closeNowPlaying = document.getElementById('close-now-playing');
const volumeDownBtn = document.getElementById('volume-down-btn');
const volumeUpBtn = document.getElementById('volume-up-btn');
const volumeSlider = document.getElementById('volume-slider');
const playerThumbnail = document.getElementById('player-thumbnail');
const playerSongTitle = document.getElementById('player-song-title');
const playerSongArtist = document.getElementById('player-song-artist');
const errorMessage = document.getElementById('error-message');

let currentSongIndex = 0;
let isPlaying = false;
let isShuffle = false;
let isRepeat = false;
let originalMusicData = [...musicData];
let hoverPreviewEnabled = true;
let userInteracted = false;

function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    setTimeout(() => {
        errorMessage.classList.remove('show');
    }, 3000);
}

async function isValidAudioSource(url) {
    if (url.includes('dropbox.com') && url.includes('raw=1')) {
        return true;
    }
    try {
        const response = await fetch(url, { method: 'HEAD' });
        return response.ok && response.headers.get('content-type')?.includes('audio');
    } catch {
        return false;
    }
}

async function init() {
    loadPlayerState();
    createMusicCards();
    if (originalMusicData.length > 0) {
        updateUIWithSong(originalMusicData[currentSongIndex]);
    }
    setupEventListeners();

    document.addEventListener('click', handleFirstInteraction, { once: true });
    document.addEventListener('touchstart', handleFirstInteraction, { once: true });
}

function handleFirstInteraction() {
    userInteracted = true;
    if (audioPlayer.paused && audioPlayer.src) {
        audioPlayer.play().catch(() => {});
        audioPlayer.pause();
    }
}

function loadPlayerState() {
    const savedIndex = sessionStorage.getItem('currentSongIndex');
    const savedIsPlaying = sessionStorage.getItem('isPlaying') === 'true';
    const savedCurrentTime = sessionStorage.getItem('currentTime');
    const savedVolume = sessionStorage.getItem('volume');

    if (savedIndex !== null) {
        currentSongIndex = parseInt(savedIndex);
    }
    if (savedVolume !== null) {
        audioPlayer.volume = parseFloat(savedVolume);
        volumeSlider.value = audioPlayer.volume;
    }

    if (savedIsPlaying && savedCurrentTime) {
        document.addEventListener('firstInteractionDone', () => {
            loadSong(currentSongIndex).then(() => {
                audioPlayer.currentTime = parseFloat(savedCurrentTime);
                playSong();
            });
        }, { once: true });
    }
}

function savePlayerState() {
    sessionStorage.setItem('currentSongIndex', currentSongIndex);
    sessionStorage.setItem('isPlaying', isPlaying);
    sessionStorage.setItem('currentTime', audioPlayer.currentTime);
    sessionStorage.setItem('volume', audioPlayer.volume);
}

function createMusicCards() {
    musicGrid.innerHTML = '';
    popularGrid.innerHTML = '';

    const featuredTracks = originalMusicData.filter(song => song.featured);
    featuredTracks.forEach((song) => {
        const originalIndex = originalMusicData.indexOf(song);
        createMusicCard(song, originalIndex, musicGrid);
    });

    const popularTracks = originalMusicData.filter(song => song.popular);
    popularTracks.forEach((song) => {
        const originalIndex = originalMusicData.indexOf(song);
        createMusicCard(song, originalIndex, popularGrid);
    });
}

function createMusicCard(song, index, container) {
    const musicCard = document.createElement('div');
    musicCard.className = 'music-card';
    musicCard.dataset.index = index;

    let stars = '';
    for (let i = 0; i < 5; i++) {
        stars += `<i class="${i < song.rating ? 'fas' : 'far'} fa-star star"></i>`;
    }

    musicCard.innerHTML = `
        <div class="thumbnail">
            <img src="${song.thumbnail}" alt="${song.title}">
            <div class="play-overlay"><i></i></div>
        </div>
        <div class="music-info">
            <div class="music-title">${song.title}</div>
            <div class="music-artist">${song.artist}</div>
            <div class="music-duration"><i class="far fa-clock"></i> ${song.duration}</div>
            <div class="rating">${stars}</div>
        </div>
    `;

    musicCard.addEventListener('click', async () => {
        await loadSong(index);
        playSong();
    });

    container.appendChild(musicCard);
}

function updateUIWithSong(song) {
    nowPlayingImg.src = song.thumbnail;
    nowPlayingTitle.textContent = song.title;
    nowPlayingArtist.textContent = song.artist;
    playerThumbnail.src = song.thumbnail;
    playerSongTitle.textContent = song.title;
    playerSongArtist.textContent = song.artist;
    durationEl.textContent = song.duration; 
    currentTimeEl.textContent = '0:00';
    progress.style.width = '0%';
}

async function loadSong(index) {
    if (!userInteracted) {
        userInteracted = true;
    }
    currentSongIndex = index;
    const song = originalMusicData[index];

    updateUIWithSong(song);

    if (!(await isValidAudioSource(song.audio))) {
        showError(`Audio untuk "${song.title}" tidak valid.`);
        return;
    }
    
    audioPlayer.src = song.audio;

    audioPlayer.addEventListener('loadedmetadata', () => {
        const duration = audioPlayer.duration;
        const minutes = Math.floor(duration / 60);
        let seconds = Math.floor(duration % 60);
        if (seconds < 10) seconds = `0${seconds}`;
        if (!isNaN(duration)) {
             durationEl.textContent = `${minutes}:${seconds}`;
        }
    }, { once: true });
    
    savePlayerState();
}

function playSong() {
    if (!audioPlayer.src) {
        loadSong(currentSongIndex).then(() => audioPlayer.play());
    }

    if (!userInteracted) {
        showError('Tekan sekali lagi untuk memutar musik.');
        handleFirstInteraction(); 
        return;
    }

    const playPromise = audioPlayer.play();
    if (playPromise !== undefined) {
        playPromise.then(() => {
            isPlaying = true;
            playIcon.classList.replace('fa-play', 'fa-pause');
            showNowPlaying();
        }).catch(error => {
            console.error("Playback failed:", error);
            pauseSong(); 
            showError('Gagal memutar. Coba lagi atau pilih lagu lain.');
        });
    }
}

function pauseSong() {
    isPlaying = false;
    playIcon.classList.replace('fa-pause', 'fa-play');
    audioPlayer.pause();
    savePlayerState();
}

function showNowPlaying() { nowPlaying.classList.add('show'); }
function hideNowPlaying() { nowPlaying.classList.remove('show'); }

async function nextSong() {
    if (isShuffle) {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * originalMusicData.length);
        } while (newIndex === currentSongIndex && originalMusicData.length > 1);
        currentSongIndex = newIndex;
    } else {
        currentSongIndex = (currentSongIndex + 1) % originalMusicData.length;
    }
    await loadSong(currentSongIndex);
    if (isPlaying) playSong();
}

async function prevSong() {
    if (audioPlayer.currentTime > 3 && !isShuffle) {
        audioPlayer.currentTime = 0;
    } else {
         if (isShuffle) {
            let newIndex;
            do {
                newIndex = Math.floor(Math.random() * originalMusicData.length);
            } while (newIndex === currentSongIndex && originalMusicData.length > 1);
            currentSongIndex = newIndex;
        } else {
            currentSongIndex = (currentSongIndex - 1 + originalMusicData.length) % originalMusicData.length;
        }
        await loadSong(currentSongIndex);
    }
    if (isPlaying) playSong();
}

function toggleShuffle() {
    isShuffle = !isShuffle;
    shuffleBtn.classList.toggle('active', isShuffle);
}

function toggleRepeat() {
    isRepeat = !isRepeat;
    repeatBtn.classList.toggle('active', isRepeat);
    audioPlayer.loop = isRepeat; 
}

function updateProgress(e) {
    const { duration, currentTime } = e.srcElement;
    if (duration) {
        progress.style.width = `${(currentTime / duration) * 100}%`;
        const currentMinutes = Math.floor(currentTime / 60);
        let currentSeconds = Math.floor(currentTime % 60);
        if (currentSeconds < 10) currentSeconds = `0${currentSeconds}`;
        currentTimeEl.textContent = `${currentMinutes}:${currentSeconds}`;
    }
}

function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    if (duration) audioPlayer.currentTime = (clickX / width) * duration;
}

function setupEventListeners() {
    playBtn.addEventListener('click', () => { isPlaying ? pauseSong() : playSong(); });
    nextBtn.addEventListener('click', nextSong);
    prevBtn.addEventListener('click', prevSong);
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);

    audioPlayer.addEventListener('timeupdate', updateProgress);
    audioPlayer.addEventListener('ended', () => { if (!isRepeat) nextSong(); });
    audioPlayer.addEventListener('error', () => { showError('Error memuat audio.'); pauseSong(); });
    progressContainer.addEventListener('click', setProgress);

    volumeSlider.addEventListener('input', e => { audioPlayer.volume = e.target.value; });
    volumeDownBtn.addEventListener('click', () => {
        volumeSlider.value = Math.max(0, audioPlayer.volume - 0.1);
        audioPlayer.volume = volumeSlider.value;
    });
    volumeUpBtn.addEventListener('click', () => {
        volumeSlider.value = Math.min(1, audioPlayer.volume + 0.1);
        audioPlayer.volume = volumeSlider.value;
    });

    closeNowPlaying.addEventListener('click', hideNowPlaying);
    window.addEventListener('beforeunload', savePlayerState);

    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT') return;
        switch(e.code) {
            case 'Space': e.preventDefault(); playBtn.click(); break;
            case 'ArrowRight': nextSong(); break;
            case 'ArrowLeft': prevSong(); break;
        }
    });
}

document.addEventListener('DOMContentLoaded', init);