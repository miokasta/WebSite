const menuButton = document.querySelector('.menu-toggle');
let siteIntro = document.querySelector('.site-intro');
let siteIntroTimer = 0;
let siteIntroPrepareTimer = 0;
let siteIntroBlackoutTimer = 0;
let siteIntroLeaveTimer = 0;

const playSiteIntro = (onReveal, onPrepare) => {
  if (!siteIntro) {
    if (onReveal) onReveal();
    return;
  }

  window.clearTimeout(siteIntroTimer);
  window.clearTimeout(siteIntroPrepareTimer);
  window.clearTimeout(siteIntroBlackoutTimer);
  window.clearTimeout(siteIntroLeaveTimer);

  /* Replacing the small intro layer reliably restarts every ring/text animation in Safari. */
  const restartedIntro = siteIntro.cloneNode(true);
  siteIntro.replaceWith(restartedIntro);
  siteIntro = restartedIntro;
  siteIntro.classList.remove('is-blackout', 'is-leaving');
  siteIntro.setAttribute('aria-hidden', 'false');
  document.body.classList.add('intro-active');

  /* Prepare the next cover while the opaque intro still completely hides the album. */
  siteIntroPrepareTimer = window.setTimeout(() => {
    if (onPrepare) onPrepare();
  }, 3850);

  /* Let the title disappear first, leaving a clean black frame before the cover is revealed. */
  siteIntroBlackoutTimer = window.setTimeout(() => {
    siteIntro.classList.add('is-blackout');
  }, 4400);

  siteIntroTimer = window.setTimeout(() => {
    if (onReveal) onReveal();
    window.requestAnimationFrame(() => siteIntro.classList.add('is-leaving'));
    siteIntroLeaveTimer = window.setTimeout(() => {
      siteIntro.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('intro-active');
    }, 720);
  }, 5000);
};

playSiteIntro();

const navigation = document.querySelector('.site-nav');
const siteHeader = document.querySelector('.site-header');
const navigationLinks = [...navigation.querySelectorAll('a[href^="#"]')];

const setActiveNavigation = (activeLink) => {
  navigationLinks.forEach((link) => {
    const isActive = link === activeLink;
    link.classList.toggle('active', isActive);
    if (isActive) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
};

const updateActiveNavigation = () => {
  if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4) {
    setActiveNavigation(navigationLinks.find((link) => link.hash === '#booking'));
    return;
  }

  const marker = window.scrollY + siteHeader.offsetHeight + 24;
  const positions = navigationLinks.map((link) => {
    const target = document.querySelector(link.hash);
    let top = link.hash === '#home' ? 0 : window.scrollY + target.getBoundingClientRect().top;
    if (link.hash === '#live') {
      const about = document.querySelector('#about');
      top = window.scrollY + about.getBoundingClientRect().top + Math.max(150, about.offsetHeight * 0.52);
    }
    return { link, top };
  }).sort((a, b) => a.top - b.top);

  const current = positions.reduce((active, item) => item.top <= marker ? item : active, positions[0]);
  setActiveNavigation(current.link);
};

let navigationFrame;
const requestNavigationUpdate = () => {
  cancelAnimationFrame(navigationFrame);
  navigationFrame = requestAnimationFrame(updateActiveNavigation);
};

window.addEventListener('scroll', requestNavigationUpdate, { passive: true });
window.addEventListener('resize', requestNavigationUpdate);
window.addEventListener('load', updateActiveNavigation);
updateActiveNavigation();

menuButton.addEventListener('click', () => {
  const isOpen = navigation.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(isOpen));
});

navigation.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    setActiveNavigation(link);
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  });
});

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.reveal').forEach((element) => revealObserver.observe(element));

const track = document.querySelector('.music-track');
const releaseCards = [...track.querySelectorAll('.release-card')];
const musicCarouselCount = document.querySelector('#music-carousel-count');
let releaseIndex = 0;
const updateMusicCarouselCount = () => {
  musicCarouselCount.textContent = `${String(releaseIndex + 1).padStart(2, '0')} / ${String(releaseCards.length).padStart(2, '0')}`;
};
const moveCarousel = (direction) => {
  releaseIndex = (releaseIndex + direction + releaseCards.length) % releaseCards.length;
  updateMusicCarouselCount();
  const targetCard = releaseCards[releaseIndex];
  track.classList.add('is-moving');
  track.scrollTo({ left: targetCard.offsetLeft - track.offsetLeft, behavior: 'smooth' });
  window.setTimeout(() => track.classList.remove('is-moving'), 500);
};

