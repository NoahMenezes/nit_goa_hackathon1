"use client";

import Link from "next/link";
import { AlertCircle, TrendingUp, Shield, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShuffleText } from "@/components/shuffle-text";
import "@/components/shuffle-text/shuffle.css";
import { NeonGradientCard } from "@/components/magicui/neon-gradient-card";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { useAuth } from "@/contexts/auth-context";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-white/30 dark:bg-black/30">
      {/* Hero Section */}
      <main className="flex flex-1 flex-col">
        <section className="container mx-auto px-4 py-20 md:py-32">
          <div className="flex flex-col items-center gap-8 text-center">
            <div className="relative flex w-full flex-col items-center justify-center py-8 md:py-12">
              <SparklesText
                className="pointer-events-none z-10 max-w-4xl text-4xl font-bold tracking-tight text-black dark:text-white sm:text-5xl md:text-6xl lg:text-7xl"
                sparklesCount={30}
                colors={{
                  first: "#9E7AFF",
                  second: "#FE8BBB",
                }}
              >
                <ShuffleText
                  text="Empower Your Community with OurStreet"
                  tag="h1"
                  className="pointer-events-none z-10"
                  shuffleDirection="right"
                  duration={1.5}
                  shuffleTimes={3}
                  animationMode="evenodd"
                  ease="power3.out"
                  stagger={0.08}
                  threshold={0.1}
                  triggerOnce={true}
                  triggerOnHover={true}
                  respectReducedMotion={true}
                />
              </SparklesText>
            </div>

            <p className="max-w-2xl text-lg leading-8 text-gray-600 dark:text-gray-400 sm:text-xl">
              Report civic issues with description, photo, and live location.
              View them on an interactive city map and track their resolution
              progress in real-time. Bridge the gap between citizens and
              municipal authorities.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row">
              {!isAuthenticated ? (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 h-10 px-8"
                  >
                    <Link href="/signup">Get Started</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-gray-300 dark:border-gray-700 h-10 px-8"
                  >
                    <Link href="/map">View Map</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 h-10 px-8"
                  >
                    <Link href="/report">Report Issue</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-gray-300 dark:border-gray-700 h-10 px-8"
                  >
                    <Link href="/dashboard">View Dashboard</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* App Screen Showcase Section */}
        <section className="py-8 bg-white/20 dark:bg-black/20 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-black dark:text-white sm:text-4xl mb-4">
                See It In Action
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
                Experience our intuitive dashboard that makes civic engagement
                simple and transparent
              </p>
            </div>

            <div className="relative mt-12 overflow-visible px-2 sm:px-4">
              <NeonGradientCard className="relative mx-auto max-w-6xl shadow-2xl">
                <div className="relative min-h-[500px] overflow-hidden rounded-xl bg-white dark:bg-black">
                  {/* Empty clean screen */}
                </div>
              </NeonGradientCard>
              {/* Gradient fade effect */}
              <div className="absolute inset-x-0 -bottom-20 h-40 bg-linear-to-t from-white dark:from-black to-transparent pointer-events-none" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-950/30 py-20">
          <div className="container mx-auto px-4">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold text-black dark:text-white sm:text-4xl">
                Why OurStreet?
              </h2>
              <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                Bridging the gap between citizens and municipal authorities
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <NeonGradientCard className="transition-all duration-300 ease-in-out hover:scale-[1.03] cursor-pointer">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-white/90 dark:bg-black/90 text-black dark:text-white">
                    <AlertCircle className="size-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-black dark:text-white">
                    Easy Reporting
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Report civic issues with description, photo, and live GPS
                    location in seconds
                  </p>
                </div>
              </NeonGradientCard>

              <NeonGradientCard className="transition-all duration-300 ease-in-out hover:scale-[1.03] cursor-pointer">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-white/90 dark:bg-black/90 text-black dark:text-white">
                    <MapPin className="size-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-black dark:text-white">
                    Interactive Map
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View all reported issues on an interactive city map with
                    color-coded status markers
                  </p>
                </div>
              </NeonGradientCard>

              <NeonGradientCard className="transition-all duration-300 ease-in-out hover:scale-[1.03] cursor-pointer">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-white/90 dark:bg-black/90 text-black dark:text-white">
                    <TrendingUp className="size-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-black dark:text-white">
                    Real-Time Tracking
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track issue progress from Open to In Progress to Resolved
                    with automated updates
                  </p>
                </div>
              </NeonGradientCard>

              <NeonGradientCard className="transition-all duration-300 ease-in-out hover:scale-[1.03] cursor-pointer">
                <div className="flex flex-col items-center gap-4 text-center">
                  <div className="flex size-12 items-center justify-center rounded-lg bg-white/90 dark:bg-black/90 text-black dark:text-white">
                    <Shield className="size-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-black dark:text-white">
                    Transparency
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Access impact reports and analytics for complete
                    accountability and transparency
                  </p>
                </div>
              </NeonGradientCard>
            </div>
          </div>
        </section>

        {/* Problem Statement Section */}
        <section className="border-t border-gray-200 dark:border-gray-800 py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-8 text-3xl font-bold text-black dark:text-white sm:text-4xl">
                The Problem We Solve
              </h2>
              <div className="space-y-6 text-gray-600 dark:text-gray-400">
                <p className="text-lg leading-relaxed">
                  Urban citizens often face everyday civic issues such as
                  potholes, broken streetlights, overflowing garbage, and water
                  leaks. However, the absence of accessible and transparent
                  reporting systems prevents these problems from being
                  efficiently addressed.
                </p>
                <p className="text-lg leading-relaxed">
                  Even when complaints are registered, citizens rarely receive
                  updates on their resolution, leading to low engagement,
                  duplicate reports, and a lack of accountability.
                </p>
                <p className="text-lg leading-relaxed">
                  <strong className="text-black dark:text-white">
                    OurStreet
                  </strong>{" "}
                  provides a smart, transparent, and community-driven platform
                  that enables effortless issue reporting, real-time tracking,
                  and improved collaboration between citizens and local
                  authorities — fostering a culture of civic participation and
                  data-driven governance.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="border-t border-gray-200 dark:border-gray-800 bg-white/20 dark:bg-black/20 py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="mb-4 text-3xl font-bold text-black dark:text-white sm:text-4xl">
              Ready to Make a Difference?
            </h2>
            <p className="mb-8 text-lg text-gray-600 dark:text-gray-400">
              Join OurStreet today and help build a better community
            </p>
            {!isAuthenticated ? (
              <Button
                asChild
                size="lg"
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 h-10 px-8"
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 h-10 px-8"
              >
                <Link href="/report">Report Issue</Link>
              </Button>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-950/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-black dark:text-white" />
              <span className="font-semibold text-black dark:text-white">
                OurStreet
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © 2025 OurStreet. Empowering communities through technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
