"use client"

import { TrackingProvider } from "@/lib/templates/tracking-context"
import { PalaceConfigProvider } from "./_context"
import type { TemplateDefinition, TemplateProps } from "@/lib/templates/types"

// Layout components
import Hero from "./Hero"
import WinningsTicker from "./WinningsTicker"
import TrustBar from "./TrustBar"
import HowItWorks from "./HowItWorks"
import GamesShowcase from "./GamesShowcase"
import Benefits from "./Benefits"
import JackpotCounter from "./JackpotCounter"
import OfferCountdown from "./OfferCountdown"
import Testimonials from "./Testimonials"
import Security from "./Security"
import FinalCTA from "./FinalCTA"

// Floating / overlay components
import LiveNotifications from "./LiveNotifications"
import ScrollTracker from "./ScrollTracker"
import ExitIntentPopup from "./ExitIntentPopup"
import WhatsAppButton from "./WhatsAppButton"
import RecentDeposits from "./RecentDeposits"
import RegistrationProgress from "./RegistrationProgress"

function PalaceCasinoInner(props: TemplateProps) {
  return (
    <PalaceConfigProvider waPhone={props.waPhone} waMessage={props.waMessage}>
      <div className="min-h-screen font-sans antialiased">
        {/* Scroll tracking — invisible */}
        <ScrollTracker />

        {/* Main page sections */}
        <Hero />
        <WinningsTicker />
        <TrustBar />
        <HowItWorks />
        <GamesShowcase />
        <Benefits />
        <JackpotCounter />
        <OfferCountdown />
        <Testimonials />
        <Security />
        <FinalCTA />

        {/* Floating UI */}
        <LiveNotifications />
        <RecentDeposits />
        <RegistrationProgress />
        <ExitIntentPopup />
        <WhatsAppButton />
      </div>
    </PalaceConfigProvider>
  )
}

export function PalaceCasinoTemplate(props: TemplateProps) {
  return (
    <TrackingProvider
      pageId={props.pageId}
      projectId={props.projectId}
      sessionId={props.sessionId}
      lineId={props.lineId}
      waPhone={props.waPhone}
      waMessage={props.waMessage}
      fbp={props.fbp}
      fbc={props.fbc}
    >
      <PalaceCasinoInner {...props} />
    </TrackingProvider>
  )
}

export const PalaceCasinoDefinition: TemplateDefinition = {
  id: "palace-casino",
  name: "Palace Casino",
  description: "Landing page completa para casino online con social proof, juegos destacados y conversión a WhatsApp.",
  configSchema: [
    {
      key: "siteName",
      label: "Nombre del casino",
      type: "text",
      placeholder: "Palace Casino",
      required: true,
    },
  ],
  component: PalaceCasinoTemplate,
}
