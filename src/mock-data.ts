import type {
  AudioSearchPage,
  AudioSearchRequest,
  AudioTrack,
  CatalogueSummary,
  CollectionSearchPage,
  CollectionSearchRequest,
  CollectionSummary,
  ContentCategory,
  InvokeFn,
  TeacherSummary
} from "./types.js";

const teachers: TeacherSummary[] = [
  { id: 283, name: "မိုးကုတ်ဆရာတော်ဘုရားကြီး", audioCount: 942 },
  { id: 2872, name: "သဲအင်းဂူဆရာတော်ဘုရားကြီး ဦးဥက္ကဋ္ဌ", audioCount: 96 },
  { id: 2960, name: "ဖားအောက်တောရဆရာတော်ကြီး ဘဒ္ဒန္တအာစိဏ္ဏ", audioCount: 1321 },
  {
    id: 41979,
    name: "မဟာဗောဓိမြိုင် ဆရာတော် ဝနဝါသီ အရှင်ဉေယျဓမ္မသာမိမထေရ်",
    audioCount: 229
  },
  { id: 2972, name: "ဆရာတော်ဦးဇောတိက (မဟာမြိုင်တောရ)", audioCount: 73 },
  {
    id: 273,
    name: "ပါမောက္ခချုပ်ဆရာတော်ကြီး ဘဒ္ဒန္တ ဒေါက်တာ နန္ဒမာလာဘိဝံသ",
    audioCount: 3389
  },
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
    playable: true,
    mediaType: "audio"
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
    playable: true,
    mediaType: "audio"
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
    playable: true,
    mediaType: "audio"
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
    playable: true,
    mediaType: "audio"
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
    playable: true,
    mediaType: "audio"
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
    playable: false,
    mediaType: "audio"
  },
  {
    id: 7,
    title: "Guided walkthrough",
    format: "mp4",
    language: "myanmar",
    url: "https://www.dhammadownload.com/VideoLibrary/Myanmar/walkthrough.mp4",
    dateRecorded: "2024-04-10",
    location: null,
    teacherId: 4,
    teacherName: "Venerable Dr. K. Dhammasami",
    playable: true,
    mediaType: "video"
  },
  {
    id: 99,
    title: "Untitled talk",
    format: "mp3",
    language: "myanmar",
    url: "https://dhammadownload.com/MP3Library/unknown.mp3",
    dateRecorded: null,
    location: null,
    teacherId: null,
    teacherName: "Unknown teacher",
    playable: true,
    mediaType: "audio"
  }
];

const categories: ContentCategory[] = [
  { id: 1, name: "Audio in Myanmar", language: "myanmar", count: 29938 },
  { id: 4, name: "Abhidhamma in Myanmar", language: "myanmar", count: 956 },
  { id: 5, name: "Abhidhamma in English", language: "english", count: 219 },
  { id: 6, name: "Video in English", language: "english", count: 233 },
  { id: 7, name: "Audio in English", language: "english", count: 327 },
  { id: 8, name: "Video in Myanmar", language: "myanmar", count: 13107 }
];

const collections: CollectionSummary[] = [
  {
    id: 10,
    name: "Dhamma Disc",
    teacherId: 3,
    teacherName: "Venerable Sayadaw U Jotika",
    audioCount: 2
  },
  {
    id: 11,
    name: "Dhamma Disc",
    teacherId: 4,
    teacherName: "Venerable Dr. K. Dhammasami",
    audioCount: 1
  }
];

const categoryByTrack = new Map<number, number>([
  [1, 7],
  [2, 1],
  [3, 7],
  [4, 1],
  [5, 7],
  [6, 1],
  [7, 8],
  [99, 4]
]);
const categoryTypeById = new Map<number, "audio" | "video" | "abhidhamma">([
  [1, "audio"],
  [4, "abhidhamma"],
  [5, "abhidhamma"],
  [6, "video"],
  [7, "audio"],
  [8, "video"]
]);
const collectionByTrack = new Map<number, number>([
  [1, 10],
  [3, 10],
  [2, 11]
]);

const summary: CatalogueSummary = {
  totalAudio: 30563,
  totalTeachers: 257,
  myanmarAudio: 30098,
  englishAudio: 465
};

function matchesCategory(track: AudioTrack, categoryId: number): boolean {
  const categoryType = categoryTypeById.get(categoryId);
  if (categoryByTrack.get(track.id) !== categoryId || categoryType === undefined) return false;
  return categoryType === "abhidhamma" || categoryType === track.mediaType;
}

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
    if (command === "list_audio_categories") return categories as T;
    if (command === "search_collections") {
      const request = (args?.request ?? {}) as Partial<CollectionSearchRequest>;
      const query = readString(request.query, "").toLowerCase();
      const teacherId = request.teacherId ?? null;
      const limit = readNumber(request.limit, 24);
      const offset = readNumber(request.offset, 0);
      const filtered = collections.filter(
        (collection) =>
          collection.name.toLowerCase().includes(query) &&
          (teacherId === null || collection.teacherId === teacherId)
      );
      const page: CollectionSearchPage = {
        items: filtered.slice(offset, offset + limit),
        total: filtered.length,
        limit,
        offset
      };
      return page as T;
    }
    if (command === "get_collection") {
      const id = readNumber(args?.id, 0);
      const collection = collections.find((item) => item.id === id);
      if (collection !== undefined) {
        return {
          ...collection,
          description: null,
          tracks: tracks.filter((track) => collectionByTrack.get(track.id) === id)
        } as T;
      }
    }
    if (command === "get_teacher") {
      const id = readNumber(args?.id, 0);
      const teacher = teachers.find((item) => item.id === id);
      if (teacher !== undefined) {
        return {
          ...teacher,
          nameMyanmar: null,
          title: null,
          description: null,
          collections: collections.filter((collection) => collection.teacherId === id)
        } as T;
      }
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
      const categoryId = request.categoryId ?? null;
      const collectionId = request.collectionId ?? null;
      const limit = readNumber(request.limit, 50);
      const offset = readNumber(request.offset, 0);
      const filtered = tracks.filter(
        (track) =>
          (query.length === 0 ||
            track.title.toLowerCase().includes(query) ||
            track.teacherName.toLowerCase().includes(query)) &&
          (language === null || track.language === language) &&
          (format === null || track.format === format) &&
          (teacherId === null || track.teacherId === teacherId) &&
          (categoryId === null || matchesCategory(track, categoryId)) &&
          (collectionId === null || collectionByTrack.get(track.id) === collectionId)
      );
      const page: AudioSearchPage = {
        items: filtered.slice(offset, offset + limit),
        total: filtered.length,
        limit,
        offset
      };
      return page as T;
    }
    if (command === "get_audio_track") {
      const id = readNumber(args?.id, 0);
      const track = tracks.find((item) => item.id === id);
      if (track !== undefined) return track as T;
    }
    throw new Error(`Unsupported command: ${command}`);
  };
}