document.querySelector('.music-prev').addEventListener('click', () => moveCarousel(-1));
document.querySelector('.music-next').addEventListener('click', () => moveCarousel(1));
let musicScrollFrame;
track.addEventListener('scroll', () => {
  cancelAnimationFrame(musicScrollFrame);
  musicScrollFrame = requestAnimationFrame(() => {
    const visibleLeft = track.scrollLeft;
    releaseIndex = releaseCards.reduce((closestIndex, card, index) => {
      const cardLeft = card.offsetLeft - track.offsetLeft;
      const closestLeft = releaseCards[closestIndex].offsetLeft - track.offsetLeft;
      return Math.abs(cardLeft - visibleLeft) < Math.abs(closestLeft - visibleLeft) ? index : closestIndex;
    }, 0);
    updateMusicCarouselCount();
  });
}, { passive: true });

const toast = document.querySelector('.toast');
let toastTimer;
const showToast = (message) => {
  toast.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
};

document.querySelectorAll('[data-platform]').forEach((link) => {
  link.addEventListener('click', (event) => {
    event.preventDefault();
    showToast(`${link.dataset.platform} link coming soon`);
  });
});

let heroSlide = 0;
const heroDots = [...document.querySelectorAll('.hero-pagination i')];
const heroNumber = document.querySelector('.slide-number strong');
const updateHero = (direction) => {
  heroSlide = (heroSlide + direction + heroDots.length) % heroDots.length;
  heroDots.forEach((dot, index) => dot.classList.toggle('active', index === heroSlide));
  heroNumber.textContent = String(heroSlide + 1).padStart(2, '0');
};

document.querySelector('.hero-prev').addEventListener('click', () => updateHero(-1));
document.querySelector('.hero-next').addEventListener('click', () => updateHero(1));

document.querySelector('#newsletter-form').addEventListener('submit', (event) => {
  event.preventDefault();
  const email = document.querySelector('#email');
  document.querySelector('#form-message').textContent = 'Newsletter signup is coming soon. Your address has not been stored.';
  event.target.reset();
});

document.querySelector('#year').textContent = new Date().getFullYear();

document.querySelectorAll('.brand-name, .wordmark, .hero-copy h1, .release-card > p').forEach((wordmark) => {
  wordmark.textContent = wordmark.textContent.replaceAll('A', 'Λ');
});

const spotifyPlayer = document.querySelector('#spotify-player');
document.querySelectorAll('.release-card[data-spotify-id]').forEach((card) => {
  const selectSpotifyTrack = () => {
    spotifyPlayer.src = `https://open.spotify.com/embed/track/${card.dataset.spotifyId}?utm_source=generator&theme=0`;
    releaseIndex = releaseCards.indexOf(card);
    updateMusicCarouselCount();
    releaseCards.forEach((item) => item.classList.toggle('is-listening', item === card));
  };
  card.querySelector('.track-play').addEventListener('click', selectSpotifyTrack);
});

const siteVideos = [...document.querySelectorAll('.site-video')];
siteVideos.forEach((video) => {
  video.muted = true;
  video.defaultMuted = true;
  video.setAttribute('muted', '');
  video.setAttribute('playsinline', '');

  const configureVideoFragment = () => {
    const duration = Number.isFinite(video.duration) ? video.duration : 0;
    if (!duration) return;

    const lastSeconds = Number(video.dataset.lastSeconds || 0);
    const requestedStart = Number(video.dataset.fragmentStart || 0);
    const requestedLength = Number(video.dataset.fragmentLength || 300);
    const loopStart = lastSeconds
      ? Math.max(0, duration - lastSeconds)
      : Math.min(requestedStart, Math.max(0, duration - 0.25));
    const loopEnd = lastSeconds
      ? duration
      : Math.min(duration, loopStart + requestedLength);

    video.dataset.loopStart = String(loopStart);
    video.dataset.loopEnd = String(loopEnd);
    if (video.currentTime < loopStart || video.currentTime >= loopEnd) video.currentTime = loopStart;
  };

  video.addEventListener('loadedmetadata', configureVideoFragment);
  video.addEventListener('timeupdate', () => {
    const loopStart = Number(video.dataset.loopStart || 0);
    const loopEnd = Number(video.dataset.loopEnd || video.duration || 0);
    if (loopEnd && video.currentTime >= loopEnd - 0.12) {
      video.currentTime = loopStart;
      video.play().catch(() => {});
    }
  });
  video.addEventListener('play', () => {
    const loopStart = Number(video.dataset.loopStart || 0);
    const loopEnd = Number(video.dataset.loopEnd || video.duration || 0);
    if (video.currentTime < loopStart || (loopEnd && video.currentTime >= loopEnd)) video.currentTime = loopStart;
  });
  video.addEventListener('click', () => {
    if (video.paused) video.play().catch(() => {});
    else video.pause();
  });
});

const siteVideoObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    const video = entry.target;
    if (entry.isIntersecting) video.play().catch(() => {});
    else video.pause();
  });
}, { threshold: 0.25 });
siteVideos.forEach((video) => siteVideoObserver.observe(video));

const youtubeFrames = [...document.querySelectorAll('.youtube-video-frame[data-video-id]')];
if (youtubeFrames.length) {
  const youtubePlayers = new Map();
  const youtubeLoopTimers = new Map();

  window.onYouTubeIframeAPIReady = () => {
    youtubeFrames.forEach((frame) => {
      const target = frame.firstElementChild;
      const requestedStart = Number(frame.dataset.fragmentStart || 0);
      const requestedLength = Number(frame.dataset.fragmentLength || 300);
      const lastSeconds = Number(frame.dataset.lastSeconds || 0);

      const player = new YT.Player(target.id, {
        videoId: frame.dataset.videoId,
        playerVars: {
          autoplay: 1,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          playsinline: 1,
          rel: 0
        },
        events: {
          onReady: (event) => {
            const duration = event.target.getDuration();
            const loopStart = lastSeconds ? Math.max(0, duration - lastSeconds) : Math.min(requestedStart, Math.max(0, duration - 1));
            const loopEnd = lastSeconds ? duration : Math.min(duration, loopStart + requestedLength);
            frame.dataset.loopStart = String(loopStart);
            frame.dataset.loopEnd = String(loopEnd);
            event.target.mute();
            if (typeof event.target.setPlaybackQuality === 'function') {
              event.target.setPlaybackQuality('hd1080');
            }
            event.target.seekTo(loopStart, true);
            event.target.playVideo();

            clearInterval(youtubeLoopTimers.get(frame));
            youtubeLoopTimers.set(frame, setInterval(() => {
              if (event.target.getCurrentTime() >= loopEnd - 0.3) {
                event.target.seekTo(loopStart, true);
                event.target.playVideo();
              }
            }, 250));
          },
          onStateChange: (event) => {
            if (event.data === YT.PlayerState.ENDED) {
              event.target.seekTo(Number(frame.dataset.loopStart || 0), true);
              event.target.playVideo();
            }
          }
        }
      });
      youtubePlayers.set(frame, player);
    });

    const youtubeObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const player = youtubePlayers.get(entry.target);
        if (!player || typeof player.playVideo !== 'function') return;
        if (entry.isIntersecting) player.playVideo();
        else player.pauseVideo();
      });
    }, { threshold: 0.18 });
    youtubeFrames.forEach((frame) => youtubeObserver.observe(frame));
  };

  const youtubeApi = document.createElement('script');
  youtubeApi.src = 'https://www.youtube.com/iframe_api';
  youtubeApi.async = true;
  document.head.appendChild(youtubeApi);
}

