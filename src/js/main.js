(() => {
  const campaignLinks = {
    register: 'https://www.weex.com/register?vipCode=REPLACE_ME',
    community: 'https://t.me/REPLACE_ME'
  };

  const translations = {
    en: {
      navCta:'Trade on WEEX', eyebrow:'CryptoBaltic × WEEX', heroTitle:'Trade smarter. Unlock your WEEX rewards.', heroText:'Join the CryptoBaltic community, register through our exclusive link, and get access to campaign rewards built for active traders.', heroCta:'Get my rewards', howLink:'How it works →', trustOne:'Exclusive referral link', trustTwo:'Fast registration', trustThree:'Community support', liveBadge:'CAMPAIGN LIVE', heroCardTitle:'Your next trade starts here.', heroCardCaption:'in rewards for eligible new users', seeDetails:'See campaign details →', rewardsEyebrow:'Exclusive for CryptoBaltic', rewardsTitle:'More ways to get rewarded', rewardsText:'Choose an offer, complete the qualifying action, and let WEEX credit eligible rewards to your account.', rewardOneTitle:'Welcome rewards', rewardOneText:'Register with the CryptoBaltic link and unlock the new-user campaign.', rewardTwoTitle:'Trading rewards', rewardTwoText:'Trade qualifying volume and participate in the active WEEX events.', rewardThreeTitle:'Community access', rewardThreeText:'Connect with CryptoBaltic traders for updates, signals, and support.', learnMore:'Learn more →', joinCommunity:'Join community →', stepsEyebrow:'Simple participation', stepsTitle:'Start in three steps', stepOneTitle:'Register', stepOneText:'Use the CryptoBaltic referral link to create your WEEX account.', stepTwoTitle:'Deposit and trade', stepTwoText:'Complete the qualifying action shown in the campaign terms.', stepThreeTitle:'Receive rewards', stepThreeText:'Track your progress and receive eligible rewards in your account.', communityEyebrow:'CryptoBaltic community', communityTitle:'Trade with a community behind you.', communityText:'Follow market conversations, campaign updates, and practical trading education from CryptoBaltic.', communityCta:'Join CryptoBaltic', footerText:'Crypto trading involves risk. Review the campaign terms before participating.', footerRewards:'Rewards', footerHow:'How it works', footerCommunity:'Community'
    },
    ru: {
      navCta:'Торговать на WEEX', eyebrow:'CryptoBaltic × WEEX', heroTitle:'Торгуйте умнее. Получайте награды WEEX.', heroText:'Присоединяйтесь к сообществу CryptoBaltic, зарегистрируйтесь по эксклюзивной ссылке и получите доступ к наградам для активных трейдеров.', heroCta:'Получить награды', howLink:'Как это работает →', trustOne:'Эксклюзивная ссылка', trustTwo:'Быстрая регистрация', trustThree:'Поддержка сообщества', liveBadge:'КАМПАНИЯ АКТИВНА', heroCardTitle:'Ваш следующий трейд начинается здесь.', heroCardCaption:'в наградах для новых пользователей', seeDetails:'Подробнее о кампании →', rewardsEyebrow:'Только для CryptoBaltic', rewardsTitle:'Больше способов получить награды', rewardsText:'Выберите предложение, выполните условия и получите подходящие награды на счёт WEEX.', rewardOneTitle:'Приветственные награды', rewardOneText:'Зарегистрируйтесь по ссылке CryptoBaltic и участвуйте в кампании для новых пользователей.', rewardTwoTitle:'Награды за торговлю', rewardTwoText:'Выполните торговый объём и участвуйте в активных событиях WEEX.', rewardThreeTitle:'Доступ к сообществу', rewardThreeText:'Общайтесь с трейдерами CryptoBaltic, следите за сигналами и обновлениями.', learnMore:'Подробнее →', joinCommunity:'В сообщество →', stepsEyebrow:'Участие без сложностей', stepsTitle:'Начните за три шага', stepOneTitle:'Зарегистрируйтесь', stepOneText:'Создайте аккаунт WEEX по реферальной ссылке CryptoBaltic.', stepTwoTitle:'Пополните счёт и торгуйте', stepTwoText:'Выполните условие, указанное в правилах кампании.', stepThreeTitle:'Получите награды', stepThreeText:'Следите за прогрессом и получайте подходящие награды на свой счёт.', communityEyebrow:'Сообщество CryptoBaltic', communityTitle:'Торгуйте вместе с сильным сообществом.', communityText:'Следите за рынком, обновлениями кампании и практическими материалами CryptoBaltic.', communityCta:'В CryptoBaltic', footerText:'Торговля криптовалютами связана с риском. Ознакомьтесь с условиями кампании перед участием.', footerRewards:'Награды', footerHow:'Как это работает', footerCommunity:'Сообщество'
    }
  };

  const track = (event, payload = {}) => {
    const detail = { event, ...payload, language: document.documentElement.lang, timestamp: new Date().toISOString() };
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(detail);
    if (typeof window.gtag === 'function') window.gtag('event', event, payload);
    if (window.WEEX_ANALYTICS && typeof window.WEEX_ANALYTICS.track === 'function') window.WEEX_ANALYTICS.track(event, detail);
  };

  const setLanguage = (language, initial = false) => {
    const dictionary = translations[language] || translations.en;
    document.documentElement.lang = language;
    document.querySelectorAll('[data-i18n]').forEach((node) => { if (dictionary[node.dataset.i18n]) node.textContent = dictionary[node.dataset.i18n]; });
    document.querySelectorAll('[data-lang]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.lang === language)));
    localStorage.setItem('cryptobaltic-language', language);
    if (!initial) track('language_changed', { to_language: language });
  };

  document.querySelectorAll('[data-lang]').forEach((button) => button.addEventListener('click', () => setLanguage(button.dataset.lang)));
  document.querySelectorAll('[data-cta]').forEach((link) => link.addEventListener('click', () => { track('cta_clicked', { cta: link.dataset.cta }); link.href = campaignLinks.register; }));
  document.querySelectorAll('[data-reward]').forEach((link) => link.addEventListener('click', () => track('reward_clicked', { reward: link.dataset.reward })));
  document.querySelectorAll('[data-community]').forEach((link) => link.addEventListener('click', () => { track('community_clicked'); link.href = campaignLinks.community; }));
  document.querySelectorAll('a[data-track]').forEach((link) => link.addEventListener('click', () => track('outbound_link_clicked', { link: link.dataset.track })));
  setLanguage(new URLSearchParams(location.search).get('lang') || localStorage.getItem('cryptobaltic-language') || 'en', true);
  track('page_view', { page: location.pathname });
})();
