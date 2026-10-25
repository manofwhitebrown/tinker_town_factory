import { TUTORIAL_STEPS } from '../data/tutorial.js';

export const tutorialActive = (s) => s.settings.tutorialStep < TUTORIAL_STEPS.length;
export const currentStep = (s) => TUTORIAL_STEPS[s.settings.tutorialStep] || null;

/** Skip past every step the player has already satisfied. Returns true if it moved. */
export function advanceTutorial(s) {
  let moved = false;
  for (;;) {
    const step = currentStep(s);
    if (!step || step.manual || !step.done || !step.done(s)) break;
    s.settings.tutorialStep += 1;
    moved = true;
  }
  return moved;
}

/** The "Got it" button, or opening the tab a step asked for. */
export function nextStep(s) {
  if (tutorialActive(s)) s.settings.tutorialStep += 1;
  advanceTutorial(s);
}

export function visitTab(s, tab) {
  const step = currentStep(s);
  if (step && step.visitTab === tab) nextStep(s);
}

export function skipTutorial(s) {
  s.settings.tutorialStep = TUTORIAL_STEPS.length;
}

export function replayTutorial(s) {
  s.settings.tutorialStep = 0;
  advanceTutorial(s);
}
