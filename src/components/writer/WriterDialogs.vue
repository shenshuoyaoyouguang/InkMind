<template>
  <div>
    <!-- 章节编辑对话框 -->
    <ChapterEditDialog
      v-model="chapterListState.showChapterDialog"
      :form="chapterListState.chapterForm"
      :is-editing="!!chapterListState.editingChapter"
      :is-generating-outline="aiState.isGeneratingOutline"
      @save="handlers.onSaveChapter"
      @generate-outline="handlers.onGenerateChapterOutline"
      @close="chapterListState.showChapterDialog = false"
    />

    <!-- 角色编辑对话框 -->
    <CharacterEditDialog
      v-model="characterState.showCharacterDialog"
      :form="characterState.characterForm"
      :is-editing="!!characterState.editingCharacter"
      @save="handlers.onSaveCharacter"
      @close="characterState.showCharacterDialog = false"
    />

    <!-- 世界观编辑对话框 -->
    <WorldEditDialog
      v-model="worldState.showWorldDialog"
      :form="worldState.worldForm"
      :is-editing="!!worldState.editingWorldSetting"
      :is-generating="worldState.worldGenerating"
      @save="handlers.onSaveWorld"
      @generate="handlers.onGenerateWorldDescription"
      @close="worldState.showWorldDialog = false"
    />

    <!-- 语料编辑对话框 -->
    <CorpusEditDialog
      v-model="corpusState.showCorpusDialog"
      :form="corpusState.corpusForm"
      :is-editing="!!corpusState.editingCorpus"
      @save="handlers.onSaveCorpus"
      @close="corpusState.showCorpusDialog = false"
    />

    <!-- 事件编辑对话框 -->
    <EventEditDialog
      v-model="eventState.showEventDialog"
      :form="eventState.eventForm"
      :is-editing="!!eventState.editingEvent"
      @save="handlers.onSaveEvent"
      @close="eventState.showEventDialog = false"
    />

    <!-- 章节内容生成对话框 -->
    <ChapterGenerateDialog
      v-model="aiState.showChapterGenerateDialog"
      :chapter="chapterListState.currentChapter"
      :characters="characterState.characters"
      :world-settings="worldState.worldSettings"
      :corpus="corpusState.corpusData"
      :events="eventState.events"
      :is-generating="aiState.isGeneratingContent"
      :is-streaming="aiState.isStreaming"
      :streaming-content="aiState.streamingContent"
      @generate="handlers.onChapterGenerate"
      @stop="aiState.stopStreaming"
      @close="aiState.showChapterGenerateDialog = false"
    />

    <!-- 续写对话框 -->
    <ContinueWritingDialog
      v-model="handlers.showContinueDialog"
      :current-content="chapterListState.currentChapter?.content || ''"
      :is-streaming="handlers.isContinueStreaming"
      :streaming-content="handlers.continueStreamingContent"
      @continue="handlers.onContinueWriting"
      @stop="handlers.onStopContinue"
      @close="handlers.closeContinueDialog"
    />

    <!-- 内容优化对话框 -->
    <OptimizeDialog
      v-model="handlers.showOptimizeDialog"
      :original-content="chapterListState.currentChapter?.content || ''"
      :is-streaming="handlers.isOptimizeStreaming"
      :streaming-content="handlers.optimizeStreamingContent"
      :optimized-content="handlers.optimizedContent"
      @optimize="handlers.onOptimizeContent"
      @stop="handlers.onStopOptimize"
      @apply="handlers.onApplyOptimized"
      @close="handlers.closeOptimizeDialog"
    />

    <!-- 批量生成角色对话框 -->
    <BatchCharacterDialog
      v-model="characterState.showBatchGenerateCharacterDialog"
      :is-generating="characterState.batchGenerating"
      :streaming-content="characterState.streamingContent"
      :generated-characters="characterState.generatedCharacters"
      :selected-prompt-title="handlers.batchCharacterPromptTitle"
      @generate="handlers.onBatchGenerateCharacters"
      @regenerate="handlers.onBatchGenerateCharacters"
      @confirm="handlers.onConfirmAddCharacters"
      @stop="characterState.stopBatchGeneration"
      @select-prompt="handlers.onSelectBatchCharacterPrompt"
      @clear-prompt="handlers.onClearBatchCharacterPrompt"
      @close="characterState.showBatchGenerateCharacterDialog = false"
    />

    <!-- 批量生成世界观对话框 -->
    <WorldGenerateDialog
      v-model="worldState.showWorldGenerateDialog"
      :is-generating="worldState.worldGenerating"
      :streaming-content="worldState.streamingContent"
      :generated-world-settings="worldState.generatedWorldSettings"
      :selected-prompt-title="handlers.worldPromptTitle"
      @generate="handlers.onGenerateWorldSettings"
      @regenerate="handlers.onGenerateWorldSettings"
      @confirm="handlers.onConfirmAddWorldSettings"
      @stop="worldState.stopWorldGeneration"
      @select-prompt="handlers.onSelectWorldPrompt"
      @clear-prompt="handlers.onClearWorldPrompt"
      @close="worldState.showWorldGenerateDialog = false"
    />

    <!-- 提示词选择对话框 -->
    <PromptSelectorDialog
      v-model="aiState.showPromptDialog"
      :prompts="aiState.availablePrompts"
      :category="aiState.selectedPromptCategory"
      @select="handlers.onPromptSelect"
      @close="aiState.showPromptDialog = false"
    />
  </div>
</template>

<script setup>
import ChapterEditDialog from "@/components/writer/dialogs/ChapterEditDialog.vue";
import CharacterEditDialog from "@/components/writer/dialogs/CharacterEditDialog.vue";
import WorldEditDialog from "@/components/writer/dialogs/WorldEditDialog.vue";
import CorpusEditDialog from "@/components/writer/dialogs/CorpusEditDialog.vue";
import EventEditDialog from "@/components/writer/dialogs/EventEditDialog.vue";
import ChapterGenerateDialog from "@/components/writer/dialogs/ChapterGenerateDialog.vue";
import ContinueWritingDialog from "@/components/writer/dialogs/ContinueWritingDialog.vue";
import OptimizeDialog from "@/components/writer/dialogs/OptimizeDialog.vue";
import BatchCharacterDialog from "@/components/writer/dialogs/BatchCharacterDialog.vue";
import WorldGenerateDialog from "@/components/writer/dialogs/WorldGenerateDialog.vue";
import PromptSelectorDialog from "@/components/writer/dialogs/PromptSelectorDialog.vue";

const props = defineProps({
  chapterListState: { type: Object, default: null },
  characterState: { type: Object, default: null },
  worldState: { type: Object, default: null },
  corpusState: { type: Object, default: null },
  eventState: { type: Object, default: null },
  editorState: { type: Object, default: null },
  aiState: { type: Object, default: null },
  handlers: { type: Object, default: null },
});
</script>
