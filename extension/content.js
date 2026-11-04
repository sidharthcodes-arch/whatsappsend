(() => {
  let isStopped = false;

  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'STOP_SCRAPING') {
      isStopped = true;
    }
  });

  async function runScraper() {
    const cards = document.querySelectorAll('a.hfpxzc');
    if (!cards || cards.length === 0) {
      chrome.runtime.sendMessage({
        type: 'SCRAPER_ERROR',
        message: 'No Google Maps listings found! Search for places (e.g. "cafes in indiranagar") and scroll down first.'
      });
      return;
    }

    for (let i = 0; i < cards.length; i++) {
      if (isStopped) break;

      cards[i].click();
      await new Promise((r) => setTimeout(r, 1800));

      const titleEl = document.querySelector('h1.DUwDvf');
      let rawName = titleEl ? titleEl.textContent : (cards[i].getAttribute('aria-label') || 'Business');

      const name = rawName
        .replace(/[\s·•|–-]*\bvisited\s+link\b[\s·•|–-]*/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const phoneBtn = document.querySelector('button[data-item-id^="phone:tel:"]');
      const phone = phoneBtn ? phoneBtn.getAttribute('data-item-id').replace('phone:tel:', '') : '';

      chrome.runtime.sendMessage({
        type: 'SCRAPER_PROGRESS',
        current: i + 1,
        total: cards.length,
        lead: phone ? { name, phone } : null
      });
    }

    chrome.runtime.sendMessage({ type: 'SCRAPER_FINISHED' });
  }

  runScraper();
})();

