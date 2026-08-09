import React, { useState, useEffect } from 'react';
import { Project, PipelineStage, ProjectVersion, AspectRatio, VideoVariation } from './types/cinegen';
import { COFFEE_PROJECT } from './data/defaultProjects';
import { AiGeneratorService } from './services/aiGeneratorService';
import { Header } from './components/Header';
import { StageProgressBar } from './components/StageProgressBar';
import { PromptStage } from './components/PromptStage';
import { VideoVarietyStage } from './components/VideoVarietyStage';
import { VoicePickerStage } from './components/VoicePickerStage';
import { PublishStage } from './components/PublishStage';
import { ScriptStage } from './components/ScriptStage';
import { StoryboardStage } from './components/StoryboardStage';
import { EditPassStage } from './components/EditPassStage';
import { CinegenCopilot } from './components/CinegenCopilot';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { audioEngine } from './services/audioEngine';

export function App() {
  const [project, setProject] = useState<Project>(COFFEE_PROJECT);
  const [currentStage, setCurrentStage] = useState<PipelineStage>('prompt');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [variations, setVariations] = useState<VideoVariation[]>([]);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState<boolean>(false);

  // Initialize initial candidate variations for default project
  useEffect(() => {
    AiGeneratorService.generateVideoVariations(
      COFFEE_PROJECT.prompt,
      { duration: 360, aspectRatio: '16:9', is3D: true },
      () => {}
    ).then((res) => {
      setVariations(res.variations);
      setProject((prev) => ({
        ...prev,
        variations: res.variations,
        selectedVariationId: res.variations[0]?.id,
      }));
    });
  }, []);

  // Handle new prompt submission -> Generates Variety of Candidate Videos
  const handleGenerateFromPrompt = async (
    prompt: string,
    options: { duration: number; aspectRatio: AspectRatio; autonomous: boolean; is3D?: boolean }
  ) => {
    setIsLoading(true);
    audioEngine.playSFX('whoosh');

    try {
      const result = await AiGeneratorService.generateVideoVariations(
        prompt,
        {
          duration: options.duration,
          aspectRatio: options.aspectRatio,
          is3D: options.is3D,
        },
        (_progress) => {}
      );

      setVariations(result.variations);
      setProject(result.selectedProject);
      setIsLoading(false);
      audioEngine.playSFX('chime');

      // Direct transition to Video Variety Stage for user choice
      setCurrentStage('variety');
    } catch (err) {
      console.error('Generation failed:', err);
      setIsLoading(false);
    }
  };

  // Handle selection of best video variation
  const handleSelectVariation = (variation: VideoVariation) => {
    setProject({
      ...variation.project,
      selectedVariationId: variation.id,
      variations: variations,
      selectedVoiceId: project.selectedVoiceId || variation.recommendedVoiceId,
      updatedAt: new Date().toISOString(),
    });
  };

  // Update project state helper
  const handleUpdateProject = (updated: Partial<Project>) => {
    setProject((prev) => ({
      ...prev,
      ...updated,
      updatedAt: new Date().toISOString(),
    }));
  };

  // Restore snapshot version
  const handleRestoreVersion = (version: ProjectVersion) => {
    setProject((prev) => ({
      ...prev,
      segments: version.segments.length > 0 ? version.segments : prev.segments,
      selectedVoiceId: version.selectedVoiceId,
      musicStyle: version.musicStyle,
      captionStyle: version.captionStyle,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 relative">
      {/* Studio Header */}
      <Header
        project={project}
        currentStage={currentStage}
        onSelectStage={setCurrentStage}
        onNewProject={() => {
          setCurrentStage('prompt');
          audioEngine.playSFX('click');
        }}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        isCopilotOpen={isCopilotOpen}
        onOpenVersionHistory={() => setIsVersionModalOpen(true)}
      />

      {/* 4-Step Primary Progress Bar Tracker */}
      <StageProgressBar
        currentStage={currentStage}
        onSelectStage={setCurrentStage}
        renderProgress={project.renderProgress}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {/* Step 1: Prompt Stage */}
        {currentStage === 'prompt' && (
          <PromptStage
            onGenerate={handleGenerateFromPrompt}
            isLoading={isLoading}
          />
        )}

        {/* Step 2: Video Variety Stage (User chooses best candidate video) */}
        {(currentStage === 'variety' || currentStage === 'generating') && (
          <VideoVarietyStage
            project={project}
            variations={variations}
            onSelectVariation={handleSelectVariation}
            onProceedToVoice={() => {
              setCurrentStage('voice');
              audioEngine.playSFX('whoosh');
            }}
            onBackToPrompt={() => {
              setCurrentStage('prompt');
              audioEngine.playSFX('click');
            }}
            onUpdateProject={handleUpdateProject}
          />
        )}

        {/* Step 3: Voice Selection Stage */}
        {currentStage === 'voice' && (
          <VoicePickerStage
            project={project}
            onUpdateProject={handleUpdateProject}
            onProceed={() => {
              setCurrentStage('publish');
              audioEngine.playSFX('whoosh');
            }}
            onBackToVariety={() => {
              setCurrentStage('variety');
              audioEngine.playSFX('click');
            }}
          />
        )}

        {/* Step 4: Final Master Download & Publish Stage */}
        {currentStage === 'publish' && (
          <PublishStage
            project={project}
            onUpdateProject={handleUpdateProject}
            onBackToVoice={() => {
              setCurrentStage('voice');
              audioEngine.playSFX('click');
            }}
          />
        )}

        {/* Advanced Studio Tools (Accessible from progress bar or header) */}
        {currentStage === 'script' && (
          <ScriptStage
            project={project}
            onUpdateProject={handleUpdateProject}
            onProceed={() => {
              setCurrentStage('storyboard');
              audioEngine.playSFX('whoosh');
            }}
            autoProceed={false}
          />
        )}

        {currentStage === 'storyboard' && (
          <StoryboardStage
            project={project}
            onUpdateProject={handleUpdateProject}
            onProceed={() => {
              setCurrentStage('variety');
              audioEngine.playSFX('whoosh');
            }}
          />
        )}

        {currentStage === 'edit' && (
          <EditPassStage
            project={project}
            onUpdateProject={handleUpdateProject}
            onProceed={() => {
              setCurrentStage('publish');
              audioEngine.playSFX('whoosh');
            }}
            onOpenVersionHistory={() => setIsVersionModalOpen(true)}
          />
        )}
      </main>

      {/* Floating Cinegen AI Copilot Drawer */}
      <CinegenCopilot
        project={project}
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onUpdateProject={handleUpdateProject}
      />

      {/* Version History Modal */}
      <VersionHistoryModal
        project={project}
        isOpen={isVersionModalOpen}
        onClose={() => setIsVersionModalOpen(false)}
        onRestoreVersion={handleRestoreVersion}
      />
    </div>
  );
}

export default App;
