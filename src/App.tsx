import React, { useState } from 'react';
import { Project, PipelineStage, ProjectVersion, AspectRatio } from './types/cinegen';
import { COFFEE_PROJECT } from './data/defaultProjects';
import { AiGeneratorService } from './services/aiGeneratorService';
import { Header } from './components/Header';
import { StageProgressBar } from './components/StageProgressBar';
import { PromptStage } from './components/PromptStage';
import { ScriptStage } from './components/ScriptStage';
import { StoryboardStage } from './components/StoryboardStage';
import { GenerationStage } from './components/GenerationStage';
import { VoicePickerStage } from './components/VoicePickerStage';
import { EditPassStage } from './components/EditPassStage';
import { PublishStage } from './components/PublishStage';
import { CinegenCopilot } from './components/CinegenCopilot';
import { VersionHistoryModal } from './components/VersionHistoryModal';
import { audioEngine } from './services/audioEngine';

export function App() {
  const [project, setProject] = useState<Project>(COFFEE_PROJECT);
  const [currentStage, setCurrentStage] = useState<PipelineStage>('script');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState<boolean>(false);
  const [isVersionModalOpen, setIsVersionModalOpen] = useState<boolean>(false);

  // Handle new prompt submission
  const handleGenerateFromPrompt = async (
    prompt: string,
    options: { duration: number; aspectRatio: AspectRatio; autonomous: boolean }
  ) => {
    setIsLoading(true);
    audioEngine.playSFX('whoosh');

    try {
      const generatedProject = await AiGeneratorService.generateProjectFromPrompt(prompt, (progress) => {
        // Can track progress if needed
      });

      generatedProject.aspectRatio = options.aspectRatio;
      generatedProject.targetDurationSec = options.duration;

      setProject(generatedProject);
      setIsLoading(false);
      audioEngine.playSFX('chime');

      if (options.autonomous) {
        // Jump directly to generation / voice stage for autonomous delivery
        setCurrentStage('generating');
        setTimeout(() => {
          setCurrentStage('voice');
        }, 3200);
      } else {
        setCurrentStage('script');
      }
    } catch (err) {
      console.error('Generation failed:', err);
      setIsLoading(false);
    }
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
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
      {/* Studio Header */}
      <Header
        project={project}
        currentStage={currentStage}
        onSelectStage={setCurrentStage}
        onNewProject={() => setCurrentStage('prompt')}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        isCopilotOpen={isCopilotOpen}
        onOpenVersionHistory={() => setIsVersionModalOpen(true)}
      />

      {/* 6-Stage Progress Bar Tracker */}
      <StageProgressBar
        currentStage={currentStage}
        onSelectStage={setCurrentStage}
        renderProgress={project.renderProgress}
      />

      {/* Main Content Area based on Stage */}
      <main className="flex-1 pb-16">
        {currentStage === 'prompt' && (
          <PromptStage
            onGenerate={handleGenerateFromPrompt}
            isLoading={isLoading}
          />
        )}

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
              setCurrentStage('generating');
              audioEngine.playSFX('whoosh');
            }}
          />
        )}

        {currentStage === 'generating' && (
          <GenerationStage
            project={project}
            onProceed={() => {
              setCurrentStage('voice');
              audioEngine.playSFX('whoosh');
            }}
            onUpdateProject={handleUpdateProject}
          />
        )}

        {currentStage === 'voice' && (
          <VoicePickerStage
            project={project}
            onUpdateProject={handleUpdateProject}
            onProceed={() => {
              setCurrentStage('edit');
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

        {currentStage === 'publish' && (
          <PublishStage
            project={project}
            onUpdateProject={handleUpdateProject}
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
