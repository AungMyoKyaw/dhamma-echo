import test from "node:test";
import assert from "node:assert/strict";
import { CatalogueApi, CatalogueError } from "../.test-build/src/api.js";

test("CatalogueApi maps command names and request arguments", async () => {
  const calls = [];
  const invoke = async (command, args) => {
    calls.push({ command, args });
    return command === "get_catalogue_summary"
      ? { totalAudio: 21402 }
      : { items: [], total: 0, limit: 50, offset: 0 };
  };
  const api = new CatalogueApi(invoke);
  assert.equal((await api.getSummary()).totalAudio, 21402);
  await api.searchAudio({
    query: "metta",
    language: null,
    format: "mp3",
    teacherId: null,
    limit: 50,
    offset: 0
  });
  assert.deepEqual(calls, [
    { command: "get_catalogue_summary", args: undefined },
    {
      command: "search_audio",
      args: {
        request: {
          query: "metta",
          language: null,
          format: "mp3",
          teacherId: null,
          limit: 50,
          offset: 0
        }
      }
    }
  ]);
});

test("CatalogueApi exposes stable errors", async () => {
  const api = new CatalogueApi(async () => {
    throw { code: "database_query", message: "Database unavailable" };
  });
  await assert.rejects(api.getSummary(), (error) => {
    assert.equal(error instanceof CatalogueError, true);
    assert.equal(error.code, "database_query");
    assert.equal(error.message, "Database unavailable");
    return true;
  });
  const fallback = new CatalogueApi(async () => {
    throw "bad";
  });
  await assert.rejects(fallback.getSummary(), /Unable to load the Dhamma catalogue/);
});

test("CatalogueApi exposes teacher commands and default limits", async () => {
  const calls = [];
  const api = new CatalogueApi(async (command, args) => {
    calls.push({ command, args });
    return [];
  });
  await api.listFeaturedTeachers();
  await api.listFeaturedTeachers(4);
  await api.searchTeachers("jotika");
  await api.searchTeachers("dhammasami", 8);
  assert.deepEqual(calls, [
    { command: "list_featured_teachers", args: { limit: 12 } },
    { command: "list_featured_teachers", args: { limit: 4 } },
    { command: "search_teachers", args: { query: "jotika", limit: 100 } },
    { command: "search_teachers", args: { query: "dhammasami", limit: 8 } }
  ]);
});

test("CatalogueApi fetches a single audio track by id", async () => {
  const calls = [];
  const track = {
    id: 7,
    title: "Dhamma Talk",
    format: "mp3",
    language: "english",
    url: "https://dhammadownload.com/MP3Library/talk.mp3",
    dateRecorded: null,
    location: null,
    teacherId: 3,
    teacherName: "Sayadaw",
    playable: true
  };
  const api = new CatalogueApi(async (command, args) => {
    calls.push({ command, args });
    return track;
  });
  assert.deepEqual(await api.getAudioTrack(7), track);
  assert.deepEqual(calls, [{ command: "get_audio_track", args: { id: 7 } }]);
});
