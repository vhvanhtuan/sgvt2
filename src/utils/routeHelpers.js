export function slugify(input = '') {
  return String(input)
    .replace(/[Đđ]/g, 'd')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    || 'tour';
}

export function buildTourRoute(tour) {
  const name = slugify(tour?.name || 'tour');
  return `/tour/${name}-t-${tour?.tour_id}.html`;
}

export function buildGroupRoute(group) {
  const name = slugify(group?.name || 'nhom-tour');
  return `/nhom-tour/${name}-g-${group?.group_id}.html`;
}

export function buildZoneRoute(zone) {
  const name = slugify(zone?.zone_name || 'khu-vuc');
  return `/nhom-tour/${name}-z-${zone?.zone_id}.html`;
}
