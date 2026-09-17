import { campaignLinks } from './config.js';
import { createTracker } from './analytics.js';
import { applyLanguage, resolveLanguage } from './i18n.js';

const MOBILE_BREAKPOINT = '(max-width: 767px)';
const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';
const track = createTracker();

// Resolve a campaign destination for the current document language.
const getCampaignLink = (type) => {
  const language = document.documentElement.lang || 'en';
  return campaignLinks[type][language] || campaignLinks[type].en;
};

// Keep all localized campaign links synchronized after a language change.
const syncCampaignLinks = () => {
  document.querySelectorAll('[data-cta]').forEach((link) => {
    link.href = getCampaignLink('register');
  });

  document.querySelectorAll('[data-community]').forEach((link) => {
    link.href = getCampaignLink('community');
  });
};

// Set up the language menu and refresh localized text and campaign URLs.
const setupLanguageSwitcher = () => {
  const languageSwitcher = document.querySelector('.language-switcher');
  const languageTrigger = document.querySelector('.language-trigger');
  const languageMenu = document.querySelector('.language-menu');

  const setLanguageMenuOpen = (open) => {
    if (!languageSwitcher || !languageTrigger || !languageMenu) return;
    languageMenu.hidden = !open;
    languageTrigger.setAttribute('aria-expanded', String(open));
  };

  languageTrigger?.addEventListener('click', () => {
    setLanguageMenuOpen(languageMenu.hidden);
  });

  document.addEventListener('click', (event) => {
    if (languageSwitcher && !languageSwitcher.contains(event.target)) {
      setLanguageMenuOpen(false);
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      setLanguageMenuOpen(false);
    }
  });

  document.querySelectorAll('[data-lang]').forEach((button) => {
    button.addEventListener('click', () => {
      const language = applyLanguage(button.dataset.lang);
      syncCampaignLinks();
      track('language_changed', { to_language: language });
      setLanguageMenuOpen(false);
    });
  });
};

// Attach navigation behavior to registration, event, and signup actions.
const setupRegistrationActions = () => {
  document.querySelectorAll('[data-cta]').forEach((link) => {
    link.addEventListener('click', () => {
      track('cta_clicked', {
        cta: link.dataset.cta,
        destination: 'register'
      });
      link.href = getCampaignLink('register');
    });
  });

  document.querySelectorAll('[data-event]').forEach((link) => {
    link.addEventListener('click', () => {
      track('cta_clicked', {
        cta: link.dataset.event,
        destination: 'welcome_event'
      });
      window.location.href = getCampaignLink('welcomeEvent');
    });
  });

  document.querySelectorAll('[data-signup]').forEach((link) => {
    // Navigate a signup card to the localized registration page.
    const openSignup = () => {
      track('cta_clicked', {
        cta: 'signup',
        destination: 'register'
      });
      window.location.href = getCampaignLink('register');
    };

    link.addEventListener('click', openSignup);
    link.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        openSignup();
      }
    });
  });
};

