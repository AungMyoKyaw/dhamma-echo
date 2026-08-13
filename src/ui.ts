import type { AppState, AudioTrack, CollectionSummary, Route, TeacherSummary } from "./types.js";

const CURATED_FEATURED_TEACHER_IDS = [16, 42, 40, 53, 61, 8] as const;
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

export function routeLabel(
  route: Route,
  totalAudio: number
): { eyebrow: string; title: string; detail: string } {
  const labels: Record<Route, { eyebrow: string; title: string; detail: string }> = {
    home: {
      eyebrow: "Home",
      title: "Discover the Dhamma",
      detail: "Return to recent talks and trusted teachers."
    },
    explore: {
      eyebrow: `${totalAudio.toLocaleString("en-US")} audio talks`,
      title: "Explore the Dhamma library",
      detail: "Search by teacher, language, format, or collection."
    },
    collections: {
      eyebrow: "Collections",
      title: "Browse listening collections",
      detail: "Move through related talks without losing your place."
    },
    "collection-detail": {
      eyebrow: "Collection",
      title: "Collection details",
      detail: "Listen through this collection at your own pace."
    },
    teachers: {
      eyebrow: "Teachers",
      title: "Learn from trusted voices",
      detail: "Browse teachers and continue into their available talks."
    },
    "teacher-detail": {
      eyebrow: "Teacher",
      title: "Teacher details",
      detail: "Explore talks and collections from this teacher."
    },
    library: {
      eyebrow: "Your space",
      title: "Continue listening",
      detail: "Resume, revisit favorites, and manage downloaded talks."
    },
    settings: {
      eyebrow: "Preferences",
      title: "Make listening yours",
      detail: "Adjust appearance and playback defaults for this device."
    }
  };
  return labels[route];
}

export function teacherFilterName(state: AppState): string {
  const fromList = state.teachers.data.find(
    (teacher) => teacher.id === state.search.teacherId
  )?.name;
  if (fromList !== undefined) return fromList;
  return state.player.current?.id === state.search.teacherId
    ? state.player.current.teacherName
    : "selected teacher";
}

interface CollectionGroup {
  key: string;
  name: string;
  items: CollectionSummary[];
}

export function groupCollectionsByTeacher(items: CollectionSummary[]): CollectionGroup[] {
  const groups: CollectionGroup[] = [];
  for (const item of items) {
    const key = item.teacherId === null ? "unknown" : String(item.teacherId);
    const latest = groups.at(-1);
    if (latest?.key === key) latest.items.push(item);
    else groups.push({ key, name: item.teacherName || "Unknown teacher", items: [item] });
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