const videoGalleryTrack = document.querySelector('.video-gallery-track');
if (videoGalleryTrack && !videoGalleryTrack.classList.contains('video-stack')) {
  const videoGalleryCards = [...videoGalleryTrack.querySelectorAll('.video-gallery-card')];
  const videoGalleryDots = [...document.querySelectorAll('.video-gallery-pagination i')];
  let videoGalleryIndex = 0;
  let videoGalleryScrollFrame;
  let videoGalleryTimer;
  let videoGalleryWrapTimer;

  const updateVideoGalleryState = (index) => {
    videoGalleryIndex = (index + videoGalleryCards.length) % videoGalleryCards.length;
    videoGalleryCards.forEach((item, itemIndex) => item.classList.toggle('active', itemIndex === videoGalleryIndex));
    videoGalleryDots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === videoGalleryIndex));
  };

  const showVideoGalleryCard = (index) => {
    const isLoopJump = index < 0 || index >= videoGalleryCards.length;
    const nextIndex = (index + videoGalleryCards.length) % videoGalleryCards.length;
    updateVideoGalleryState(nextIndex);
    const card = videoGalleryCards[videoGalleryIndex];
    const left = card.offsetLeft - videoGalleryTrack.offsetLeft;

    if (isLoopJump) {
      clearTimeout(videoGalleryWrapTimer);
      videoGalleryTrack.classList.add('is-looping');
      videoGalleryWrapTimer = window.setTimeout(() => {
        videoGalleryTrack.scrollTo({ left, behavior: 'auto' });
        requestAnimationFrame(() => videoGalleryTrack.classList.remove('is-looping'));
      }, 180);
      return;
    }

    videoGalleryTrack.scrollTo({ left, behavior: 'smooth' });
  };

  const startVideoGallery = () => {
    clearInterval(videoGalleryTimer);
    videoGalleryTimer = window.setInterval(() => showVideoGalleryCard(videoGalleryIndex + 1), 9000);
  };

  const moveVideoGallery = (direction) => {
    showVideoGalleryCard(videoGalleryIndex + direction);
    startVideoGallery();
  };

  document.querySelector('.video-gallery-prev').addEventListener('click', () => moveVideoGallery(-1));
  document.querySelector('.video-gallery-next').addEventListener('click', () => moveVideoGallery(1));

  videoGalleryTrack.addEventListener('scroll', () => {
    cancelAnimationFrame(videoGalleryScrollFrame);
    videoGalleryScrollFrame = requestAnimationFrame(() => {
      const currentLeft = videoGalleryTrack.scrollLeft;
      const nearestIndex = videoGalleryCards.reduce((nearest, card, index) => {
        const nearestDistance = Math.abs((videoGalleryCards[nearest].offsetLeft - videoGalleryTrack.offsetLeft) - currentLeft);
        const distance = Math.abs((card.offsetLeft - videoGalleryTrack.offsetLeft) - currentLeft);
        return distance < nearestDistance ? index : nearest;
      }, 0);
      updateVideoGalleryState(nearestIndex);
    });
  }, { passive: true });

  videoGalleryDots.forEach((dot, index) => {
    dot.setAttribute('role', 'button');
    dot.setAttribute('tabindex', '0');
    dot.setAttribute('aria-label', `Show video ${index + 1}`);
    dot.addEventListener('click', () => {
      showVideoGalleryCard(index);
      startVideoGallery();
    });
    dot.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        dot.click();
      }
    });
  });

  videoGalleryTrack.addEventListener('mouseenter', () => clearInterval(videoGalleryTimer));
  videoGalleryTrack.addEventListener('mouseleave', startVideoGallery);
  videoGalleryTrack.addEventListener('touchstart', () => clearInterval(videoGalleryTimer), { passive: true });
  videoGalleryTrack.addEventListener('touchend', startVideoGallery, { passive: true });
  updateVideoGalleryState(0);
  startVideoGallery();
}