// Keep each desktop/mobile tab group independent because both layouts exist in the DOM.
const setupStepTabs = () => {
  document.querySelectorAll('[data-step-group]').forEach((group) => {
    const stepTabs = [...group.querySelectorAll('[data-step][role="tab"]')];
    const stepPanels = [...group.querySelectorAll('[data-step-panel]')];
    const startedPanels = group.querySelector('.started-panels');
    const isMobileGroup = group.dataset.stepGroup === 'mobile';

    const selectStep = (step, source = 'script') => {
      const previousStep = stepTabs
        .find((tab) => tab.getAttribute('aria-selected') === 'true')
        ?.dataset.step;

      stepTabs.forEach((tab) => {
        const selected = tab.dataset.step === step;
        tab.classList.toggle('active', selected);
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
      });

      stepPanels.forEach((panel) => {
        panel.hidden = panel.dataset.stepPanel !== step;
      });

      if (isMobileGroup && startedPanels) {
        const activeTab = stepTabs.find((tab) => tab.dataset.step === step);
        const activePanel = stepPanels.find((panel) => panel.dataset.stepPanel === step);

        // On mobile, the selected panel appears immediately below its tab.
        // The inactive panels stay in the separate container and remain hidden.
        stepPanels
          .filter((panel) => panel !== activePanel)
          .forEach((panel) => startedPanels.appendChild(panel));

        if (activeTab && activePanel) {
          activeTab.insertAdjacentElement('afterend', activePanel);
        }
      }

      if (source === 'tab' && previousStep !== step) {
        track('step_selected', { step });
      }
    };

    stepTabs.forEach((tab, index) => {
      tab.addEventListener('click', () => selectStep(tab.dataset.step, 'tab'));
      tab.addEventListener('keydown', (event) => {
        const supportedKeys = [
          'ArrowDown',
          'ArrowRight',
          'ArrowUp',
          'ArrowLeft',
          'Home',
          'End'
        ];

        if (!supportedKeys.includes(event.key)) return;

        // Follow the ARIA tabs pattern: arrow keys move focus and activate a tab.
        event.preventDefault();
        const direction = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1;
        const nextIndex = event.key === 'Home'
          ? 0
          : event.key === 'End'
            ? stepTabs.length - 1
            : (index + direction + stepTabs.length) % stepTabs.length;

        stepTabs[nextIndex].focus();
        selectStep(stepTabs[nextIndex].dataset.step, 'tab');
      });
    });

    const initialStep = stepTabs
      .find((tab) => tab.getAttribute('aria-selected') === 'true')
      ?.dataset.step || 'account';

    selectStep(initialStep);
  });
};

// Reward cards have their own analytics event in addition to any navigation event.
const setupSignupTracking = () => {
  document.querySelectorAll('[data-reward]').forEach((item) => {
    item.addEventListener('click', () => {
      track('reward_clicked', { reward: item.dataset.reward });
    });
  });
};

// Track community and external social links while preserving normal browser navigation.
const setupCommunityTracking = () => {
  document.querySelectorAll('[data-community]').forEach((link) => {
    link.addEventListener('click', () => {
      track('community_clicked');
      link.href = getCampaignLink('community');
    });
  });

  document.querySelectorAll('a[data-track]').forEach((link) => {
    link.addEventListener('click', () => {
      track('outbound_link_clicked', { link: link.dataset.track });
    });
  });
};

