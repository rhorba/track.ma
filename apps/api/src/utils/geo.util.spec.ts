import { pointInPolygon, haversineKm } from './geo.util';

const square = [
  { lat: 10, lng: 10 },
  { lat: 10, lng: 20 },
  { lat: 20, lng: 20 },
  { lat: 20, lng: 10 },
];

describe('pointInPolygon', () => {
  it('returns true for a point clearly inside', () => {
    expect(pointInPolygon(15, 15, square)).toBe(true);
  });

  it('returns false for a point clearly outside', () => {
    expect(pointInPolygon(5, 5, square)).toBe(false);
  });

  it('returns false for a point outside on same lat', () => {
    expect(pointInPolygon(15, 25, square)).toBe(false);
  });

  it('returns true for a point near the center', () => {
    expect(pointInPolygon(10.5, 10.5, square)).toBe(true);
  });
});

describe('haversineKm', () => {
  it('returns 0 for identical points', () => {
    expect(
      haversineKm({ lat: 33.9, lng: -6.85 }, { lat: 33.9, lng: -6.85 }),
    ).toBe(0);
  });

  it('returns roughly 111 km per degree of latitude', () => {
    const d = haversineKm({ lat: 0, lng: 0 }, { lat: 1, lng: 0 });
    expect(d).toBeCloseTo(111.19, 0);
  });

  it('returns positive distance for any two distinct points', () => {
    const d = haversineKm(
      { lat: 31.79, lng: -7.09 },
      { lat: 33.98, lng: -6.85 },
    );
    expect(d).toBeGreaterThan(0);
  });
});
