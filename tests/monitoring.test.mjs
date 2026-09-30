import {test} from 'node:test';
import assert from 'node:assert/strict';
import {safePath,safeSearch,safeReferrer,isOwner,istDayStart} from '../app/monitoring/privacy.ts';
test('analytics removes private URL data and potentially sensitive searches',()=>{
 assert.equal(safePath('/profile?email=private@example.test'),'/profile');
 assert.equal(safePath('/travelers/private-person'),'/travelers');
 assert.equal(safePath('/experience/secret-id?token=secret'),'/experience');
 assert.equal(safePath('/india/goa/panaji?token=secret'),'/india/goa/panaji');
 assert.equal(safePath('https://bad.test/secret'),'/other');
 assert.equal(safeSearch(' Goa Scooter '),'goa scooter');
 assert.equal(safeSearch('me@example.test'),'[redacted]');
 assert.equal(safeSearch('call 9876543210'),'[redacted]');
 assert.equal(safeReferrer('https://www.google.com/search?q=private'),'www.google.com');
 assert.equal(safeReferrer('javascript:alert(1)'),'Direct / unknown');
 assert.equal(isOwner('other@example.test'),false);
 assert.equal(isOwner('PRINCEPATEL1551756@GMAIL.COM'),true);
 assert.equal(istDayStart(new Date('2026-09-30T20:00:00Z')).toISOString(),'2026-09-30T18:30:00.000Z');
});
