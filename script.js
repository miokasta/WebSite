const menuButton = document.querySelector('.menu-toggle');
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
  document.querySelector('#form-message').textContent = `You're in — updates will be sent to ${email.value}.`;
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
if (videoGalleryTrack) {
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
  const soundcloudDots = [...document.querySelectorAll('.soundcloud-pagination i')];
  let soundcloudScrollFrame;
  soundcloudCards.forEach((card) => {
    const player = card.querySelector('iframe');
    const source = player?.getAttribute('src');
    if (source && !source.includes('visual=true')) player.setAttribute('src', `${source}&visual=true`);
  });
  let soundcloudIndex = 0;

  const selectSoundcloudCard = (index) => {
    soundcloudIndex = (index + soundcloudCards.length) % soundcloudCards.length;
    const card = soundcloudCards[soundcloudIndex];
    soundcloudCards.forEach((item, itemIndex) => item.classList.toggle('active', itemIndex === soundcloudIndex));
    soundcloudDots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === soundcloudIndex));
    soundcloudTrack.scrollTo({ left: card.offsetLeft - soundcloudTrack.offsetLeft, behavior: 'smooth' });
  };

  soundcloudCards.forEach((card, index) => card.addEventListener('focusin', () => {
    soundcloudIndex = index;
    soundcloudCards.forEach((item, itemIndex) => item.classList.toggle('active', itemIndex === index));
    soundcloudDots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === index));
  }));
  soundcloudTrack.addEventListener('scroll', () => {
    cancelAnimationFrame(soundcloudScrollFrame);
    soundcloudScrollFrame = requestAnimationFrame(() => {
      const currentLeft = soundcloudTrack.scrollLeft;
      const nearestIndex = soundcloudCards.reduce((nearest, card, index) => {
        const nearestDistance = Math.abs((soundcloudCards[nearest].offsetLeft - soundcloudTrack.offsetLeft) - currentLeft);
        const distance = Math.abs((card.offsetLeft - soundcloudTrack.offsetLeft) - currentLeft);
        return distance < nearestDistance ? index : nearest;
      }, 0);
      soundcloudIndex = nearestIndex;
      soundcloudCards.forEach((item, itemIndex) => item.classList.toggle('active', itemIndex === nearestIndex));
      soundcloudDots.forEach((dot, dotIndex) => dot.classList.toggle('active', dotIndex === nearestIndex));
    });
  }, { passive: true });
  document.querySelector('.soundcloud-prev').addEventListener('click', () => selectSoundcloudCard(soundcloudIndex - 1));
  document.querySelector('.soundcloud-next').addEventListener('click', () => selectSoundcloudCard(soundcloudIndex + 1));
}

const aboutGallery = document.querySelector('.about-gallery');
if (aboutGallery) {
  const aboutTrack = aboutGallery.querySelector('.about-photo-track');
  const aboutSlides = [...aboutGallery.querySelectorAll('.about-photo')];
  const aboutNumber = aboutGallery.querySelector('.about-counter span');
  let aboutIndex = 0;
  let aboutSwipeX = 0;
  let aboutTimer;

  const showAboutPhoto = (index) => {
    aboutIndex = (index + aboutSlides.length) % aboutSlides.length;
    aboutTrack.style.transform = `translateX(-${aboutIndex * 100}%)`;
    aboutSlides.forEach((slide, slideIndex) => slide.classList.toggle('active', slideIndex === aboutIndex));
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
  startAboutCarousel();
}
