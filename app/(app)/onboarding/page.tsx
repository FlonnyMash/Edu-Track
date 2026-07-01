import { GoalSetupForm } from "@/components/onboarding/GoalSetupForm";

export default function OnboardingPage() {
  return (
    <div>
      <h1 className="mb-2 text-2xl font-bold">Welcome to Edu Track</h1>
      <p className="mb-6 text-sm text-white/60">
        Tell us your goal and learning material so the AI can plan daily tasks
        around what you actually use.
      </p>
      <GoalSetupForm />
    </div>
  );
}
