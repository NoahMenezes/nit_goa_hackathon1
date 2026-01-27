"use client";

import { BorderBeam } from "@/components/magicui/border-beam";
import { RetroGrid } from "@/components/magicui/retro-grid";

export default function AnimationsDemo() {
  return (
    <div className="min-h-screen bg-white dark:bg-black p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <h1 className="text-4xl font-bold text-center mb-12">
          Animation Showcase
        </h1>

        {/* BorderBeam Examples */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold">BorderBeam Animation</h2>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="relative overflow-hidden rounded-lg border-2 border-gray-300 dark:border-gray-700 p-8 bg-white dark:bg-gray-900">
              <h3 className="text-xl font-semibold mb-4">Default Colors</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Watch the animated gradient beam travel along the borders
              </p>
              <BorderBeam duration={8} />
            </div>

            <div className="relative overflow-hidden rounded-lg border-2 border-gray-300 dark:border-gray-700 p-8 bg-white dark:bg-gray-900">
              <h3 className="text-xl font-semibold mb-4">Blue Theme</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Custom color gradient from cyan to blue
              </p>
              <BorderBeam duration={6} />
            </div>

            <div className="relative overflow-hidden rounded-lg border-2 border-gray-300 dark:border-gray-700 p-8 bg-white dark:bg-gray-900">
              <h3 className="text-xl font-semibold mb-4">Green Theme</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Fresh green gradient animation
              </p>
              <BorderBeam duration={10} />
            </div>

            <div className="relative overflow-hidden rounded-lg border-2 border-gray-300 dark:border-gray-700 p-8 bg-white dark:bg-gray-900">
              <h3 className="text-xl font-semibold mb-4">Red Theme</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Vibrant red to pink gradient
              </p>
              <BorderBeam duration={12} />
            </div>
          </div>
        </section>

        {/* RetroGrid Example */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold">RetroGrid Animation</h2>

          <div className="relative h-[400px] overflow-hidden rounded-lg border-2 border-gray-300 dark:border-gray-700 flex items-center justify-center">
            <h3 className="text-4xl font-bold z-10 relative text-center px-4">
              Retro Futuristic Grid Background
            </h3>
            <RetroGrid />
          </div>
        </section>

        {/* Combined Example */}
        <section className="space-y-8">
          <h2 className="text-3xl font-bold">Combined Animations</h2>

          <div className="relative overflow-hidden rounded-lg border-2 border-gray-300 dark:border-gray-700 h-[500px] flex items-center justify-center">
            <div className="z-10 relative text-center space-y-4">
              <h3 className="text-5xl font-bold">OurStreet</h3>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                BorderBeam + RetroGrid Together
              </p>
            </div>
            <BorderBeam duration={8} />
            <RetroGrid />
          </div>
        </section>
      </div>
    </div>
  );
}
