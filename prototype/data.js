// Illustrative fixtures only. No media URLs and no connection to the real catalogue.
(() => {
  const teachers = [
    {
      id: 1,
      name: "Ashin Nandamalabhivamsa",
      role: "Abhidhamma · Insight",
      image: "AshinNandamalabhivamsa.jpg"
    },
    {
      id: 2,
      name: "Dr. Ashin Chekinda",
      role: "Daily practice · Mindfulness",
      image: "DrAshinChekinda.jpg"
    },
    { id: 3, name: "Mogok Sayadaw", role: "Vipassana · Wisdom", image: "MogokSayadaw.jpg" }
  ];
  const collections = [
    {
      id: 1,
      title: "Foundations of Abhidhamma",
      teacherId: 1,
      detail: "A patient introduction to the mind and its qualities."
    },
    {
      id: 2,
      title: "Wisdom in daily life",
      teacherId: 2,
      detail: "Make room for attention in ordinary moments."
    },
    {
      id: 3,
      title: "The way of insight",
      teacherId: 3,
      detail: "An invitation to see experience more clearly."
    },
    {
      id: 4,
      title: "Understanding the mind",
      teacherId: 1,
      detail: "Return to the foundations, one talk at a time."
    },
    {
      id: 5,
      title: "A steady practice",
      teacherId: 2,
      detail: "Simple reminders for a regular practice."
    },
    {
      id: 6,
      title: "Seeing impermanence",
      teacherId: 3,
      detail: "Reflect on change with clarity and kindness."
    }
  ];
  const categories = ["Audio", "Video", "Dhamma", "Abhidhamma", "Meditation"];
  const seedTracks = [
    {
      title: "The foundations of a mindful life",
      teacherId: 1,
      collectionId: 1,
      language: "English",
      format: "MP3",
      category: "Dhamma",
      duration: "52:10"
    },
    {
      title: "နေ့စဉ်ဘဝထဲက သတိပဋ္ဌာန်",
      teacherId: 2,
      collectionId: 2,
      language: "Myanmar",
      format: "MP3",
      category: "Meditation",
      duration: "43:28"
    },
    {
      title: "Understanding the nature of the mind",
      teacherId: 1,
      collectionId: 4,
      language: "English",
      format: "MP3",
      category: "Abhidhamma",
      duration: "1:04:32"
    },
    {
      title: "ဝိပဿနာ ရှုမှတ်နည်း",
      teacherId: 3,
      collectionId: 3,
      language: "Myanmar",
      format: "MP3",
      category: "Meditation",
      duration: "58:06"
    },
    {
      title: "A gentle beginning to meditation",
      teacherId: 2,
      collectionId: 5,
      language: "English",
      format: "MP3",
      category: "Meditation",
      duration: "36:42"
    },
    {
      title: "အဘိဓမ္မာ အခြေခံတရား",
      teacherId: 1,
      collectionId: 1,
      language: "Myanmar",
      format: "WMA",
      category: "Abhidhamma",
      duration: "47:15"
    },
    {
      title: "Wisdom in everyday moments",
      teacherId: 2,
      collectionId: 2,
      language: "English",
      format: "MP4",
      category: "Dhamma",
      duration: "41:20"
    },
    {
      title: "The practice of seeing clearly",
      teacherId: 3,
      collectionId: 6,
      language: "English",
      format: "WMV",
      category: "Dhamma",
      duration: "55:18"
    }
  ];
  // Extra explicitly labeled samples let initial limits and Load more be exercised.
  const tracks = Array.from({ length: 72 }, (_, index) => {
    const source = seedTracks[index % seedTracks.length];
    return {
      ...source,
      id: index + 1,
      title:
        index < seedTracks.length
          ? source.title
          : `${source.title} · sample ${Math.floor(index / 8) + 1}`,
      teacher: teachers.find((teacher) => teacher.id === source.teacherId).name,
      mediaType: ["MP4", "WMV"].includes(source.format) ? "video" : "audio",
      playable: ["MP3", "MP4"].includes(source.format),
      ...(source.format === "MP4" ? { previewDuration: 24 } : {})
    };
  });
  globalThis.PROTOTYPE_DATA = { tracks, teachers, collections, categories };
})();
