
const { chromium } = require('playwright');
const fs = require('fs');
(async () => {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-CA,en;q=0.9' });
  try {
    await page.goto("https://www.linkedin.com/jobs/search?keywords=react&location=Montreal", { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(3000);
    const jobs = await page.evaluate((src) => {
      const sel = '[data-testid="job-card"],.job_seen_beacon,.job-card,.jobCard,.result,.job_result,.job-card-container,.job-search-card,.base-card,.result-card,.jobListing,.react-job-listing,.jobContainer,[data-test*="job"],.job_card,.job-result,.job_result_item,article[data-job],[data-ved],.vNEEBe';
      return Array.from(document.querySelectorAll(sel)).slice(0,20).map(c => {
        const t = c.querySelector('h2 a,.jobTitle a,[data-testid*="title"] a,.job-title,.job-card-title,.base-search-card__title,h3 a,.jobTitle,a[data-test*="title"],.jobLink,.title a,h2 a,.job_title a,h3,[role="heading"]')?.textContent?.trim();
        const co = c.querySelector('[data-testid*="company"],.companyName,.company,[data-testid="company-name"],.company-name,.job-card-company,.base-search-card__subtitle,.employerName,[data-test*="company"],.company_name,.name,[data-company],.Q7PwXb')?.textContent?.trim();
        const l = c.querySelector('[data-testid*="location"],.location,.companyLocation,[data-testid="text-location"],.job-location,.job-card-location,.job-search-card__location,.loc,[data-location],.QkFJVe')?.textContent?.trim();
        const s = c.querySelector('[data-testid*="salary"],.salary,.salaryText,[data-testid="attribute-text"],.salary-estimate,[data-test*="salary"],.pay,.salary_text,.compensation,.SaJ7Qe')?.textContent?.trim();
        const d = c.querySelector('[data-testid*="snippet"],.job-snippet,.description,.summary,.job_description,p')?.textContent?.trim();
        const link = c.querySelector('a[href*="/jobs/view"],a[href*="/job-listing"],a[href*="/job/"],a[href*="/rc/"]');
        const href = link?.getAttribute('href') || '';
        if (!t || !co) return null;
        const ju = href.startsWith('http') ? href : 'https://www.'+src.toLowerCase()+'.com'+href;
        return { companyName: co, jobTitle: t, jobDescription: d||'', jobUrl: ju, location: l||'', salaryRange: s||null, source: src, sourceUrl: ju, sourceId: src.toLowerCase()+'-'+Date.now()+'-'+Math.random().toString(36).slice(2,8), employmentType: null, workMode: null, postedDate: null };
      }).filter(Boolean);
    }, "LINKEDIN");
    fs.writeFileSync("C:\\Users\\Administrator\\JobPilotAI\\apps\\tmp\\LINKEDIN_1783811222759.json", JSON.stringify({jobs}));
  } catch(e) {
    fs.writeFileSync("C:\\Users\\Administrator\\JobPilotAI\\apps\\tmp\\LINKEDIN_1783811222759.json", JSON.stringify({jobs:[], error: e.message}));
  }
  await browser.close();
})();
