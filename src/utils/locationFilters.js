export const getLocationsForEntity = (entityId, entityList) => {
  if (!entityId) return [];
  const entity = entityList.find(e => String(e.id) === String(entityId));
  if (!entity) return [];
  
  const locs = new Set();
  if (entity.default_location_id) locs.add(String(entity.default_location_id));
  if (entity.calendar_location_ids && Array.isArray(entity.calendar_location_ids)) {
    entity.calendar_location_ids.forEach(loc => locs.add(String(loc)));
  }
  return Array.from(locs);
};

export const getFilterLocationsFor = (excludeEntity, currentSelections, lists) => {
  const locSets = [];
  
  if (excludeEntity !== 'student' && currentSelections.student_id) {
    locSets.push(getLocationsForEntity(currentSelections.student_id, lists.students));
  }
  if (excludeEntity !== 'instructor' && currentSelections.instructor_id) {
    locSets.push(getLocationsForEntity(currentSelections.instructor_id, lists.instructors));
  }
  if (excludeEntity !== 'aircraft' && currentSelections.aircraft_id) {
    locSets.push(getLocationsForEntity(currentSelections.aircraft_id, lists.aircraft));
  }
  
  if (locSets.length === 0) return null; // no filter
  
  let intersected = locSets[0];
  for (let i = 1; i < locSets.length; i++) {
    intersected = intersected.filter(loc => locSets[i].includes(loc));
  }
  return intersected;
};

export const checkLocationMatch = (entity, targetLocs) => {
  if (!targetLocs || targetLocs.length === 0) return true;
  const locs = new Set();
  if (entity.default_location_id) locs.add(String(entity.default_location_id));
  if (entity.calendar_location_ids && Array.isArray(entity.calendar_location_ids)) {
    entity.calendar_location_ids.forEach(loc => locs.add(String(loc)));
  }
  
  for (let loc of targetLocs) {
    if (locs.has(loc)) return true;
  }
  return false;
};
