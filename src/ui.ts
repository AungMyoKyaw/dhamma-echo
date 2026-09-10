import { routeLabels, t } from "./i18n.js";
import type {
  AppLocale,
  AppState,
  AudioTrack,
  CollectionSummary,
  Route,
  TeacherSummary
} from "./types.js";

const CURATED_FEATURED_TEACHER_IDS = [16, 42, 40, 53, 61, 8, 55, 1307] as const;
const FEATURED = new Set<number>(CURATED_FEATURED_TEACHER_IDS);

export function isCuratedFeaturedTeacher(id: number): boolean {
  return FEATURED.has(id);
}

export function featuredTeachers(teachers: TeacherSummary[]): TeacherSummary[] {
  const byId = new Map(teachers.map((teacher) => [teacher.id, teacher]));
  return CURATED_FEATURED_TEACHER_IDS.flatMap((id) => {
    const teacher = byId.get(id);
    return teacher === undefined ? [] : [teacher];
  });
}

export function orderTeachersFeaturedFirst(teachers: TeacherSummary[]): TeacherSummary[] {
  const featured = featuredTeachers(teachers);
  return [...featured, ...teachers.filter((teacher) => !FEATURED.has(teacher.id))];
}

export function isMyanmarText(value: string): boolean {
  return /[\u1000-\u109F]/u.test(value);
}

export function truncateTeacherCardName(value: string): string {
  const clusters: string[] = [];
  for (const character of value) {
    const previous = clusters.at(-1);
    if (previous !== undefined && (/\p{Mark}/u.test(character) || previous.endsWith("္"))) {
      clusters[clusters.length - 1] += character;
    } else {
      clusters.push(character);
    }
  }
  if (clusters.length <= 36) return value;
  return `${clusters.slice(0, 24).join("")}…${clusters.slice(-11).join("")}`;
}

function clusterGraphemes(value: string): string[] {
  const clusters: string[] = [];
  for (const character of value) {
    const previous = clusters.at(-1);
    if (previous !== undefined && (/\p{Mark}/u.test(character) || previous.endsWith("္"))) {
      clusters[clusters.length - 1] += character;
    } else {
      clusters.push(character);
    }
  }
  return clusters;
}

export function truncateTrackTitle(value: string, maxClusters = 60): string {
  const clusters = clusterGraphemes(value);
  if (clusters.length <= maxClusters) return value;
  // Trim trailing whitespace before appending the ellipsis so we don't render "  …".
  const head = clusters.slice(0, maxClusters);
  while (head.length > 0 && /\s/u.test(head.at(-1) as string)) head.pop();
  return `${head.join("")}…`;
}

export function routeLabel(
  route: Route,
  locale: AppLocale = "en-US"
): { eyebrow: string; title: string; detail: string } {
  return routeLabels(route, locale);
}

export function teacherFilterName(state: AppState): string {
  const fromList = state.teachers.data.find(
    (teacher) => teacher.id === state.search.teacherId
  )?.name;
  if (fromList !== undefined) return fromList;
  return state.player.current?.id === state.search.teacherId
    ? state.player.current.teacherName
    : t(state.settings.locale, "search.filters.selectedTeacher");
}

interface CollectionGroup {
  key: string;
  name: string;
  items: CollectionSummary[];
}

export function groupCollectionsByTeacher(
  items: CollectionSummary[],
  locale: AppLocale = "en-US"
): CollectionGroup[] {
  const groups: CollectionGroup[] = [];
  for (const item of items) {
    const key = item.teacherId === null ? "unknown" : String(item.teacherId);
    const latest = groups.at(-1);
    if (latest?.key === key) latest.items.push(item);
    else
      groups.push({
        key,
        name: item.teacherName || t(locale, "collections.unknownTeacher"),
        items: [item]
      });
  }
  return groups;
}

export function knownFavoriteTracks(state: AppState): AudioTrack[] {
  const known = [state.player.current, ...state.player.queue].filter(
    (track): track is AudioTrack => track !== null
  );
  return known.filter(
    (track, index, list) =>
      state.library.favorites.includes(track.id) &&
      list.findIndex((candidate) => candidate.id === track.id) === index
  );
}

export function favoriteTracks(state: AppState): AudioTrack[] {
  const loaded = [...state.favoriteTracks, ...knownFavoriteTracks(state)];
  return loaded.filter(
    (track, index, list) =>
      state.library.favorites.includes(track.id) &&
      list.findIndex((candidate) => candidate.id === track.id) === index
  );
}

export function downloadedTracks(state: AppState): AudioTrack[] {
  const known = [
    ...state.downloadedTracks,
    ...state.favoriteTracks,
    state.player.current,
    ...state.player.queue,
    ...state.catalogue.page.items,
    ...state.homeRecent.tracks
  ].filter((track): track is AudioTrack => track !== null);
  return known.filter(
    (track, index, list) =>
      state.library.downloads?.[String(track.id)] !== undefined &&
      list.findIndex((candidate) => candidate.id === track.id) === index
  );
}
