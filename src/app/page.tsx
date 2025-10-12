
import { Button } from "@/components/ui/button";
import { HydrateClient } from "@/trpc/server";
import { Navbar } from "@/components/navbar";
import Link from "next/link";
import { auth } from "@/server/auth";
import { headers } from "next/headers";

export default async function Home() {

  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList
  })


  return (
    <HydrateClient>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <Navbar />

        {/* Hero Section */}
        <main className="relative flex-1 flex items-center justify-center px-6 py-20 overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23f1f5f9%22%20fill-opacity%3D%220.4%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>

          <div className="relative max-w-6xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium mb-8">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
              Modern Cemetery Management
            </div>

            {/* Main Heading */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-slate-900 mb-6 lg:mb-8 leading-tight">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Ligao Smart Cemetery
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed font-light">
              Your comprehensive platform for managing and organizing everything you need in your cemetery.
              Experience the future of cemetery management with our intelligent, user-friendly system.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center mb-12 lg:mb-16">
              {session ? (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-10 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                    <span className="mr-2">🏠</span>
                    Go to Dashboard
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/search">
                    <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-10 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <span className="mr-2">🔍</span>
                      Search Graves
                    </Button>
                  </Link>
                  <Link href="/map">
                    <Button size="lg" variant="outline" className="px-10 py-4 text-lg font-semibold rounded-xl border-2 border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-all duration-300">
                      <span className="mr-2">🗺️</span>
                      View Map
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button size="lg" className="bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-900 hover:to-black text-white px-10 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                      <span className="mr-2">🔐</span>
                      Login
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-4xl mx-auto">
              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl">🗺️</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">Interactive Maps</h3>
                <p className="text-slate-600">Navigate through cemetery sections with our intuitive mapping system</p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">Smart Search</h3>
                <p className="text-slate-600">Find graves and information quickly with our advanced search capabilities</p>
              </div>

              <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mb-4 mx-auto">
                  <span className="text-2xl">📱</span>
                </div>
                <h3 className="text-xl font-semibold text-slate-800 mb-3">Mobile Ready</h3>
                <p className="text-slate-600">Access all features on any device with our responsive design</p>
              </div>
            </div>
          </div>
        </main>
      </div >
    </HydrateClient >
  );
}
