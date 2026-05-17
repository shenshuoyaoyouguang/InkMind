<template>
  <div class="writer-container">
    <WriterTitleBar
      :novel-title="viewState.currentNovel?.title"
      @go-back="() => viewState.goBack(editorState.hasUnsavedChanges.value)"
    />

    <WriterTabsBar v-model:active-tab="activeTab" />

    <div class="main-content">
      <div class="left-panel">
        <WriterChapterPanel
          v-show="activeTab === 'editor'"
          :chapters="chapterListState.chapters"
          :current-chapter="chapterListState.currentChapter"
          @select-chapter="handlers.onSelectChapter"
          @chapter-action="handlers.onChapterAction"
          @add-chapter="chapterListState.addNewChapter"
          @chapter-command="handlers.onChapterCommand"
        />

        <WriterCharacterPanel
          v-show="activeTab === 'characters'"
          :characters="characterState.characters"
          @add-character="characterState.addCharacter"
          @batch-generate="
            characterState.showBatchGenerateCharacterDialog.value = true
          "
          @edit-character="characterState.editCharacter"
          @character-action="handlers.onCharacterAction"
        />

        <WriterWorldviewPanel
          v-show="activeTab === 'worldview'"
          :world-settings="worldState.worldSettings"
          @add-worldview="worldState.addWorldSetting"
          @generate-worldview="worldState.showWorldGenerateDialog.value = true"
          @edit-worldview="worldState.editWorldSetting"
          @worldview-action="handlers.onWorldAction"
        />

        <WriterCorpusPanel
          v-show="activeTab === 'corpus'"
          :corpus-data="corpusState.corpusData"
          @add-corpus="corpusState.addCorpus"
          @edit-corpus="corpusState.editCorpus"
          @delete-corpus="corpusState.deleteCorpus"
        />

        <WriterEventPanel
          v-show="activeTab === 'events'"
          :events="eventState.events"
          @add-event="eventState.addEvent"
          @event-action="handlers.onEventAction"
        />
      </div>

      <WriterEditor
        v-show="activeTab === 'editor'"
        v-model:content="editorState.content"
        :current-chapter="chapterListState.currentChapter"
        :is-saving="editorState.isSaving"
        :toolbar-config="editorState.toolbarConfig"
        :editor-config="editorState.editorConfig"
        @update-status="handlers.onUpdateChapterStatus"
        @generate-from-outline="handlers.onGenerateFromOutline"
        @open-continue-dialog="handlers.openContinueDialog"
        @enhance-content="handlers.onEnhanceContent"
        @add-new-chapter="chapterListState.addNewChapter"
        @editor-created="handlers.onEditorCreated"
        @content-change="handlers.onEditorContentChange"
      />
    </div>

    <WriterDialogs
      :chapter-list-state="chapterListState"
      :character-state="characterState"
      :world-state="worldState"
      :corpus-state="corpusState"
      :event-state="eventState"
      :editor-state="editorState"
      :ai-state="aiState"
      :handlers="handlers"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from "vue";
import { useRoute } from "vue-router";

import WriterTitleBar from "@/components/writer/WriterTitleBar.vue";
import WriterTabsBar from "@/components/writer/WriterTabsBar.vue";
import WriterChapterPanel from "@/components/writer/WriterChapterPanel.vue";
import WriterCharacterPanel from "@/components/writer/WriterCharacterPanel.vue";
import WriterWorldviewPanel from "@/components/writer/WriterWorldviewPanel.vue";
import WriterCorpusPanel from "@/components/writer/WriterCorpusPanel.vue";
import WriterEventPanel from "@/components/writer/WriterEventPanel.vue";
import WriterEditor from "@/components/writer/WriterEditor.vue";
import WriterDialogs from "@/components/writer/WriterDialogs.vue";

import { useChapterList } from "@/composables/writer/useChapterList.js";
import { useCharacterPanel } from "@/composables/writer/useCharacterPanel.js";
import { useWorldPanel } from "@/composables/writer/useWorldPanel.js";
import { useCorpusPanel } from "@/composables/writer/useCorpusPanel.js";
import { useEventPanel } from "@/composables/writer/useEventPanel.js";
import { useEditor } from "@/composables/writer/useEditor.js";
import { useAIGeneration } from "@/composables/writer/useAIGeneration.js";
import { useWriterView } from "@/composables/writer/useWriterView.js";
import { useWriterHandlers } from "@/composables/writer/useWriterHandlers.js";

const route = useRoute();

const chapterListState = useChapterList();
const characterState = useCharacterPanel();
const worldState = useWorldPanel();
const corpusState = useCorpusPanel();
const eventState = useEventPanel();
const editorState = useEditor();
const aiState = useAIGeneration();

const viewState = useWriterView({
  chapterListState,
  characterState,
  worldState,
  corpusState,
  eventState,
});

const handlers = useWriterHandlers({
  chapterListState,
  characterState,
  worldState,
  corpusState,
  eventState,
  editorState,
  aiState,
  viewState,
});

const activeTab = ref("editor");

onMounted(() => {
  viewState.loadNovelData(route);
  watch(
    () => route.params.novelId,
    (newId) => {
      if (newId) viewState.loadNovelData(route);
    },
    { immediate: true },
  );
});

onBeforeUnmount(() => {
  editorState.destroyEditor();
});
</script>

<style scoped>
.writer-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f5f5;
}

.main-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.left-panel {
  width: 350px;
  min-width: 280px;
  background: white;
  border-right: 1px solid #e4e7ed;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
