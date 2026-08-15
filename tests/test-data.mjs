export const teachers = [
  { id: 26, name: "Nandamalabhivamsa", audioCount: 3116 },
  { id: 3, name: "Venerable Sayadaw U Jotika", audioCount: 120 },
  { id: 4, name: "Venerable Dr. K. Dhammasami", audioCount: 80 }
];

export const tracks = [
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
  }
];

export const categories = [
  { id: 1, name: "Audio in Myanmar", language: "myanmar", audioCount: 30098 },
  { id: 7, name: "Audio in English", language: "english", audioCount: 465 }
];

export const collections = [
  { id: 10, name: "Dhamma Disc", teacherId: 3, teacherName: teachers[1].name, audioCount: 2 },
  { id: 11, name: "Dhamma Disc", teacherId: 4, teacherName: teachers[2].name, audioCount: 1 }
];

export const incompleteTrack = {
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
};

export const videoTrack = {
  id: 7,
  title: "Guided walkthrough",
  format: "mp4",
  language: "english",
  url: "https://www.dhammadownload.com/walkthrough.mp4",
  dateRecorded: "2024-04-10",
  location: null,
  teacherId: 3,
  teacherName: "Venerable Sayadaw U Jotika",
  playable: true,
  mediaType: "video"
};
