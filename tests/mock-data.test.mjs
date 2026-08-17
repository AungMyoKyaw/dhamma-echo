import test from "node:test";
import assert from "node:assert/strict";
import { createMockInvoke } from "../.test-build/src/mock-data.js";

test("mock invoke supports summary, teachers, and filtered paginated audio", async () => {
  const invoke = createMockInvoke();
  const summary = await invoke("get_catalogue_summary");
  assert.equal(summary.totalAudio, 30563);
  const teachers = await invoke("list_featured_teachers", { limit: 1 });
  assert.equal(teachers.length, 1);
  const featured = await invoke("list_featured_teachers", { limit: 6 });
  assert.deepEqual(
    featured.map(({ id }) => id),
    [283, 2872, 2960, 41979, 2972, 273]
  );
  const searchedTeachers = await invoke("search_teachers", { query: "jotika", limit: 10 });
  assert.equal(searchedTeachers.length, 1);
  const page = await invoke("search_audio", {
    request: {
      query: "praise",
      language: "english",
      format: "mp3",
      teacherId: 3,
      limit: 1,
      offset: 0
    }
  });
  assert.equal(page.items.length, 1);
  assert.equal(page.total, 1);
});

test("mock invoke resolves a single track by id and rejects unknown ids", async () => {
  const invoke = createMockInvoke();
  const track = await invoke("get_audio_track", { id: 1 });
  assert.equal(track.title, "Praise and Blame");
  await assert.rejects(invoke("get_audio_track", { id: 999 }), /Unsupported command/);
});

test("mock invoke rejects unknown commands", async () => {
  const invoke = createMockInvoke();
  await assert.rejects(invoke("delete_everything"), /Unsupported command/);
});

test("mock invoke applies defaults and every optional filter branch", async () => {
  const invoke = createMockInvoke();
  const defaultTeachers = await invoke("list_featured_teachers", { limit: "bad" });
  assert.equal(defaultTeachers.length, 12);
  const allTeachers = await invoke("search_teachers");
  assert.equal(allTeachers.length, 12);
  const all = await invoke("search_audio");
  assert.equal(all.items.length, 8);
  const byTeacherName = await invoke("search_audio", {
    request: {
      query: "jotika",
      language: null,
      format: null,
      teacherId: null,
      limit: 50,
      offset: 0
    }
  });
  assert.equal(byTeacherName.items.length, 2);
  const noLanguageMatch = await invoke("search_audio", {
    request: {
      query: "",
      language: "english",
      format: "wma",
      teacherId: null,
      limit: 50,
      offset: 0
    }
  });
  assert.equal(noLanguageMatch.total, 0);
  const noFormatMatch = await invoke("search_audio", {
    request: { query: "", language: null, format: "wma", teacherId: 3, limit: 50, offset: 0 }
  });
  assert.equal(noFormatMatch.total, 0);
  const noTeacherMatch = await invoke("search_audio", {
    request: { query: "", language: null, format: null, teacherId: 999, limit: 50, offset: 0 }
  });
  assert.equal(noTeacherMatch.total, 0);
});

test("mock invoke supports categories, collections, and detail records", async () => {
  const invoke = createMockInvoke();
  const categories = await invoke("list_audio_categories");
  assert.equal(categories.length > 0, true);
  const videoCategories = categories.filter((item) => item.name.startsWith("Video"));
  assert.deepEqual(
    videoCategories.map((item) => item.name),
    ["Video in English", "Video in Myanmar"]
  );
  const page = await invoke("search_collections", {
    request: { query: "disc", teacherId: null, limit: 24, offset: 0 }
  });
  assert.equal(page.items.length, 2);
  const collection = await invoke("get_collection", { id: 10 });
  assert.equal(
    collection.tracks.some((track) => track.playable),
    true
  );
  const teacher = await invoke("get_teacher", { id: 3 });
  assert.equal(teacher.id, 3);
  const teacherPage = await invoke("search_collections", {
    request: { query: "", teacherId: 3, limit: 1, offset: 0 }
  });
  assert.equal(teacherPage.items.length, 1);
  const defaultPage = await invoke("search_collections");
  assert.equal(defaultPage.items.length, 2);
  const byCategory = await invoke("search_audio", {
    request: {
      query: "",
      language: null,
      format: null,
      teacherId: null,
      categoryId: 7,
      collectionId: 10,
      limit: 50,
      offset: 0
    }
  });
  assert.equal(byCategory.items.length, 2);
  const videoPage = await invoke("search_audio", {
    request: {
      query: "",
      language: null,
      format: null,
      teacherId: null,
      categoryId: 8,
      collectionId: null,
      limit: 50,
      offset: 0
    }
  });
  assert.equal(
    videoPage.items.every((track) => track.mediaType === "video"),
    true
  );
  await assert.rejects(invoke("get_collection", { id: 999 }), /Unsupported command/);
  await assert.rejects(invoke("get_teacher", { id: 999 }), /Unsupported command/);
});
