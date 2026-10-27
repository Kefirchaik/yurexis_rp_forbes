import {test} from 'node:test';
import assert from 'node:assert/strict';
import {makeQuery} from '../lib/query.js';
import {readFileSync} from 'node:fs';
test('bank modes prevent unwanted bank sources',()=>{assert.match(makeQuery({BANK_MODE:'accounts'}),/0 AS deposits/);assert.match(makeQuery({BANK_MODE:'separate'}),/0 AS bank/);assert.throws(()=>makeQuery({BANK_MODE:'bad'}));});
test('business and admins can be excluded',()=>{assert.match(makeQuery({INCLUDE_BUSINESS_BALANCES:'false',EXCLUDE_ADMINS:'true'}),/0 AS business/);assert.match(makeQuery({EXCLUDE_ADMINS:'true'}),/AND a.admin=0/);});
test('snapshot has only public fields and correct totals and ordering',()=>{const {players}=JSON.parse(readFileSync(new URL('../public/snapshot.json',import.meta.url)));assert.equal(players.length,0);const allowed=['id','name','level','cash','bank','deposits','business','houses','houseValue','cars','businesses','total'];players.forEach((p,i)=>{assert.deepEqual(Object.keys(p).sort(),allowed.slice().sort());assert.equal(p.total,p.cash+p.bank+p.deposits+p.business);if(i)assert.ok(players[i-1].total>=p.total);});});