// Keep the horizontal mobile section menu aligned with the section currently in view.
const setupSectionNavigation = () => {
  const sectionLinks = [...document.querySelectorAll('[data-section-link]')];
  if (!sectionLinks.length) return;

  const mobileSectionNav = window.matchMedia(MOBILE_BREAKPOINT);
  const mobileSectionNavElement = document.querySelector('.mobile-section-nav');
  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);
  let activeSectionId = sectionLinks
    .find((link) => link.getAttribute('aria-current') === 'page')
    ?.dataset.sectionLink;
  let pendingSectionId = null;
  let navScrollFrame = 0;

  // Cancel a menu animation when the user starts interacting with the scroll area.
  const cancelNavScroll = () => {
    if (!navScrollFrame) return;
    window.cancelAnimationFrame(navScrollFrame);
    navScrollFrame = 0;
  };

  // Scroll the active section link into view without interrupting user input.
  const moveSectionNav = (targetLeft, animate) => {
    if (!mobileSectionNavElement) return;
    cancelNavScroll();

    const startLeft = mobileSectionNavElement.scrollLeft;
    const distance = targetLeft - startLeft;
    if (Math.abs(distance) <= 1) return;

    if (!animate || reducedMotion.matches) {
      mobileSectionNavElement.scrollLeft = targetLeft;
      return;
    }

    const duration = Math.min(420, Math.max(220, Math.abs(distance) * 0.6));
    const startedAt = performance.now();

    const animateScroll = (now) => {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - ((1 - progress) ** 3);
      mobileSectionNavElement.scrollLeft = startLeft + distance * eased;

      if (progress < 1) {
        navScrollFrame = window.requestAnimationFrame(animateScroll);
      } else {
        navScrollFrame = 0;
      }
    };

    navScrollFrame = window.requestAnimationFrame(animateScroll);
  };

  // Update the active link and ensure it is visible in the horizontal menu.
  const setActiveSectionLink = (sectionId, animateNav = true) => {
    const changed = activeSectionId !== sectionId;
    activeSectionId = sectionId;

    sectionLinks.forEach((link) => {
      const active = link.dataset.sectionLink === sectionId;
      if (active) {
        link.setAttribute('aria-current', 'page');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    if (changed && mobileSectionNav.matches && mobileSectionNavElement) {
      const activeLink = sectionLinks.find((link) => link.dataset.sectionLink === sectionId);
      if (activeLink) {
        const edgePadding = 16;
        const visibleLeft = mobileSectionNavElement.scrollLeft + edgePadding;
        const visibleRight = mobileSectionNavElement.scrollLeft
          + mobileSectionNavElement.clientWidth
          - edgePadding;
        let targetLeft = mobileSectionNavElement.scrollLeft;

        if (activeLink.offsetLeft < visibleLeft) {
          targetLeft = activeLink.offsetLeft - edgePadding;
        } else if (activeLink.offsetLeft + activeLink.offsetWidth > visibleRight) {
          targetLeft = activeLink.offsetLeft + activeLink.offsetWidth
            - mobileSectionNavElement.clientWidth + edgePadding;
        }

        targetLeft = Math.max(
          0,
          Math.min(targetLeft, mobileSectionNavElement.scrollWidth - mobileSectionNavElement.clientWidth)
        );

        if (Math.abs(targetLeft - mobileSectionNavElement.scrollLeft) > 1) {
          moveSectionNav(targetLeft, animateNav);
        }
      }
    }
  };

  sectionLinks.forEach((link) => {
    link.addEventListener('click', () => {
      pendingSectionId = link.dataset.sectionLink;
      setActiveSectionLink(link.dataset.sectionLink);
    });
  });

  // Map custom anchor targets such as #trade-alongside back to their section nav item.
  const syncActiveSectionFromHash = () => {
    const targetHash = window.location.hash;
    if (!targetHash) return;

    const targetLink = sectionLinks.find((link) => link.getAttribute('href') === targetHash);
    if (targetLink) {
      pendingSectionId = targetLink.dataset.sectionLink;
      setActiveSectionLink(targetLink.dataset.sectionLink, false);
    }
  };

  window.addEventListener('hashchange', syncActiveSectionFromHash);
  syncActiveSectionFromHash();

  mobileSectionNavElement?.addEventListener('pointerdown', cancelNavScroll, { passive: true });
  mobileSectionNavElement?.addEventListener('wheel', cancelNavScroll, { passive: true });

  const sections = sectionLinks
    .map((link) => document.getElementById(link.dataset.sectionLink))
    .filter(Boolean);
  let scrollFrame = 0;

  // Add the compact sticky class only while the menu is visible on mobile.
  const updateSectionNavState = () => {
    if (!mobileSectionNavElement) return;

    const stuck = mobileSectionNav.matches
      && mobileSectionNavElement.getBoundingClientRect().top <= 64;
    mobileSectionNavElement.classList.toggle('is-stuck', stuck);
  };

  // Use a viewport marker instead of the exact top edge to make section changes feel stable.
  const updateActiveSection = () => {
    scrollFrame = 0;
    updateSectionNavState();
    if (!mobileSectionNav.matches || !sections.length) return;

    const marker = window.scrollY + Math.min(window.innerHeight * 0.35, 240);

    // Keep the clicked item active while the browser is completing its anchor scroll.
    if (pendingSectionId) {
      const pendingSection = sections.find((section) => section.id === pendingSectionId);
      if (pendingSection && pendingSection.offsetTop > marker) {
        setActiveSectionLink(pendingSectionId, false);
        return;
      }
      pendingSectionId = null;
    }

    let activeSection = sections[0];

    sections.forEach((section) => {
      if (section.offsetTop <= marker) activeSection = section;
    });

    setActiveSectionLink(activeSection.id, false);
  };

  // Limit scroll work to one animation frame at a time.
  const scheduleActiveSectionUpdate = () => {
    if (!mobileSectionNav.matches) return;
    if (scrollFrame) return;
    scrollFrame = window.requestAnimationFrame(updateActiveSection);
  };

  window.addEventListener('scroll', scheduleActiveSectionUpdate, { passive: true });
  window.addEventListener('resize', scheduleActiveSectionUpdate);
  window.addEventListener('load', scheduleActiveSectionUpdate, { once: true });
  scheduleActiveSectionUpdate();
};

// Use native horizontal scrolling on mobile and a timed indicator on desktop.
const setupReferralCarousel = () => {
  const referralDots = [...document.querySelectorAll('.referral-dots span')];
  const referralMarquee = document.querySelector('.referral-marquee');
  const mobileCarousel = window.matchMedia(MOBILE_BREAKPOINT);
  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);

  // Update both the visual state and the accessible current-item state.
  const setReferralDot = (index) => {
    referralDots.forEach((dot, dotIndex) => {
      const active = dotIndex === index;
      dot.classList.toggle('active', active);
      dot.toggleAttribute('aria-current', active);
    });
  };

  // Convert the mobile scroll position into the nearest referral-card index.
  const updateReferralDot = () => {
    if (!referralMarquee || !referralDots.length) return;

    const firstCard = referralMarquee.querySelector('.referral-grid article');
    const grid = referralMarquee.querySelector('.referral-grid');
    if (!firstCard || !grid) return;

    const gap = parseFloat(window.getComputedStyle(grid).columnGap) || 0;
    const step = firstCard.getBoundingClientRect().width + gap;
    const activeIndex = step
      ? Math.round(referralMarquee.scrollLeft / step) % referralDots.length
      : 0;

    setReferralDot((activeIndex + referralDots.length) % referralDots.length);
  };

  let referralInterval = 0;
  let referralScrollAttached = false;

  // Attach only the behavior required by the current responsive mode.
  const syncReferralMode = () => {
    if (!referralDots.length) return;

    if (mobileCarousel.matches) {
      if (referralInterval) {
        window.clearInterval(referralInterval);
        referralInterval = 0;
      }

      if (referralMarquee && !referralScrollAttached) {
        referralMarquee.addEventListener('scroll', updateReferralDot, { passive: true });
        referralScrollAttached = true;
      }

      updateReferralDot();
      return;
    }

    if (referralMarquee && referralScrollAttached) {
      referralMarquee.removeEventListener('scroll', updateReferralDot);
      referralScrollAttached = false;
    }

    if (!reducedMotion.matches && !referralInterval) {
      let activeReferralDot = 0;
      referralInterval = window.setInterval(() => {
        activeReferralDot = (activeReferralDot + 1) % referralDots.length;
        setReferralDot(activeReferralDot);
      }, 3000);
    }
  };

  mobileCarousel.addEventListener('change', syncReferralMode);
  syncReferralMode();
};

// Use horizontal scrolling on mobile and a looping vertical animation on desktop.
const setupChallengeCarousel = () => {
  const challengeCards = [...document.querySelectorAll('[data-challenge-carousel] article')];
  const challengeTrack = document.querySelector('[data-challenge-carousel] .challenge-track');
  const challengeMobile = window.matchMedia(MOBILE_BREAKPOINT);
  const reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY);

  if (!challengeCards.length || !challengeTrack) return;

  const challengeWindow = challengeTrack.parentElement;
  const challengeDots = [...document.querySelectorAll('.challenge-dots span')];
  const challengeMoveDuration = 420;
  const challengeCycleDuration = 2000;
  const challengeDesktopDistance = 112;
  const challengeActiveOffset = 1;
  let challengeLoopCards = [...challengeCards];
  let challengePosition = 0;
  let challengeInterval = 0;
  let challengeStepTimer = 0;
  let challengeResetTimer = 0;
  let mobileScrollAttached = false;

  // Highlight whichever mobile card is closest to the center of the viewport.
  const updateChallengeSelection = () => {
    if (!challengeWindow) return;

    const windowCenter = challengeWindow.scrollLeft + (challengeWindow.clientWidth / 2);
    let activeIndex = 0;
    let closestDistance = Number.POSITIVE_INFINITY;
    const windowRect = challengeWindow.getBoundingClientRect();

    challengeCards.forEach((card, index) => {
      const cardRect = card.getBoundingClientRect();
      const cardCenter = cardRect.left - windowRect.left
        + challengeWindow.scrollLeft
        + (cardRect.width / 2);
      const distance = Math.abs(cardCenter - windowCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        activeIndex = index;
      }
    });

    challengeCards.forEach((card, index) => {
      card.classList.toggle('selected', index === activeIndex);
    });

    challengeDots.forEach((dot, index) => {
      const active = index === activeIndex;
      dot.classList.toggle('active', active);
      dot.toggleAttribute('aria-current', active);
    });
  };

  // Stop timers, remove desktop clones, and restore the original card list.
  const stopChallengeDesktop = () => {
    if (challengeInterval) {
      window.clearInterval(challengeInterval);
      challengeInterval = 0;
    }

    window.clearTimeout(challengeStepTimer);
    window.clearTimeout(challengeResetTimer);
    challengeStepTimer = 0;
    challengeResetTimer = 0;
    challengeTrack.classList.remove('is-moving', 'is-resetting');
    challengeTrack.style.transform = '';
    challengeTrack.querySelectorAll('article[aria-hidden="true"]').forEach((card) => card.remove());
    challengeLoopCards = [...challengeCards];
    challengePosition = 0;
  };

  // Duplicate the cards once so the desktop list can loop without a visible jump.
  const startChallengeDesktop = () => {
    if (reducedMotion.matches || challengeInterval) return;

    challengeCards.forEach((card) => {
      const loopClone = card.cloneNode(true);
      loopClone.classList.remove('selected');
      loopClone.setAttribute('aria-hidden', 'true');
      challengeTrack.appendChild(loopClone);
    });

    challengeLoopCards = [...challengeTrack.querySelectorAll('article')];
    challengeLoopCards.forEach((card) => card.classList.remove('selected'));
    challengeCards[challengeActiveOffset]?.classList.add('selected');

    const setChallengeTransform = () => {
      challengeTrack.style.transform = `translateY(-${challengePosition * challengeDesktopDistance}px)`;
    };

    challengeInterval = window.setInterval(() => {
      challengePosition += 1;
      challengeTrack.classList.add('is-moving');
      setChallengeTransform();

      challengeStepTimer = window.setTimeout(() => {
        challengeLoopCards.forEach((card) => card.classList.remove('selected'));
        const selectedIndex = challengePosition + challengeActiveOffset;
        challengeLoopCards[selectedIndex]?.classList.add('selected');

        challengeDots.forEach((dot, index) => {
          const active = index === (challengePosition + challengeActiveOffset) % challengeCards.length;
          dot.classList.toggle('active', active);
          dot.toggleAttribute('aria-current', active);
        });

        if (challengePosition === challengeCards.length) {
          challengeResetTimer = window.setTimeout(() => {
            challengeTrack.classList.add('is-resetting');
            challengeTrack.style.transition = 'none';
            challengePosition = 0;
            challengeLoopCards.forEach((card) => card.classList.remove('selected'));
            challengeCards[challengeActiveOffset]?.classList.add('selected');
            challengeTrack.style.transform = 'translateY(0)';
            challengeTrack.offsetHeight;
            challengeTrack.style.transition = '';
            challengeTrack.classList.remove('is-moving', 'is-resetting');
          }, challengeMoveDuration);
        }
      }, challengeMoveDuration);
    }, challengeCycleDuration);
  };

  // Switch carousel behavior when the viewport crosses the mobile breakpoint.
  const syncChallengeMode = () => {
    stopChallengeDesktop();

    if (challengeMobile.matches) {
      if (!mobileScrollAttached) {
        challengeWindow?.addEventListener('scroll', updateChallengeSelection, { passive: true });
        mobileScrollAttached = true;
      }

      updateChallengeSelection();
      return;
    }

    if (mobileScrollAttached) {
      challengeWindow?.removeEventListener('scroll', updateChallengeSelection);
      mobileScrollAttached = false;
    }

    startChallengeDesktop();
  };

  challengeMobile.addEventListener('change', syncChallengeMode);
  syncChallengeMode();
};

// Initialize feature listeners before applying the persisted language and tracking page view.
const init = () => {
  setupLanguageSwitcher();
  setupRegistrationActions();
  setupStepTabs();
  setupSignupTracking();
  setupCommunityTracking();
  setupSectionNavigation();
  setupReferralCarousel();
  setupChallengeCarousel();

  applyLanguage(resolveLanguage());
  syncCampaignLinks();
  track('page_view', { page: window.location.pathname });
};

init();
