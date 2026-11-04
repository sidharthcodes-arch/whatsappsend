/**
 * Google Maps Leads Scraper (Console Script)
 * 
 * HOW TO USE:
 * 1. Open Google Maps (https://maps.google.com) in Chrome / Edge / Brave.
 * 2. Search for your target niche (e.g., "cafes in indiranagar", "restaurants in mumbai").
 * 3. Scroll down the left results list until all places you want are loaded.
 * 4. Press F12 (or Right-Click -> Inspect) and go to the "Console" tab.
 * 5. Paste the entire code below and hit Enter.
 * 6. Keep the tab open while it automatically clicks each card and collects phone numbers.
 * 7. It will automatically download a clean "cafe_leads.csv" ready for the outreach dashboard!
 */

(async () => {
  const cards = document.querySelectorAll('a.hfpxzc');
  const results = [['Title', 'Phone']];
  console.log(`🚀 Found ${cards.length} places. Extracting phone numbers...`);

  for (let i = 0; i < cards.length; i++) {
    cards[i].click();
    // Wait for the details side panel to load
    await new Promise((r) => setTimeout(r, 1800));

    // Try reading clean title from the main details header first, fallback to aria-label
    const titleEl = document.querySelector('h1.DUwDvf');
    let rawName = titleEl ? titleEl.textContent : (cards[i].getAttribute('aria-label') || 'Business');

    // Clean out "Visited link" text and trailing separators
    const name = rawName
      .replace(/[\s·•|–-]*\bvisited\s+link\b[\s·•|–-]*/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Find the phone number button in the details panel
    const phoneBtn = document.querySelector('button[data-item-id^="phone:tel:"]');
    const phone = phoneBtn ? phoneBtn.getAttribute('data-item-id').replace('phone:tel:', '') : '';

    if (phone) {
      console.log(`[${i + 1}/${cards.length}] ✓ ${name}: ${phone}`);
      results.push([`"${name.replace(/"/g, '""')}"`, `"${phone}"`]);
    } else {
      console.log(`[${i + 1}/${cards.length}] ⚠ ${name}: (No phone listed)`);
    }
  }

  if (results.length <= 1) {
    console.warn('❌ No phone numbers found. Make sure the search results were fully loaded.');
    return;
  }

  // Generate and download the CSV
  const csvContent = 'data:text/csv;charset=utf-8,' + results.map((e) => e.join(',')).join('\n');
  const link = document.createElement('a');
  link.setAttribute('href', encodeURI(csvContent));
  link.setAttribute('download', 'cafe_leads.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  console.log(`🎉 Done! Extracted ${results.length - 1} leads with phone numbers. Download started.`);
})();

