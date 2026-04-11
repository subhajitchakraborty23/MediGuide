"use client";

import { motion } from "framer-motion";
import { PharmacyMap } from "@/components/PharmacyMap";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function PharmacyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-12">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bebas font-bold mb-4">
            Find <span className="text-primary">Nearby Pharmacies</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl">
            Browse nearby medicine shops to get the medications you need. No
            doctor consultation required. We'll show you the nearest pharmacies
            with their hours, ratings, and contact information.
          </p>
        </motion.div>

        {/* Info Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
        >
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-primary text-3xl font-bold mb-2">🗺️</div>
            <p className="text-white/70">
              Real-time location tracking to find the nearest pharmacy
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-primary text-3xl font-bold mb-2">📞</div>
            <p className="text-white/70">
              Direct phone numbers and website links for easy contact
            </p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
            <div className="text-primary text-3xl font-bold mb-2">⭐</div>
            <p className="text-white/70">
              Real ratings and open/closed status for each pharmacy
            </p>
          </div>
        </motion.div>

        {/* Map Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mb-12"
        >
          <div className="bg-white/5 border border-white/10 rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-2xl font-bold mb-6">Your Nearby Pharmacies</h2>
            <PharmacyMap />
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              Back to Home
            </Button>
          </Link>
          <Link href="/triage">
            <Button className="w-full sm:w-auto bg-primary text-black hover:bg-primary/90">
              Need Doctor's Help? Take Triage
            </Button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}
