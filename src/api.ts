import type {
  AudioSearchPage,
  AudioSearchRequest,
  AudioTrack,
  CatalogueSummary,
  CollectionDetail,
  CollectionSearchPage,
  CollectionSearchRequest,
  ContentCategory,
  InvokeFn,
  TeacherDetail,
  TeacherSummary
} from "./types.js";

class CatalogueError extends Error {
  constructor(
    readonly code: string,
    message: string
  ) {
    super(message);
    this.name = "CatalogueError";
  }
}

function toError(error: unknown): CatalogueError {
  if (typeof error === "object" && error !== null) {
    const record = error as Record<string, unknown>;
    if (typeof record.code === "string" && typeof record.message === "string") {
      return new CatalogueError(record.code, record.message);
    }
  }
  return new CatalogueError("unknown", "Unable to load the Dhamma catalogue.");
}

export class CatalogueApi {
  constructor(private readonly invoke: InvokeFn) {}

  private async call<T>(command: string, args?: Record<string, unknown>): Promise<T> {
    try {
      return await this.invoke<T>(command, args);
    } catch (error) {
      throw toError(error);
    }
  }

  getSummary(): Promise<CatalogueSummary> {
    return this.call("get_catalogue_summary");
  }

  listFeaturedTeachers(limit = 12): Promise<TeacherSummary[]> {
    return this.call("list_featured_teachers", { limit });
  }

  listContentCategories(): Promise<ContentCategory[]> {
    return this.call("list_audio_categories");
  }

  searchCollections(request: CollectionSearchRequest): Promise<CollectionSearchPage> {
    return this.call("search_collections", { request });
  }

  getCollection(id: number): Promise<CollectionDetail> {
    return this.call("get_collection", { id });
  }

  getTeacher(id: number): Promise<TeacherDetail> {
    return this.call("get_teacher", { id });
  }

  getAudioTrack(id: number): Promise<AudioTrack> {
    return this.call("get_audio_track", { id });
  }

  searchTeachers(query: string, limit = 100): Promise<TeacherSummary[]> {
    return this.call("search_teachers", { query, limit });
  }

  searchAudio(request: AudioSearchRequest): Promise<AudioSearchPage> {
    return this.call("search_audio", { request });
  }

  downloadAudio(id: number, url: string): Promise<string> {
    return this.call("download_audio", { id, url });
  }
}