const soundcloudTrack = document.querySelector('.soundcloud-track');
if (soundcloudTrack) {
  const soundcloudCards = [...soundcloudTrack.querySelectorAll('.soundcloud-track-card')];
  soundcloudCards.forEach((card) => {
    const player = card.querySelector('iframe');
    const source = player?.getAttribute('src');
    if (source) {
      const compactSource = source
        .replace(/([?&])visual=(?:true|false)/, '$1visual=false')
        .replace(/([?&])show_artwork=(?:true|false)/, '$1show_artwork=true');
      const withVisualMode = compactSource.includes('visual=') ? compactSource : `${compactSource}&visual=false`;
      const withArtwork = withVisualMode.includes('show_artwork=') ? withVisualMode : `${withVisualMode}&show_artwork=true`;
      if (withArtwork !== source) player.setAttribute('src', withArtwork);
    }
  });

  const soundcloudCarousel = soundcloudTrack.closest('.soundcloud-carousel');
  const soundcloudPagination = document.querySelector('.soundcloud-pagination');
  const laneNames = ['Most played', 'Remix archive', 'Deep cuts'];
  const cardsPerLane = Math.ceil(soundcloudCards.length / laneNames.length);
  const laneFragment = document.createDocumentFragment();

  laneNames.forEach((laneName, laneIndex) => {
    const laneCards = soundcloudCards.slice(laneIndex * cardsPerLane, (laneIndex + 1) * cardsPerLane);
    if (!laneCards.length) return;

    const lane = document.createElement('section');
    lane.className = 'soundcloud-lane';
    lane.setAttribute('aria-label', `${laneName} SoundCloud carousel`);
    lane.innerHTML = `
      <div class="soundcloud-lane-heading">
        <h3><span>0${laneIndex + 1}</span>${laneName}</h3>
        <b><span>01</span> / ${String(laneCards.length).padStart(2, '0')}</b>
      </div>
      <div class="soundcloud-lane-body">
        <button class="circle-arrow soundcloud-lane-prev" type="button" aria-label="Previous ${laneName} track">‹</button>
        <div class="soundcloud-lane-track" tabindex="0"></div>
        <button class="circle-arrow soundcloud-lane-next" type="button" aria-label="Next ${laneName} track">›</button>
      </div>`;

    const laneTrack = lane.querySelector('.soundcloud-lane-track');
    const laneCounter = lane.querySelector('.soundcloud-lane-heading b span');
    let laneCardIndex = 0;
    let laneScrollFrame;
    laneCards.forEach((card, cardIndex) => {
      card.classList.toggle('active', cardIndex === 0);
      laneTrack.appendChild(card);
    });

    const updateLane = (nextIndex, scroll = true) => {
      laneCardIndex = (nextIndex + laneCards.length) % laneCards.length;
      laneCards.forEach((card, cardIndex) => card.classList.toggle('active', cardIndex === laneCardIndex));
      laneCounter.textContent = String(laneCardIndex + 1).padStart(2, '0');
      if (scroll) {
        const card = laneCards[laneCardIndex];
        laneTrack.scrollTo({ left: card.offsetLeft - laneTrack.offsetLeft, behavior: 'smooth' });
      }
    };

    lane.querySelector('.soundcloud-lane-prev').addEventListener('click', () => updateLane(laneCardIndex - 1));
    lane.querySelector('.soundcloud-lane-next').addEventListener('click', () => updateLane(laneCardIndex + 1));
    laneCards.forEach((card, cardIndex) => card.addEventListener('focusin', () => updateLane(cardIndex, false)));
    laneTrack.addEventListener('scroll', () => {
      cancelAnimationFrame(laneScrollFrame);
      laneScrollFrame = requestAnimationFrame(() => {
        const currentLeft = laneTrack.scrollLeft;
        const nearestIndex = laneCards.reduce((nearest, card, cardIndex) => {
          const nearestDistance = Math.abs((laneCards[nearest].offsetLeft - laneTrack.offsetLeft) - currentLeft);
          const distance = Math.abs((card.offsetLeft - laneTrack.offsetLeft) - currentLeft);
          return distance < nearestDistance ? cardIndex : nearest;
        }, 0);
        updateLane(nearestIndex, false);
      });
    }, { passive: true });

    laneFragment.appendChild(lane);
  });

  soundcloudCarousel.classList.add('soundcloud-multi');
  soundcloudCarousel.replaceChildren(laneFragment);
  soundcloudPagination?.remove();
}

