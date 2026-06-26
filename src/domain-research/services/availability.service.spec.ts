import { classifyWhoisAvailability, parseWhoisReferral } from './availability.service';

describe('WHOIS availability fallback helpers', () => {
  it('extracts the registry WHOIS referral from IANA text', () => {
    expect(parseWhoisReferral('domain:       COM\nwhois:        whois.verisign-grs.com\n')).toBe('whois.verisign-grs.com');
  });

  it('treats common no-match WHOIS responses as available', () => {
    expect(classifyWhoisAvailability('No match for domain "EXAMPLE-OPEN-12345.COM".')).toBe('available');
    expect(classifyWhoisAvailability('Status: free')).toBe('available');
  });

  it('treats structured WHOIS domain records as registered', () => {
    expect(classifyWhoisAvailability('Domain Name: EXAMPLE.COM\nRegistrar: RESERVED-INTERNET ASSIGNED NUMBERS AUTHORITY')).toBe('registered');
    expect(classifyWhoisAvailability('nserver: ns1.example.cz')).toBe('registered');
  });

  it('keeps ambiguous WHOIS text unknown', () => {
    expect(classifyWhoisAvailability('Terms of use apply. Query limit exceeded.')).toBe('unknown');
  });
});
