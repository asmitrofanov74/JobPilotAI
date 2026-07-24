import { Injectable } from '@nestjs/common';

interface CompanySite {
  companyName: string;
  careerUrl: string;
  providerType: 'GREENHOUSE' | 'LEVER' | 'WORKDAY';
}

const KNOWN_SITES: CompanySite[] = [
  { companyName: 'Netflix', careerUrl: 'https://jobs.netflix.com', providerType: 'GREENHOUSE' },
  { companyName: 'OpenAI', careerUrl: 'https://openai.com/careers', providerType: 'GREENHOUSE' },
  { companyName: 'Airbnb', careerUrl: 'https://careers.airbnb.com', providerType: 'GREENHOUSE' },
  { companyName: 'Stripe', careerUrl: 'https://stripe.com/jobs', providerType: 'GREENHOUSE' },
  { companyName: 'Shopify', careerUrl: 'https://shopify.com/careers', providerType: 'LEVER' },
  { companyName: 'Amazon', careerUrl: 'https://amazon.jobs', providerType: 'WORKDAY' },
  { companyName: 'Microsoft', careerUrl: 'https://careers.microsoft.com', providerType: 'WORKDAY' },
  { companyName: 'Adobe', careerUrl: 'https://adobe.wd5.myworkdayjobs.com', providerType: 'WORKDAY' },
  { companyName: 'Cisco', careerUrl: 'https://cisco.wd1.myworkdayjobs.com', providerType: 'WORKDAY' },
  { companyName: 'Intel', careerUrl: 'https://intel.wd1.myworkdayjobs.com', providerType: 'WORKDAY' },
];

@Injectable()
export class AtsDiscoveryService {
  private sites: CompanySite[] = [...KNOWN_SITES];

  getAll(): CompanySite[] {
    return this.sites;
  }

  getByProvider(providerType: string): CompanySite[] {
    return this.sites.filter((s) => s.providerType === providerType.toUpperCase());
  }

  register(site: CompanySite) {
    const existing = this.sites.findIndex(
      (s) => s.companyName.toLowerCase() === site.companyName.toLowerCase(),
    );
    if (existing >= 0) {
      this.sites[existing] = site;
    } else {
      this.sites.push(site);
    }
  }

  getBoardNames(providerType: 'GREENHOUSE' | 'LEVER'): string[] {
    return this.getByProvider(providerType).map((s) => s.companyName.toLowerCase());
  }

  getTenants(providerType: 'WORKDAY'): { tenant: string; company: string }[] {
    return this.getByProvider(providerType).map((s) => {
      const match = s.careerUrl.match(/https:\/\/(\w+)\.wd\d\.myworkdayjobs\.com/);
      return { tenant: match?.[1] || s.companyName.toLowerCase(), company: s.companyName };
    });
  }
}
