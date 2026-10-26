import test from 'node:test';
import assert from 'node:assert/strict';
import { dateMs, formatTime, countdown } from '../time.js';
import { projectShapes } from '../geometry.js';
import config from '../../../hyperdart.config.js';

test('countdown handles unknown, elapsed and upcoming end times', () => {
  assert.equal(countdown(null,0),'No end time published');
  assert.equal(countdown(0,1),'End time passed');
  assert.equal(countdown(3*3600000+12*60000,0),'3h 12m left');
  assert.equal(dateMs('bad-time'),null);
});
test('timezone conversion uses the place timezone rather than a fixed offset', () => {
  const timestamp = Date.parse('2026-07-01T18:00:00Z');
  assert.match(formatTime(timestamp,'America/Chicago'), /1:00 PM CDT/);
  assert.match(formatTime(timestamp,'America/Phoenix'), /11:00 AM MST/);
  assert.doesNotThrow(()=>formatTime(timestamp,'Not/AZone'));
});
test('null and malformed geometries have an empty map fallback', () => {
  assert.deepEqual(projectShapes([{geometry:null}]),[]);
  assert.deepEqual(projectShapes([{geometry:{type:'Polygon',coordinates:[null]}}]),[]);
});
test('polygons, holes and multipolygons become finite SVG paths', () => {
  const ring = [[-95,29],[-94,29],[-94,30],[-95,29]];
  const paths = projectShapes([{id:'a',geometry:{type:'Polygon',coordinates:[ring,ring]}},{id:'b',geometry:{type:'MultiPolygon',coordinates:[[ring]]}}]);
  assert.equal(paths.length,2); assert.equal((paths[0].path.match(/M/g)||[]).length,2);
  assert.doesNotMatch(paths[0].path,/NaN|Infinity/);
});
test('dateline-crossing shapes remain projectable', () => {
  const paths=projectShapes([{id:'ak',geometry:{type:'Polygon',coordinates:[[[179,50],[-179,50],[-179,51],[179,50]]]}}]);
  assert.doesNotMatch(paths[0].path,/NaN|Infinity/);
});
test('every regex is compilable and all six challenge queries trigger', () => {
  const patterns=config.query_format.regex.map(value=>new RegExp(value,'i'));
  for (const query of ['weather alerts in HD_LOCATION__CITIES','flood warnings in HD_LOCATION__STATES','severe weather alerts in HD_LOCATION__STATES','is there a heat advisory in HD_LOCATION__CITIES','weather alerts near me','weather alerts in HD_LOCATION__CITIES']) {
    assert.ok(patterns.some(pattern=>pattern.test(query)),query);
  }
  for (const query of ['storm warning near me','weather alerts today in HD_LOCATION__CITIES','wildfire alerts in HD_LOCATION__STATES']) assert.ok(patterns.some(pattern=>pattern.test(query)),query);
});
