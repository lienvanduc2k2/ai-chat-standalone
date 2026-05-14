import AIChatApp from '@/components/AIChatApp'
import { OnboardingProvider } from '@/context/OnboardingContext'

export default function Page() {
  return (
    <OnboardingProvider>
      <AIChatApp />
    </OnboardingProvider>
  )
}
