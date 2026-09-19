"use client";

import ScrollProgress from "./components/ScrollProgress";
import NexusIntro from "./components/NexusIntro";
import NexusTransition from "./components/NexusTransition";
import NexusOverview from "./components/NexusOverview";
import NexusScrollStory from "./components/NexusScrollStory";
import NexusControlPreview from "./components/NexusControlPreview";
import NexusArchitecture from "./components/NexusArchitecture";
import About from "./components/About";
import SectionDivider from "./components/SectionDivider";

export default function Portfolio() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200">
      <ScrollProgress />

      <NexusIntro />

      <NexusTransition />

      <NexusOverview />

      <SectionDivider />

      <NexusScrollStory />

      <SectionDivider />

      <NexusControlPreview />

      <SectionDivider />

      <NexusArchitecture />

      <SectionDivider />

      <About />

      <SectionDivider />
    </main>
  );
}