const aboutGallery = document.querySelector('.about-gallery');
if (aboutGallery) {
  const aboutTrack = aboutGallery.querySelector('.about-photo-track');
  const aboutSlides = [...aboutGallery.querySelectorAll('.about-photo')];
  const aboutNumber = aboutGallery.querySelector('.about-counter span');
  const aboutThumbnailStrip = document.querySelector('.about-thumbnail-strip');
  let aboutIndex = 0;
  let aboutSwipeX = 0;
  let aboutTimer;
  const aboutThumbs = aboutSlides.map((slide, index) => {
    const button = document.createElement('button');
    const sourceImage = slide.querySelector('img');
    button.type = 'button';
    button.className = 'about-thumbnail';
    button.setAttribute('aria-label', `Show Instagram photo ${index + 1}`);
    button.innerHTML = `<img src="${sourceImage.src}" alt="">`;
    button.addEventListener('click', () => {
      showAboutPhoto(index);
      startAboutCarousel();
    });
    aboutThumbnailStrip?.appendChild(button);
    return button;
  });

  const showAboutPhoto = (index) => {
    aboutIndex = (index + aboutSlides.length) % aboutSlides.length;
    const previousIndex = (aboutIndex - 1 + aboutSlides.length) % aboutSlides.length;
    const nextIndex = (aboutIndex + 1) % aboutSlides.length;
    aboutTrack.style.transform = 'none';
    aboutSlides.forEach((slide, slideIndex) => {
      const isActive = slideIndex === aboutIndex;
      slide.classList.toggle('active', isActive);
      slide.classList.toggle('is-preview-prev', slideIndex === previousIndex);
      slide.classList.toggle('is-preview-next', slideIndex === nextIndex);
      slide.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      slide.tabIndex = isActive ? 0 : -1;
    });
    aboutThumbs.forEach((thumb, thumbIndex) => {
      const isActive = thumbIndex === aboutIndex;
      thumb.classList.toggle('active', isActive);
      thumb.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
    const activeThumb = aboutThumbs[aboutIndex];
    if (activeThumb && aboutThumbnailStrip) {
      aboutThumbnailStrip.scrollTo({
        left: activeThumb.offsetLeft - (aboutThumbnailStrip.clientWidth - activeThumb.clientWidth) / 2,
        behavior: 'smooth'
      });
    }
    aboutNumber.textContent = String(aboutIndex + 1).padStart(2, '0');
  };
  const startAboutCarousel = () => {
    clearInterval(aboutTimer);
    aboutTimer = setInterval(() => showAboutPhoto(aboutIndex + 1), 5500);
  };

  aboutGallery.querySelector('.about-prev').addEventListener('click', () => {
    showAboutPhoto(aboutIndex - 1);
    startAboutCarousel();
  });
  aboutGallery.querySelector('.about-next').addEventListener('click', () => {
    showAboutPhoto(aboutIndex + 1);
    startAboutCarousel();
  });
  aboutGallery.addEventListener('mouseenter', () => clearInterval(aboutTimer));
  aboutGallery.addEventListener('mouseleave', startAboutCarousel);
  aboutTrack.addEventListener('touchstart', (event) => {
    aboutSwipeX = event.touches[0].clientX;
    clearInterval(aboutTimer);
  }, { passive: true });
  aboutTrack.addEventListener('touchend', (event) => {
    const distance = event.changedTouches[0].clientX - aboutSwipeX;
    if (Math.abs(distance) > 45) showAboutPhoto(aboutIndex + (distance < 0 ? 1 : -1));
    startAboutCarousel();
  }, { passive: true });
  showAboutPhoto(0);
  showAboutPhoto(0);
  startAboutCarousel();
}

/* Album navigation: each major section behaves like a separate page. */
const albumShell = document.querySelector('#album');
const albumControls = document.querySelector('.album-controls');
if (albumShell && albumControls) {
  document.body.classList.add('album-mode');

  const albumPages = [...albumShell.querySelectorAll(':scope > section'), document.querySelector('#booking')].filter(Boolean);
  const albumNumber = albumControls.querySelector('.album-page-number b');
  const albumTotal = albumControls.querySelector('.album-page-number em');
  const albumTitle = albumControls.querySelector('.album-page-title');
  const albumPrev = albumControls.querySelector('.album-page-prev');
  const albumNext = albumControls.querySelector('.album-page-next');
  const albumNavGroups = {
    home: '#home', latest: '#home', music: '#music', remixes: '#music',
    videos: '#videos', about: '#videos', community: '#booking', booking: '#booking'
  };
  let albumIndex = 0;
  let albumLocked = false;
  let albumTouchX = 0;
  let albumTouchY = 0;
  let albumTouchScrollTop = 0;
  let albumTouchPageIndex = 0;
  let albumLastWheelAt = 0;
  let albumPageHoldUntil = 0;
  let albumExitArmPage = -1;
  let albumExitArmDirection = 0;
  let albumExitArmExpires = 0;
  let albumExitCueTimer = 0;
  let albumTurnTimer = 0;
  let albumUnlockTimer = 0;
  let albumTransitionReadyAt = 0;
  let albumWrapCleanupTimer = 0;

  albumPages.forEach((page, index) => {
    page.classList.add('album-page');
    page.setAttribute('aria-hidden', index === 0 ? 'false' : 'true');
  });
  albumTotal.textContent = String(albumPages.length).padStart(2, '0');

  const pageForHash = (hash) => {
    const target = hash && document.querySelector(hash);
    if (!target) return null;
    return target.classList.contains('album-page') ? target : target.closest('.album-page');
  };

  const syncAlbumNavigation = (page) => {
    const pageKey = page.id || 'home';
    const navHash = albumNavGroups[pageKey] || '#home';
    const navLink = navigationLinks.find((link) => link.hash === navHash);
    if (navLink) setActiveNavigation(navLink);
  };

  const scheduleAlbumUnlock = () => {
    window.clearTimeout(albumUnlockTimer);
    const transitionWait = Math.max(0, albumTransitionReadyAt - Date.now());
    const wheelWait = Math.max(0, 420 - (Date.now() - albumLastWheelAt));
    const wait = Math.max(transitionWait, wheelWait);
    albumUnlockTimer = window.setTimeout(() => {
      const stillReceivingWheelMomentum = Date.now() - albumLastWheelAt < 420;
      if (Date.now() < albumTransitionReadyAt || stillReceivingWheelMomentum) {
        scheduleAlbumUnlock();
        return;
      }
      albumLocked = false;
    }, Math.max(24, wait));
  };

  const resetAlbumExitArm = () => {
    albumExitArmPage = -1;
    albumExitArmDirection = 0;
    albumExitArmExpires = 0;
    document.body.classList.remove('is-album-paused');
    window.clearTimeout(albumExitCueTimer);
  };

  const confirmAlbumExit = (direction, isFreshGesture = true) => {
    if (direction < 0 && albumIndex === 0) return false;
    const now = Date.now();
    const sameArmedExit = albumExitArmPage === albumIndex
      && albumExitArmDirection === direction
      && now < albumExitArmExpires;
    if (sameArmedExit) return isFreshGesture;
    albumExitArmPage = albumIndex;
    albumExitArmDirection = direction;
    albumExitArmExpires = now + 2400;
    document.body.classList.remove('is-album-paused');
    void document.body.offsetWidth;
    document.body.classList.add('is-album-paused');
    window.clearTimeout(albumExitCueTimer);
    albumExitCueTimer = window.setTimeout(() => {
      document.body.classList.remove('is-album-paused');
    }, 720);
    return false;
  };

  const showAlbumPage = (nextIndex, options = {}) => {
    const previousIndex = albumIndex;
    const wrapsForward = nextIndex >= albumPages.length;
    const normalizedIndex = wrapsForward
      ? 0
      : Math.max(0, Math.min(albumPages.length - 1, nextIndex));
    if (normalizedIndex === albumIndex && document.body.classList.contains('album-ready')) return;

    const direction = wrapsForward || normalizedIndex >= albumIndex ? 1 : -1;
    const directionName = direction > 0 ? 'forward' : 'backward';
    albumIndex = normalizedIndex;
    resetAlbumExitArm();
    albumShell.dataset.direction = directionName;
    document.body.dataset.albumDirection = directionName;
    document.body.classList.toggle('is-wrapping-forward', wrapsForward);
    document.body.classList.remove('is-page-turning');
    void document.body.offsetWidth;
    document.body.classList.add('is-page-turning');
    window.clearTimeout(albumTurnTimer);
    albumTurnTimer = window.setTimeout(() => {
      document.body.classList.remove('is-page-turning');
      document.body.classList.remove('is-wrapping-forward');
    }, 1100);
    albumPages.forEach((page, index) => {
      const isActive = index === albumIndex;
      const isBefore = wrapsForward ? !isActive : index < albumIndex;
      page.classList.toggle('is-wrap-source', wrapsForward && index === previousIndex);
      page.classList.toggle('is-active', isActive);
      page.classList.toggle('is-before', isBefore);
      page.classList.toggle('is-after', !wrapsForward && index > albumIndex);
      page.setAttribute('aria-hidden', isActive ? 'false' : 'true');
      window.clearTimeout(page.albumVisibilityTimer);
      page.style.opacity = isActive ? '1' : '0';
      page.style.visibility = 'visible';
      page.style.pointerEvents = isActive ? 'auto' : 'none';
      page.style.zIndex = isActive ? '100' : '1';
      page.style.transform = isActive
        ? 'translate3d(0,0,0) rotateY(0deg)'
        : isBefore
          ? 'translate3d(-32%,0,-240px) rotateY(68deg) scale(.96)'
          : 'translate3d(32%,0,-240px) rotateY(-68deg) scale(.96)';
      page.style.filter = isActive ? 'none' : 'brightness(.32) saturate(.68) blur(.8px)';
      if (isActive) page.scrollTop = 0;
      else page.albumVisibilityTimer = window.setTimeout(() => {
        if (!page.classList.contains('is-active')) page.style.visibility = 'hidden';
      }, 1100);
    });
    window.clearTimeout(albumWrapCleanupTimer);
    albumWrapCleanupTimer = window.setTimeout(() => {
      albumPages.forEach((page) => page.classList.remove('is-wrap-source'));
    }, 1250);

    const activePage = albumPages[albumIndex];
    albumPageHoldUntil = Date.now() + (activePage.id === 'videos' ? 2200 : activePage.id === 'remixes' ? 1800 : 1400);
    albumNumber.textContent = String(albumIndex + 1).padStart(2, '0');
    albumTitle.textContent = activePage.dataset.albumTitle || activePage.id || 'Page';
    albumPrev.disabled = albumIndex === 0;
    albumNext.disabled = false;
    syncAlbumNavigation(activePage);

    if (options.updateHash !== false && activePage.id) {
      history.replaceState(null, '', `#${activePage.id}`);
    }

    albumLocked = true;
    albumTransitionReadyAt = Date.now() + 1080;
    scheduleAlbumUnlock();
  };

  const pageCanScroll = (page, direction) => {
    if (page.scrollHeight <= page.clientHeight + 4) return false;
    if (direction > 0) return page.scrollTop + page.clientHeight < page.scrollHeight - 4;
    return page.scrollTop > 4;
  };

  const turnAlbumPage = (direction) => {
    if (albumLocked) return;
    const wrapsToCover = direction > 0 && albumIndex === albumPages.length - 1;
    if (wrapsToCover) {
      albumLocked = true;
      resetAlbumExitArm();
      playSiteIntro(
        () => { albumLocked = false; },
        () => { showAlbumPage(albumPages.length); }
      );
      return;
    }
    showAlbumPage(albumIndex + direction);
  };

  albumPrev.addEventListener('click', () => turnAlbumPage(-1));
  albumNext.addEventListener('click', () => turnAlbumPage(1));

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#"]');
    if (!link) return;
    const targetPage = pageForHash(link.hash);
    if (!targetPage) return;
    event.preventDefault();
    const targetIndex = albumPages.indexOf(targetPage);
    if (targetIndex >= 0) showAlbumPage(targetIndex);
    navigation.classList.remove('open');
    menuButton.setAttribute('aria-expanded', 'false');
  });

  window.addEventListener('wheel', (event) => {
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY) || Math.abs(event.deltaY) < 18) return;
    if (event.target.closest('iframe,input,textarea,select')) return;
    const direction = event.deltaY > 0 ? 1 : -1;
    const activePage = albumPages[albumIndex];
    if (pageCanScroll(activePage, direction)) return;
    event.preventDefault();
    const now = Date.now();
    const isFreshGesture = now - albumLastWheelAt > 240;
    albumLastWheelAt = now;
    if (albumLocked) {
      scheduleAlbumUnlock();
      return;
    }
    if (now < albumPageHoldUntil) return;
    if (!confirmAlbumExit(direction, isFreshGesture)) return;
    turnAlbumPage(direction);
  }, { passive: false });

  window.addEventListener('keydown', (event) => {
    if (event.target.matches('input,textarea,select') || event.target.closest('iframe')) return;
    if (['ArrowDown', 'PageDown'].includes(event.key) || (event.key === ' ' && !event.shiftKey)) {
      event.preventDefault();
      turnAlbumPage(1);
    }
    if (['ArrowUp', 'PageUp'].includes(event.key) || (event.key === ' ' && event.shiftKey)) {
      event.preventDefault();
      turnAlbumPage(-1);
    }
  });

  window.addEventListener('touchstart', (event) => {
    albumTouchX = event.touches[0].clientX;
    albumTouchY = event.touches[0].clientY;
    albumTouchPageIndex = albumIndex;
    albumTouchScrollTop = albumPages[albumIndex].scrollTop;
  }, { passive: true });
  window.addEventListener('touchend', (event) => {
    const deltaX = event.changedTouches[0].clientX - albumTouchX;
    const deltaY = event.changedTouches[0].clientY - albumTouchY;
    if (Math.abs(deltaY) < 55 || Math.abs(deltaY) <= Math.abs(deltaX)) return;
    const direction = deltaY < 0 ? 1 : -1;
    const activePage = albumPages[albumIndex];
    const startedOnCurrentPage = albumTouchPageIndex === albumIndex;
    const couldScrollAtGestureStart = direction > 0
      ? albumTouchScrollTop + activePage.clientHeight < activePage.scrollHeight - 4
      : albumTouchScrollTop > 4;
    if (Date.now() < albumPageHoldUntil) return;
    if (startedOnCurrentPage && couldScrollAtGestureStart) return;
    if (!pageCanScroll(activePage, direction) && confirmAlbumExit(direction)) turnAlbumPage(direction);
  }, { passive: true });

  window.addEventListener('hashchange', () => {
    const targetPage = pageForHash(window.location.hash);
    const targetIndex = albumPages.indexOf(targetPage);
    if (targetIndex >= 0) showAlbumPage(targetIndex, { updateHash: false });
  });

  const initialPage = pageForHash(window.location.hash);
  const initialIndex = albumPages.indexOf(initialPage);
  showAlbumPage(initialIndex >= 0 ? initialIndex : 0, { updateHash: false });
  requestAnimationFrame(() => document.body.classList.add('album-ready'));
}
