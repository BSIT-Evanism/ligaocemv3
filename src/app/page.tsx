
import { Button } from "@/components/ui/button";
import { HydrateClient } from "@/trpc/server";
import { Navbar } from "@/components/navbar";
import Link from "next/link";
import { unstable_ViewTransition as ViewTransition } from "react";

export default async function Home() {
  return (
    <HydrateClient>
      <div className="min-h-screen bg-white">
        <Navbar />

        {/* Hero Section */}
        <main className="flex-1 flex items-center justify-center px-6 py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-black mb-6">
              Welcome to{" "}
              <span className="text-gray-600">Ligao Smart Cemetery</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
              Your comprehensive platform for managing and organizing everything you need in your cemetery.
              Get started today and experience the difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <ViewTransition name="cta-login">
                  <Button size="lg" className="bg-black hover:bg-gray-800 text-white px-8 py-3">
                    Get Started
                  </Button>
                </ViewTransition>
              </Link>
              <Button size="lg" variant="outline" className="px-8 py-3 border-gray-300 text-gray-700 hover:bg-gray-50">
                Learn More
              </Button>
            </div>
          </div>
        </main>
      </div>
    </HydrateClient>
  );
}
