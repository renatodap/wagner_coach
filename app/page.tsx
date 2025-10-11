import Link from "next/link";
import { MessageSquare, Mic, Camera, Brain, Zap, TrendingUp, Check, X } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Hero Section - Problem + Solution */}
      <section className="px-4 py-20 md:py-32">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Headline */}
          <div className="space-y-4">
            <h1 className="font-heading text-5xl md:text-7xl lg:text-8xl text-iron-white uppercase tracking-wide leading-tight">
              Your AI Coach
              <span className="block text-iron-orange mt-2">Who Never Forgets</span>
            </h1>
            <p className="text-xl md:text-2xl text-iron-gray max-w-3xl mx-auto leading-relaxed">
              Remembers every meal, workout, and goal. Adapts your plan daily. Starts free.
            </p>
          </div>

          {/* CTA */}
          <div className="pt-6">
            <Link
              href="/auth"
              className="inline-block px-10 py-5 bg-iron-orange text-iron-black font-heading text-2xl uppercase tracking-widest hover:bg-orange-600 transition-colors"
            >
              Start Free
            </Link>
            <p className="text-iron-gray text-sm mt-4">
              No credit card • 5-second logging • AI that remembers everything
            </p>
          </div>

          {/* Visual Demo */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="relative aspect-video border-2 border-iron-orange bg-iron-gray/10">
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8">
                <div className="flex gap-8 text-iron-orange">
                  <div className="text-center">
                    <Mic className="w-16 h-16 mx-auto mb-2" />
                    <p className="text-sm text-iron-gray">Voice</p>
                  </div>
                  <div className="text-center">
                    <Camera className="w-16 h-16 mx-auto mb-2" />
                    <p className="text-sm text-iron-gray">Photo</p>
                  </div>
                  <div className="text-center">
                    <Zap className="w-16 h-16 mx-auto mb-2" />
                    <p className="text-sm text-iron-gray">Text</p>
                  </div>
                </div>
                <div className="text-center">
                  <Brain className="w-12 h-12 text-iron-orange mx-auto mb-2" />
                  <p className="text-iron-gray font-heading text-lg">AI BRAIN</p>
                </div>
                <p className="text-iron-gray text-sm text-center max-w-md">
                  Say "Had eggs and oats" → Snap your plate → Type naturally
                  <br />
                  <span className="text-iron-orange">AI logs everything instantly</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The Problem */}
      <section className="px-4 py-16 bg-iron-gray/5 border-y border-iron-gray">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl text-iron-orange uppercase text-center mb-12">
            Fitness Apps Make You Work For Them
          </h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border border-iron-gray p-6">
              <p className="text-iron-white text-lg mb-2">❌ 5 minutes to log breakfast</p>
              <p className="text-iron-gray text-sm">Search database → Select food → Enter amount → Repeat for each ingredient</p>
            </div>

            <div className="border border-iron-gray p-6">
              <p className="text-iron-white text-lg mb-2">❌ $150/month for a human coach</p>
              <p className="text-iron-gray text-sm">Limited availability, pre-set workouts, doesn't know your full history</p>
            </div>

            <div className="border border-iron-gray p-6">
              <p className="text-iron-white text-lg mb-2">❌ Data scattered across 5 apps</p>
              <p className="text-iron-gray text-sm">MyFitnessPal + Strava + Fitbit + Calendar + Notes = Chaos</p>
            </div>

            <div className="border border-iron-gray p-6">
              <p className="text-iron-white text-lg mb-2">❌ Cookie-cutter plans that don't adapt</p>
              <p className="text-iron-gray text-sm">Same workout every week, no adjustment based on YOUR progress</p>
            </div>
          </div>
        </div>
      </section>

      {/* The Solution - 4 Core Features */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-4xl md:text-5xl text-iron-orange uppercase text-center mb-16">
            Meet Your AI Coach
          </h2>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Feature 1: Instant Logging */}
            <div className="border border-iron-gray p-8 hover:border-iron-orange transition-colors">
              <div className="w-16 h-16 bg-iron-orange/20 border border-iron-orange flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-iron-orange" />
              </div>
              <h3 className="font-heading text-2xl text-iron-white uppercase mb-3">
                Instant Logging
              </h3>
              <p className="text-iron-gray text-lg leading-relaxed">
                Say "chicken and rice" or snap a photo. AI extracts nutrition, logs it automatically. <span className="text-iron-orange">5 seconds vs 5 minutes.</span>
              </p>
            </div>

            {/* Feature 2: Total Memory */}
            <div className="border border-iron-gray p-8 hover:border-iron-orange transition-colors">
              <div className="w-16 h-16 bg-iron-orange/20 border border-iron-orange flex items-center justify-center mb-4">
                <Brain className="w-8 h-8 text-iron-orange" />
              </div>
              <h3 className="font-heading text-2xl text-iron-white uppercase mb-3">
                Total Memory
              </h3>
              <p className="text-iron-gray text-lg leading-relaxed">
                AI remembers every meal, workout, sleep, injury you've ever logged. Ask "Am I eating enough protein?" → Get instant answers based on <span className="text-iron-orange">YOUR data.</span>
              </p>
            </div>

            {/* Feature 3: Adaptive Plans */}
            <div className="border border-iron-gray p-8 hover:border-iron-orange transition-colors">
              <div className="w-16 h-16 bg-iron-orange/20 border border-iron-orange flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-iron-orange" />
              </div>
              <h3 className="font-heading text-2xl text-iron-white uppercase mb-3">
                Adaptive Plans
              </h3>
              <p className="text-iron-gray text-lg leading-relaxed">
                AI generates 12-week programs and adjusts based on how you're actually performing. Plateau? <span className="text-iron-orange">AI modifies your plan.</span> Not cookie-cutter.
              </p>
            </div>

            {/* Feature 4: All-in-One */}
            <div className="border border-iron-gray p-8 hover:border-iron-orange transition-colors">
              <div className="w-16 h-16 bg-iron-orange/20 border border-iron-orange flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-iron-orange" />
              </div>
              <h3 className="font-heading text-2xl text-iron-white uppercase mb-3">
                All-in-One
              </h3>
              <p className="text-iron-gray text-lg leading-relaxed">
                Meals, workouts, sleep, wearables (Strava/Garmin), analytics. Everything in one place. <span className="text-iron-orange">No more app-hopping.</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-16 bg-iron-gray/5 border-y border-iron-gray">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-heading text-4xl md:text-5xl text-iron-orange uppercase text-center mb-12">
            How It Works
          </h2>

          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-14 h-14 bg-iron-orange text-iron-black font-heading text-2xl flex items-center justify-center">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-2xl text-iron-white uppercase mb-2">
                  Log Instantly
                </h3>
                <p className="text-iron-gray text-lg">
                  Talk, snap, or type. AI logs everything in 5 seconds.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-14 h-14 bg-iron-orange text-iron-black font-heading text-2xl flex items-center justify-center">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-2xl text-iron-white uppercase mb-2">
                  Ask AI Anything
                </h3>
                <p className="text-iron-gray text-lg">
                  Get answers based on YOUR complete fitness history. No generic advice.
                </p>
              </div>
            </div>

            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-14 h-14 bg-iron-orange text-iron-black font-heading text-2xl flex items-center justify-center">
                3
              </div>
              <div className="flex-1">
                <h3 className="font-heading text-2xl text-iron-white uppercase mb-2">
                  AI Adapts
                </h3>
                <p className="text-iron-gray text-lg">
                  Your plan evolves with you. Progress faster, plateau, get injured? AI adjusts.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-4xl md:text-5xl text-iron-orange uppercase text-center mb-12">
            How We Compare
          </h2>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full border border-iron-gray">
              <thead>
                <tr className="border-b border-iron-gray">
                  <th className="p-4 text-left font-heading text-iron-white uppercase">Feature</th>
                  <th className="p-4 text-center font-heading text-iron-orange uppercase bg-iron-orange/10">Us</th>
                  <th className="p-4 text-center font-heading text-iron-gray uppercase">MyFitnessPal</th>
                  <th className="p-4 text-center font-heading text-iron-gray uppercase">MacroFactor</th>
                  <th className="p-4 text-center font-heading text-iron-gray uppercase">Future</th>
                  <th className="p-4 text-center font-heading text-iron-gray uppercase">Carbon</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-iron-gray">
                  <td className="p-4 text-iron-white">Logging Time</td>
                  <td className="p-4 text-center text-iron-orange bg-iron-orange/10 font-bold">5 sec</td>
                  <td className="p-4 text-center text-iron-gray">2-5 min</td>
                  <td className="p-4 text-center text-iron-gray">2-5 min</td>
                  <td className="p-4 text-center text-iron-gray">N/A</td>
                  <td className="p-4 text-center text-iron-gray">Manual</td>
                </tr>
                <tr className="border-b border-iron-gray">
                  <td className="p-4 text-iron-white">Conversational AI Coach</td>
                  <td className="p-4 text-center bg-iron-orange/10"><Check className="w-6 h-6 text-iron-orange mx-auto" /></td>
                  <td className="p-4 text-center"><X className="w-6 h-6 text-iron-gray mx-auto" /></td>
                  <td className="p-4 text-center"><X className="w-6 h-6 text-iron-gray mx-auto" /></td>
                  <td className="p-4 text-center text-iron-gray">Human</td>
                  <td className="p-4 text-center text-iron-gray">Algorithm</td>
                </tr>
                <tr className="border-b border-iron-gray">
                  <td className="p-4 text-iron-white">Voice Logging</td>
                  <td className="p-4 text-center bg-iron-orange/10"><Check className="w-6 h-6 text-iron-orange mx-auto" /></td>
                  <td className="p-4 text-center"><X className="w-6 h-6 text-iron-gray mx-auto" /></td>
                  <td className="p-4 text-center"><X className="w-6 h-6 text-iron-gray mx-auto" /></td>
                  <td className="p-4 text-center"><X className="w-6 h-6 text-iron-gray mx-auto" /></td>
                  <td className="p-4 text-center"><X className="w-6 h-6 text-iron-gray mx-auto" /></td>
                </tr>
                <tr className="border-b border-iron-gray">
                  <td className="p-4 text-iron-white">Photo Logging</td>
                  <td className="p-4 text-center bg-iron-orange/10"><Check className="w-6 h-6 text-iron-orange mx-auto" /></td>
                  <td className="p-4 text-center"><X className="w-6 h-6 text-iron-gray mx-auto" /></td>
                  <td className="p-4 text-center"><X className="w-6 h-6 text-iron-gray mx-auto" /></td>
                  <td className="p-4 text-center"><X className="w-6 h-6 text-iron-gray mx-auto" /></td>
                  <td className="p-4 text-center"><X className="w-6 h-6 text-iron-gray mx-auto" /></td>
                </tr>
                <tr className="border-b border-iron-gray">
                  <td className="p-4 text-iron-white">Real-Time Adaptive Plans</td>
                  <td className="p-4 text-center bg-iron-orange/10"><Check className="w-6 h-6 text-iron-orange mx-auto" /></td>
                  <td className="p-4 text-center"><X className="w-6 h-6 text-iron-gray mx-auto" /></td>
                  <td className="p-4 text-center text-iron-gray">TDEE</td>
                  <td className="p-4 text-center"><Check className="w-6 h-6 text-iron-gray mx-auto" /></td>
                  <td className="p-4 text-center text-iron-gray">Macro</td>
                </tr>
                <tr className="border-b border-iron-gray">
                  <td className="p-4 text-iron-white">Nutrition + Training Unified</td>
                  <td className="p-4 text-center bg-iron-orange/10"><Check className="w-6 h-6 text-iron-orange mx-auto" /></td>
                  <td className="p-4 text-center text-iron-gray">Nutrition</td>
                  <td className="p-4 text-center text-iron-gray">Nutrition</td>
                  <td className="p-4 text-center"><Check className="w-6 h-6 text-iron-gray mx-auto" /></td>
                  <td className="p-4 text-center text-iron-gray">Nutrition</td>
                </tr>
                <tr>
                  <td className="p-4 text-iron-white font-bold">Cost/Month</td>
                  <td className="p-4 text-center text-iron-orange bg-iron-orange/10 font-heading text-2xl">FREE</td>
                  <td className="p-4 text-center text-iron-gray">$10</td>
                  <td className="p-4 text-center text-iron-gray">$15</td>
                  <td className="p-4 text-center text-iron-gray">$150</td>
                  <td className="p-4 text-center text-iron-gray">$10</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-6">
            <div className="border-2 border-iron-orange p-6 bg-iron-orange/10">
              <h3 className="font-heading text-2xl text-iron-orange uppercase mb-4">Us</h3>
              <ul className="space-y-2 text-iron-white">
                <li>✓ 5-second logging</li>
                <li>✓ Conversational AI Coach</li>
                <li>✓ Voice + Photo logging</li>
                <li>✓ Real-time adaptive plans</li>
                <li>✓ Nutrition + Training unified</li>
                <li className="font-heading text-xl text-iron-orange">FREE</li>
              </ul>
            </div>

            <div className="border border-iron-gray p-6">
              <h3 className="font-heading text-xl text-iron-white uppercase mb-4">MyFitnessPal, MacroFactor, Carbon</h3>
              <ul className="space-y-2 text-iron-gray">
                <li>✗ 2-5 minute logging</li>
                <li>✗ No conversational AI coach</li>
                <li>✗ Manual entry only</li>
                <li>✗ Nutrition OR training (not both)</li>
                <li className="text-iron-white">$10-$15/month</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="px-4 py-12 bg-iron-gray/5 border-y border-iron-gray">
        <div className="max-w-3xl mx-auto">
          <div className="border border-iron-orange p-8 text-center">
            <p className="text-iron-white text-xl md:text-2xl italic mb-4 leading-relaxed">
              "I used to spend 5 minutes logging every meal in MyFitnessPal. Now I just say 'had eggs and oats' and it's logged. The AI coach remembers everything I've eaten and gives me actual personalized advice. This is the future."
            </p>
            <p className="text-iron-orange text-sm uppercase font-heading">
              - Beta Tester
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-20">
        <div className="max-w-3xl mx-auto text-center space-y-8">
          <h2 className="font-heading text-4xl md:text-5xl text-iron-white uppercase leading-tight">
            Ready to Stop Fighting
            <span className="block text-iron-orange mt-2">Your Fitness App?</span>
          </h2>
          <Link
            href="/auth"
            className="inline-block px-10 py-5 bg-iron-orange text-iron-black font-heading text-2xl uppercase tracking-widest hover:bg-orange-600 transition-colors"
          >
            Start Free - No Credit Card
          </Link>
          <p className="text-iron-gray">
            5-second logging • AI that remembers everything • Adaptive plans • FREE forever
          </p>
        </div>
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-iron-gray py-8">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <p className="text-iron-gray text-sm">
            © 2024 AI Coach. Built for athletes, by athletes.
          </p>
        </div>
      </footer>
    </div>
  );
}
