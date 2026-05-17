/**
 * WriterView主视图Composable - 管理路由导航、小说数据加载/保存
 */
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { useNovelStore } from "@/stores/novel.js";

export const useWriterView = (options = {}) => {
  const {
    chapterListState,
    characterState,
    worldState,
    corpusState,
    eventState,
  } = options;

  const router = useRouter();
  const novelStore = useNovelStore();
  const currentNovel = ref(null);

  // 加载小说数据
  const loadNovel = async (novelId) => {
    try {
      const savedData = localStorage.getItem(`novel_${novelId}`);
      if (savedData) {
        const data = JSON.parse(savedData);
        currentNovel.value = data.novel || data;
        chapterListState.initChapters(data.chapters || []);
        characterState.initCharacters(data.characters || []);
        corpusState.initCorpusData(data.corpus || []);
        eventState.initEvents(data.events || []);
        if (data.novelId) novelStore.setCurrentNovel(data.novelId);
        ElMessage.success("小说数据加载成功");
      } else {
        const novel = await novelStore.loadNovel(novelId);
        currentNovel.value = novel;
        chapterListState.initChapters(novel.chapters || []);
        characterState.initCharacters(novelStore.characters || []);
        corpusState.initCorpusData(novelStore.corpus || []);
        eventState.initEvents(novelStore.events || []);
      }
    } catch (error) {
      console.error("加载小说失败:", error);
      ElMessage.error("加载小说失败");
    }
  };

  const loadNovelData = async (route) => {
    const novelId = route.params.novelId;
    if (!novelId) {
      const savedId = novelStore.currentNovel?.id;
      if (savedId) {
        await loadNovel(savedId);
      } else {
        ElMessage.error("未找到小说ID");
        router.push("/novels");
      }
      return;
    }
    await loadNovel(novelId);
  };

  // 保存小说数据 - 增加可选链防护，避免 state 结构不完整时报错
  const saveNovelData = () => {
    const novelId = currentNovel.value?.id;
    if (!novelId) return;
    if (!chapterListState?.chapters) return; // 防护：确保 chapters 存在
    const data = {
      novel: currentNovel.value,
      novelId,
      chapters: chapterListState.chapters || [],
      characters: characterState?.characters || [],
      worldSettings: worldState?.worldSettings || [],
      corpus: corpusState?.corpusData || [],
      events: eventState?.events || [],
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(`novel_${novelId}`, JSON.stringify(data));
    novelStore.saveNovel(novelId, data);
  };

  // 返回导航
  const goBack = (hasUnsavedChanges) => {
    if (hasUnsavedChanges) {
      import("element-plus").then(({ ElMessageBox }) => {
        ElMessageBox.confirm("有未保存的更改，确定要离开吗？", "提示", {
          confirmButtonText: "离开",
          cancelButtonText: "取消",
          type: "warning",
        })
          .then(() => router.push("/novels"))
          .catch(() => {});
      });
    } else {
      router.push("/novels");
    }
  };

  return {
    currentNovel,
    loadNovelData,
    loadNovel,
    saveNovelData,
    goBack,
  };
};
