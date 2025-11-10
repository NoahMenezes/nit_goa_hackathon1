"use client";

import Link from "next/link";
import Image from "next/image";
import { Github, Linkedin, Mail, Users, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NeonGradientCard } from "@/components/magicui/neon-gradient-card";

const teamMembers = [
  {
    name: "Noah Menezes",
    role: "Frontend Developer",
    bio: "Passionate about building civic tech solutions",
    image: "/team/noah.png",
    github: "https://github.com/NoahMenezes",
    linkedin: "http://www.linkedin.com/in/noah-menezes-26066a351",
    email: "2006noahmenezes@gmail.com",
  },
  {
    name: "Vibhu Porobo",
    role: "Backend Developer",
    bio: "Expert in building scalable backend systems",
    image: "/team/vibhu.png",
    github: "https://github.com/lostuser01",
    linkedin:
      "https://www.linkedin.com/in/vibhu-porobo-a26521338?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app",
    email: "vibhuporobo@gmail.com",
  },
  {
    name: "Vibhav Bilgoji",
    role: "Backend Developer",
    bio: "Specialized in system architecture and API design",
    image: "/team/vibhav.png",
    github: "https://github.com/VibhavBilgoji",
    linkedin: "https://www.linkedin.com/in/vibhav-bilgoji-5997b518a/",
    email: "vibhavbilgoji@gmail.com",
  },
];

export default function TeamPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-black">
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12 md:py-16">
          {/* Page Header */}
          <div className="mb-10 sm:mb-12 md:mb-16 text-center">
            <div className="mb-3 sm:mb-4 inline-flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm">
              <Users className="size-3 sm:size-4" />
              <span className="text-gray-700 dark:text-gray-300">
                NIT Goa Hackathon Team
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-black dark:text-white mb-3 sm:mb-4 px-4">
              Meet Our Team
            </h1>
            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-4">
              We&apos;re a passionate team of developers working to bridge the
              gap between citizens and municipal authorities through technology.
            </p>
          </div>

          {/* Team Members Grid */}
          <div className="grid gap-6 sm:gap-8 md:gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mb-12 sm:mb-14 md:mb-16 max-w-6xl mx-auto">
            {teamMembers.map((member, index) => (
              <div
                key={index}
                className="group relative overflow-hidden rounded-2xl"
              >
                <NeonGradientCard className="h-full">
                  <div className="flex flex-col items-center text-center p-6 sm:p-8">
                    {/* Image Container with Hover Animation */}
                    <div className="relative w-32 h-32 sm:w-40 sm:h-40 mb-4 sm:mb-6 overflow-hidden rounded-full border-4 border-gradient-to-r from-blue-400 to-purple-500 transform transition-all duration-500 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-blue-500/50">
                      <Image
                        src={member.image}
                        alt={member.name}
                        width={160}
                        height={160}
                        className="w-full h-full object-cover transition-all duration-500 group-hover:scale-125"
                        priority
                      />
                      {/* Overlay Effect on Hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </div>

                    {/* Name with Hover Animation */}
                    <h3 className="text-xl sm:text-2xl font-bold text-black dark:text-white mb-2 transform transition-all duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600">
                      {member.name}
                    </h3>

                    {/* Role with Color Transition */}
                    <p className="text-sm sm:text-base font-semibold text-blue-600 dark:text-blue-400 mb-2 sm:mb-3 transform transition-all duration-300 group-hover:text-purple-600 dark:group-hover:text-purple-400">
                      {member.role}
                    </p>

                    {/* Bio with Fade Effect */}
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 line-clamp-2 transform transition-all duration-300 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                      {member.bio}
                    </p>

                    {/* Social Links Container */}
                    <div className="flex gap-2 sm:gap-3 transform transition-all duration-300 group-hover:scale-110">
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 sm:p-3 rounded-full border-2 border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-900 transform transition-all duration-300 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/50 group/icon"
                      >
                        <Github className="size-4 sm:size-5 text-gray-700 dark:text-white group-hover/icon:text-white transition-colors" />
                      </a>
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 sm:p-3 rounded-full border-2 border-gray-300 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 bg-white dark:bg-gray-900 transform transition-all duration-300 hover:bg-blue-500 hover:shadow-lg hover:shadow-blue-500/50 group/icon"
                      >
                        <Linkedin className="size-4 sm:size-5 text-gray-700 dark:text-white group-hover/icon:text-white transition-colors" />
                      </a>
                      <a
                        href={`mailto:${member.email}`}
                        className="p-2 sm:p-3 rounded-full border-2 border-gray-300 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 bg-white dark:bg-gray-900 transform transition-all duration-300 hover:bg-purple-500 hover:shadow-lg hover:shadow-purple-500/50 group/icon"
                      >
                        <Mail className="size-4 sm:size-5 text-gray-700 dark:text-white group-hover/icon:text-white transition-colors" />
                      </a>
                    </div>
                  </div>
                </NeonGradientCard>

                {/* Background Glow Effect on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-purple-500/0 to-blue-500/0 group-hover:from-blue-500/20 group-hover:via-purple-500/20 group-hover:to-blue-500/20 rounded-2xl transition-all duration-500 pointer-events-none" />
              </div>
            ))}
          </div>

          {/* Project Info */}
          <NeonGradientCard className="overflow-hidden transition-all duration-300 ease-in-out hover:scale-[1.01] sm:hover:scale-[1.02] cursor-pointer max-w-4xl mx-auto">
            <div className="text-center max-w-3xl mx-auto p-6 sm:p-8">
              <h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white mb-3 sm:mb-4 px-4">
                About OurStreet
              </h2>
              <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 px-4">
                OurStreet is our submission for the NIT Goa Hackathon, focusing
                on CivicTech and Social Good. Our mission is to create a
                transparent, accountable, and participatory civic ecosystem
                through technology and collaboration.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
                <Button
                  asChild
                  size="lg"
                  className="bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transform transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                >
                  <Link href="/map">View Map</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-gray-800 dark:border-gray-800 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-900 transform transition-all duration-300 hover:scale-105 w-full sm:w-auto"
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              </div>
            </div>
          </NeonGradientCard>

          {/* Tech Stack */}
          <div className="mt-12 sm:mt-14 md:mt-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-black dark:text-white text-center mb-6 sm:mb-8 px-4">
              Built With
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
              {[
                "Next.js 14",
                "TypeScript",
                "Tailwind CSS",
                "gsap",
                "React",
                "Node.js",
                "Recharts",
                "Lucide Icons",
              ].map((tech) => (
                <div
                  key={tech}
                  className="p-3 sm:p-4 text-center border border-gray-200 dark:border-gray-800 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900 transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer"
                >
                  <span className="text-xs sm:text-sm font-medium text-black dark:text-white">
                    {tech}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-12 sm:mt-14 md:mt-16 text-center">
            <div className="p-6 sm:p-8 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-gray-950 max-w-2xl mx-auto transform transition-all duration-300 hover:shadow-lg hover:scale-105">
              <h2 className="text-xl sm:text-2xl font-bold text-black dark:text-white mb-3 sm:mb-4 px-4">
                Want to Contribute?
              </h2>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 px-4">
                OurStreet is an open-source project. We welcome contributions
                from the community!
              </p>
              <Button
                asChild
                size="lg"
                className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 transform transition-all duration-300 hover:scale-105 w-full sm:w-auto"
              >
                <a
                  href="https://github.com/VibhavBilgoji/NIT_GOA_HACKATHON-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Github className="mr-2 size-4 sm:size-5" />
                  View on GitHub
                </a>
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 py-6 sm:py-8">
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
