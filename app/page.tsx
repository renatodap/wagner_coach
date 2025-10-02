import Link from "next/link";
import { MessageSquare, Mic, Camera, Calendar, TrendingUp, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-iron-black text-iron-white">
      {/* Hero Section */}
      <section className="px-4 py-12 md:py-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="space-y-6">
              <div>
                <h1 className="font-heading text-5xl md:text-7xl text-iron-orange uppercase tracking-wider mb-4">
                  Iron Discipline
                </h1>
                <p className="text-2xl md:text-3xl text-iron-white mb-4">
                  Your AI Fitness & Nutrition Coach
                </p>
                <p className="text-lg text-iron-gray">
                  Log meals in 5 seconds with voice or photos. Get personalized coaching from an AI that actually understands your journey.
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mic className="w-5 h-5 text-iron-orange" />
                  <span className="text-iron-white">Voice logging - just say what you ate</span>
                </div>
                <div className="flex items-center gap-3">
                  <Camera className="w-5 h-5 text-iron-orange" />
                  <span className="text-iron-white">Photo analysis - snap your meal, AI extracts nutrition</span>
                </div>
                <div className="flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-iron-orange" />
                  <span className="text-iron-white">AI coach - chat about workouts, nutrition, progress</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-iron-orange" />
                  <span className="text-iron-white">12-week programs - AI-generated, personalized to you</span>
                </div>
              </div>

              {/* CTA */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link
                  href="/auth"
                  className="px-8 py-4 bg-iron-orange text-iron-black font-heading text-xl uppercase tracking-widest hover:bg-orange-600 transition-colors text-center"
                >
                  Start Free
                </Link>
                <a
                  href="#how-it-works"
                  className="px-8 py-4 border-2 border-iron-orange text-iron-orange font-heading text-xl uppercase tracking-widest hover:bg-iron-orange hover:text-iron-black transition-colors text-center"
                >
                  See How
                </a>
              </div>

              <p className="text-iron-gray text-sm">
                No credit card required • Free forever for basic features
              </p>
            </div>

            {/* Right: Wagner Photo / Demo */}
            <div className="space-y-4">
              <div className="relative h-96 border-2 border-iron-orange">
                <div className="absolute inset-0 bg-iron-gray/20 flex items-center justify-center">
                  <div className="text-center">
                    <span className="text-iron-gray text-3xl font-heading">WAGNER</span>
                    <p className="text-iron-gray text-sm mt-2">[Demo Screenshot Here]</p>
                  </div>
                </div>
              </div>

              {/* Social Proof */}
              <div className="bg-iron-gray/10 border border-iron-gray p-4">
                <p className="text-iron-gray text-sm italic">
                  "Finally, a fitness app that doesn't make me spend 5 minutes logging breakfast. The voice logging is a game-changer."
                </p>
                <p className="text-iron-orange text-xs mt-2 uppercase">- Beta Tester</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-12 bg-iron-gray/5 border-y border-iron-gray">
        <div className="max-w-6xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl text-iron-orange uppercase text-center mb-12">
            Revolutionary Features
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-iron-orange/20 border border-iron-orange flex items-center justify-center">
                <Zap className="w-8 h-8 text-iron-orange" />
              </div>
              <h3 className="font-heading text-xl text-iron-white uppercase">Quick Entry</h3>
              <p className="text-iron-gray text-sm">
                Log meals in 5 seconds with voice or photos. No manual tracking, no databases, no bullshit. Just talk or snap.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-iron-orange/20 border border-iron-orange flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-iron-orange" />
              </div>
              <h3 className="font-heading text-xl text-iron-white uppercase">AI Coach</h3>
              <p className="text-iron-gray text-sm">
                Chat with an AI that knows your entire fitness history. Get personalized advice on workouts, nutrition, and recovery.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto bg-iron-orange/20 border border-iron-orange flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-iron-orange" />
              </div>
              <h3 className="font-heading text-xl text-iron-white uppercase">Smart Programs</h3>
              <p className="text-iron-gray text-sm">
                AI generates personalized 12-week programs based on your goals, experience, and preferences. Daily meal plans + workouts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-heading text-3xl md:text-4xl text-iron-orange uppercase text-center mb-12">
            How It Works
          </h2>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-iron-orange text-iron-black font-heading text-2xl flex items-center justify-center">
                1
              </div>
              <div>
                <h3 className="font-heading text-xl text-iron-white uppercase mb-2">Sign Up & Set Goals</h3>
                <p className="text-iron-gray">
                  Answer 3 quick questions about your fitness goals, experience level, and dietary preferences. Takes 30 seconds.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-iron-orange text-iron-black font-heading text-2xl flex items-center justify-center">
                2
              </div>
              <div>
                <h3 className="font-heading text-xl text-iron-white uppercase mb-2">Log Your Life</h3>
                <p className="text-iron-gray">
                  Voice: "Just had chicken and rice" • Photo: Snap your meal • Text: Type naturally. AI figures out the rest.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6">
              <div className="flex-shrink-0 w-12 h-12 bg-iron-orange text-iron-black font-heading text-2xl flex items-center justify-center">
                3
              </div>
              <div>
                <h3 className="font-heading text-xl text-iron-white uppercase mb-2">Get AI Coaching</h3>
                <p className="text-iron-gray">
                  Ask your AI coach anything: "Plan my meals", "Analyze my week", "What should I focus on?". Get instant, personalized answers.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-12">
            <Link
              href="/auth"
              className="inline-block px-8 py-4 bg-iron-orange text-iron-black font-heading text-xl uppercase tracking-widest hover:bg-orange-600 transition-colors"
            >
              Start Now - It's Free
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="px-4 py-12 bg-iron-gray/5 border-y border-iron-gray">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-3 gap-8 text-center">
            <div>
              <p className="font-heading text-4xl text-iron-orange">5 SEC</p>
              <p className="text-iron-gray text-sm uppercase mt-2">Avg. Log Time</p>
            </div>
            <div>
              <p className="font-heading text-4xl text-iron-orange">AI</p>
              <p className="text-iron-gray text-sm uppercase mt-2">Powered Coach</p>
            </div>
            <div>
              <p className="font-heading text-4xl text-iron-orange">FREE</p>
              <p className="text-iron-gray text-sm uppercase mt-2">Forever</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-iron-gray py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-iron-gray text-sm">
              © 2024 Iron Discipline. No excuses.
            </p>
            <div className="flex gap-6 text-sm text-iron-gray">
              <a href="#" className="hover:text-iron-orange transition-colors">Privacy</a>
              <a href="#" className="hover:text-iron-orange transition-colors">Terms</a>
              <a href="#" className="hover:text-iron-orange transition-colors">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}