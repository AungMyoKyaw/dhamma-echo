import type {
  AudioSearchPage,
  AudioSearchRequest,
  AudioTrack,
  CatalogueSummary,
  InvokeFn,
  TeacherSummary
} from "./types.js";

const teachers: TeacherSummary[] = [
  { id: 3, name: "Venerable Sayadaw U Jotika", audioCount: 120 },
  { id: 4, name: "Venerable Dr. K. Dhammasami", audioCount: 80 },
  { id: 12, name: "Mogok Sayadaw", audioCount: 960 },
  { id: 18, name: "Pa-Auk Tawya Sayadaw", audioCount: 744 },
  { id: 31, name: "Sitagu Sayadaw", audioCount: 512 },
  { id: 45, name: "Thich Nhat Hanh", audioCount: 64 }
];

const tracks: AudioTrack[] = [
  {
    id: 1,
    title: "Praise and Blame",
    format: "mp3",
    language: "english",
    url: "https://dhammadownload.com/MP3Library/UJotika/praise.mp3",
    dateRecorded: "2010-01-12",
    location: null,
    teacherId: 3,
    teacherName: "Venerable Sayadaw U Jotika",
    playable: true
  },
  {
    id: 2,
    title: "မေတ္တာပို့",
    format: "mp3",
    language: "myanmar",
    url: "https://dhammadownload.com/MP3Library/Myanmar/metta.mp3",
    dateRecorded: null,
    location: "Yangon",
    teacherId: 4,
    teacherName: "Venerable Dr. K. Dhammasami",
    playable: true
  },
  {
    id: 3,
    title: "Living with Awareness",
    format: "mp3",
    language: "english",
    url: "https://dhammadownload.com/MP3Library/UJotika/awareness.mp3",
    dateRecorded: null,
    location: null,
    teacherId: 3,
    teacherName: "Venerable Sayadaw U Jotika",
    playable: true
  },
  {
    id: 4,
    title: "ဝိပဿနာ အခြေခံတရား",
    format: "mp3",
    language: "myanmar",
    url: "https://dhammadownload.com/MP3Library/Mogok/basic-vipassana.mp3",
    dateRecorded: null,
    location: "Mandalay",
    teacherId: 12,
    teacherName: "Mogok Sayadaw",
    playable: true
  },
  {
    id: 5,
    title: "Mindfulness of Breathing",
    format: "mp3",
    language: "english",
    url: "https://dhammadownload.com/MP3Library/PaAuk/anapanasati.mp3",
    dateRecorded: null,
    location: null,
    teacherId: 18,
    teacherName: "Pa-Auk Tawya Sayadaw",
    playable: true
  },
  {
    id: 6,
    title: "သတိပဋ္ဌာန် တရားတော်",
    format: "wma",
    language: "myanmar",
    url: "http://dhammadownload.com/MP3Library/Legacy/satipatthana.wma",
    dateRecorded: null,
    location: null,
    teacherId: 31,
    teacherName: "Sitagu Sayadaw",
    playable: false
  }
];

const summary: CatalogueSummary = {
  totalAudio: 21402,
  totalTeachers: 212,
  myanmarAudio: 21074,
  englishAudio: 328
};

function readNumber(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

export function createMockInvoke(): InvokeFn {
  // eslint-disable-next-line @typescript-eslint/require-await -- mock invoke must be async to match InvokeFn
  return async <T>(command: string, args?: Record<string, unknown>): Promise<T> => {
    if (command === "get_catalogue_summary") return summary as T;
    if (command === "list_featured_teachers") {
      return teachers.slice(0, readNumber(args?.limit, 12)) as T;
    }
    if (command === "search_teachers") {
      const query = readString(args?.query, "").toLocaleLowerCase();
      const limit = readNumber(args?.limit, 100);
      return teachers
        .filter((teacher) => teacher.name.toLowerCase().includes(query))
        .slice(0, limit) as T;
    }
    if (command === "search_audio") {
      const request = (args?.request ?? {}) as Partial<AudioSearchRequest>;
      const query = readString(request.query, "").toLocaleLowerCase();
      const language = request.language ?? null;
      const format = request.format ?? null;
      const teacherId = request.teacherId ?? null;
      const limit = readNumber(request.limit, 50);
      const offset = readNumber(request.offset, 0);
      const filtered = tracks.filter(
        (track) =>
          (query.length === 0 ||
            track.title.toLowerCase().includes(query) ||
            track.teacherName.toLowerCase().includes(query)) &&
          (language === null || track.language === language) &&
          (format === null || track.format === format) &&
          (teacherId === null || track.teacherId === teacherId)
      );
      const page: AudioSearchPage = {
        items: filtered.slice(offset, offset + limit),
        total: filtered.length,
        limit,
        offset
      };
      return page as T;
    }
    throw new Error(`Unsupported command: ${command}`);
  };
}
