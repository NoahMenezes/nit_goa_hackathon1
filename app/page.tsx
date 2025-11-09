"use client";

import Link from "next/link";
import { AlertCircle, TrendingUp, Shield, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NeonGradientCard } from "@/components/magicui/neon-gradient-card";
import { SparklesText } from "@/components/magicui/sparkles-text";
import { useAuth } from "@/contexts/auth-context";

export default function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-white/30 dark:bg-black/30">
      {/* Hero Section */}
      <main className="flex flex-1 flex-col">
        <section className="container mx-auto px-4 py-12 sm:py-16 md:py-20 lg:py-32">
          <div className="flex flex-col items-center gap-6 sm:gap-8 text-center">
            <div className="relative flex w-full flex-col items-center justify-center py-4 sm:py-6 md:py-8 lg:py-12">
              <SparklesText
                className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-black dark:text-white leading-tight max-w-4xl px-4 block"
                sparklesCount={30}
                colors={{
                  first: "#9E7AFF",
                  second: "#FE8BBB",
                }}
              >
                <span className="block whitespace-normal wrap-break-word">
                  Empower Your Community with OurStreet
                </span>
              </SparklesText>
            </div>

            <p className="max-w-2xl text-base sm:text-lg leading-7 sm:leading-8 text-gray-600 dark:text-gray-400 md:text-xl px-4">
              Report civic issues with description, photo, and live location.
              View them on an interactive city map and track their resolution
              progress in real-time. Bridge the gap between citizens and
              municipal authorities.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row w-full sm:w-auto px-4 sm:px-0">
              {!isAuthenticated ? (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 h-11 sm:h-10 px-6 sm:px-8 w-full sm:w-auto"
                  >
                    <Link href="/signup">Get Started</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-gray-300 dark:border-gray-700 h-11 sm:h-10 px-6 sm:px-8 w-full sm:w-auto"
                  >
                    <Link href="/map">View Map</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    asChild
                    size="lg"
                    className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 h-11 sm:h-10 px-6 sm:px-8 w-full sm:w-auto"
                  >
                    <Link href="/report">Report Issue</Link>
                  </Button>
                  <Button
                    asChild
                    size="lg"
                    variant="outline"
                    className="border-gray-300 dark:border-gray-700 h-11 sm:h-10 px-6 sm:px-8 w-full sm:w-auto"
                  >
                    <Link href="/dashboard">View Dashboard</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        {/* App Screen Showcase Section */}
        <section className="py-8 sm:py-12 md:py-16 bg-white/20 dark:bg-black/20 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="text-center mb-8 sm:mb-10 md:mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white md:text-4xl mb-3 sm:mb-4 px-4">
                See It In Action
              </h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
                Experience our intuitive dashboard that makes civic engagement
                simple and transparent
              </p>
            </div>

            <div className="relative mt-8 sm:mt-10 md:mt-12 overflow-visible px-2 sm:px-4">
              <NeonGradientCard className="relative mx-auto max-w-6xl shadow-2xl">
                <div className="relative min-h-[300px] sm:min-h-[400px] md:min-h-[500px] overflow-hidden rounded-xl bg-white dark:bg-black">
                  <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain"
                  >
                    <source src="/demo.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </NeonGradientCard>
              {/* Gradient fade effect */}
              <div className="absolute inset-x-0 -bottom-20 h-40 bg-linear-to-t from-white dark:from-black to-transparent pointer-events-none" />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-950/30 py-12 sm:py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="mb-10 sm:mb-12 md:mb-16 text-center">
              <h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white md:text-4xl px-4">
                Why OurStreet?
              </h2>
              <p className="mt-3 sm:mt-4 text-base sm:text-lg text-gray-600 dark:text-gray-400 px-4">
                Bridging the gap between citizens and municipal authorities
              </p>
            </div>

            <div className="grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
              <NeonGradientCard className="transition-all duration-300 ease-in-out hover:scale-[1.02] sm:hover:scale-[1.03] cursor-pointer">
                <div className="flex flex-col items-center gap-4 text-center p-4 sm:p-6">
                  <div className="flex size-10 sm:size-12 items-center justify-center rounded-lg bg-white/90 dark:bg-black/90 text-black dark:text-white">
                    <AlertCircle className="size-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-black dark:text-white">
                    Easy Reporting
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Report civic issues with description, photo, and live GPS
                    location in seconds
                  </p>
                </div>
              </NeonGradientCard>

              <NeonGradientCard className="transition-all duration-300 ease-in-out hover:scale-[1.02] sm:hover:scale-[1.03] cursor-pointer">
                <div className="flex flex-col items-center gap-4 text-center p-4 sm:p-6">
                  <div className="flex size-10 sm:size-12 items-center justify-center rounded-lg bg-white/90 dark:bg-black/90 text-black dark:text-white">
                    <MapPin className="size-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-black dark:text-white">
                    Interactive Map
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View all reported issues on an interactive city map with
                    color-coded status markers
                  </p>
                </div>
              </NeonGradientCard>

              <NeonGradientCard className="transition-all duration-300 ease-in-out hover:scale-[1.02] sm:hover:scale-[1.03] cursor-pointer">
                <div className="flex flex-col items-center gap-4 text-center p-4 sm:p-6">
                  <div className="flex size-10 sm:size-12 items-center justify-center rounded-lg bg-white/90 dark:bg-black/90 text-black dark:text-white">
                    <TrendingUp className="size-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-black dark:text-white">
                    Real-Time Tracking
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track issue progress from Open to In Progress to Resolved
                    with automated updates
                  </p>
                </div>
              </NeonGradientCard>

              <NeonGradientCard className="transition-all duration-300 ease-in-out hover:scale-[1.02] sm:hover:scale-[1.03] cursor-pointer">
                <div className="flex flex-col items-center gap-4 text-center p-4 sm:p-6">
                  <div className="flex size-10 sm:size-12 items-center justify-center rounded-lg bg-white/90 dark:bg-black/90 text-black dark:text-white">
                    <Shield className="size-6" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-black dark:text-white">
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
        <section className="border-t border-gray-200 dark:border-gray-800 py-12 sm:py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl">
              <h2 className="mb-6 sm:mb-8 text-2xl sm:text-3xl font-bold text-black dark:text-white md:text-4xl px-4">
                The Problem We Solve
              </h2>
              <div className="space-y-5 sm:space-y-6 text-gray-600 dark:text-gray-400 px-4">
                <p className="text-base sm:text-lg leading-relaxed">
                  Urban citizens often face everyday civic issues such as
                  potholes, broken streetlights, overflowing garbage, and water
                  leaks. However, the absence of accessible and transparent
                  reporting systems prevents these problems from being
                  efficiently addressed.
                </p>
                <p className="text-base sm:text-lg leading-relaxed">
                  Even when complaints are registered, citizens rarely receive
                  updates on their resolution, leading to low engagement,
                  duplicate reports, and a lack of accountability.
                </p>
                <p className="text-base sm:text-lg leading-relaxed">
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
        <section className="border-t border-gray-200 dark:border-gray-800 bg-white/20 dark:bg-black/20 py-12 sm:py-16 md:py-20">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <h2 className="mb-3 sm:mb-4 text-2xl sm:text-3xl font-bold text-black dark:text-white md:text-4xl px-4">
              Ready to Make a Difference?
            </h2>
            <p className="mb-6 sm:mb-8 text-base sm:text-lg text-gray-600 dark:text-gray-400 px-4">
              Join OurStreet today and help build a better community
            </p>
            {!isAuthenticated ? (
              <Button
                asChild
                size="lg"
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 h-11 sm:h-10 px-6 sm:px-8 w-full max-w-xs sm:w-auto"
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            ) : (
              <Button
                asChild
                size="lg"
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 h-11 sm:h-10 px-6 sm:px-8 w-full max-w-xs sm:w-auto"
              >
                <Link href="/report">Report Issue</Link>
              </Button>
            )}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50/30 dark:bg-gray-950/30 py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-3 sm:gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <MapPin className="size-5 text-black dark:text-white" />
              <span className="font-semibold text-black dark:text-white">
                OurStreet
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 text-center sm:text-left">
              © 2025 OurStreet. Empowering communities through technology.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
