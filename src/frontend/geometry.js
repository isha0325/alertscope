function ringsOf(geometry) {
  if (geometry?.type === 'Polygon' && Array.isArray(geometry.coordinates)) return geometry.coordinates;
  if (geometry?.type === 'MultiPolygon' && Array.isArray(geometry.coordinates)) return geometry.coordinates.flat();
  if (geometry?.type === 'GeometryCollection' && Array.isArray(geometry.geometries)) return geometry.geometries.flatMap(ringsOf);
  return [];
}

// A small schematic, not a basemap or a navigation tool. Preserve interior rings.
export function projectShapes(shapes, width = 360, height = 180) {
  const data = shapes.map(shape => ({ ...shape, rings: ringsOf(shape.geometry).map(ring => Array.isArray(ring) ? ring.filter(point => Array.isArray(point) && point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]) && Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90).slice(0, 20000) : []).filter(ring => ring.length >= 3) })).filter(shape => shape.rings.length);
  if (!data.length) return [];
  const reference = data[0].rings[0][0][0];
  const unwrap = lon => {
    while (lon - reference > 180) lon -= 360;
    while (lon - reference < -180) lon += 360;
    return lon;
  };
  const points = data.flatMap(shape => shape.rings.flat());
  const lons = points.map(point => unwrap(point[0])), lats = points.map(point => point[1]);
  // Reduce iteratively so large official polygons don't exceed JS argument limits.
  const minX = lons.reduce((a, b) => Math.min(a, b), Infinity), maxX = lons.reduce((a, b) => Math.max(a, b), -Infinity);
  const minY = lats.reduce((a, b) => Math.min(a, b), Infinity), maxY = lats.reduce((a, b) => Math.max(a, b), -Infinity);
  const cos = Math.max(.15, Math.cos(((minY + maxY) / 2) * Math.PI / 180));
  const spanX = Math.max((maxX - minX) * cos, .001), spanY = Math.max(maxY - minY, .001);
  const scale = Math.min((width - 32) / spanX, (height - 32) / spanY);
  const offsetX = (width - spanX * scale) / 2, offsetY = (height - spanY * scale) / 2;
  return data.map(shape => ({
    ...shape,
    path: shape.rings.map(ring => ring.map(([lon, lat], index) => `${index ? 'L' : 'M'}${(offsetX + (unwrap(lon) - minX) * cos * scale).toFixed(2)},${(height - offsetY - (lat - minY) * scale).toFixed(2)}`).join(' ') + 'Z').join(' '),
  }));
}
