import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-iron-black text-iron-white flex flex-col">
      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-md w-full space-y-8 text-center">
          {/* Logo/Title */}
          <div>
            <h1 className="font-heading text-5xl md:text-7xl text-iron-orange uppercase tracking-wider">
              Iron Discipline
            </h1>
            <p className="mt-2 text-xl text-iron-gray uppercase tracking-wide">
              Online Private Fitness Coaching
            </p>
          </div>

          {/* Wagner's Photo Placeholder */}
          <div className="relative h-64 w-64 mx-auto border-2 border-iron-orange">
            <div className="absolute inset-0 bg-iron-gray/20 flex items-center justify-center">
              <span className="text-iron-gray text-2xl font-heading">WAGNER</span>
            </div>
            {/* Add Wagner's image here when available */}
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="border border-iron-gray p-4">
              <p className="font-heading text-3xl text-iron-orange">CUSTOM</p>
              <p className="text-xs text-iron-gray uppercase mt-1">Workouts</p>
            </div>
            <div className="border border-iron-gray p-4">
              <p className="font-heading text-3xl text-iron-orange">DAILY</p>
              <p className="text-xs text-iron-gray uppercase mt-1">Programs</p>
            </div>
            <div className="border border-iron-gray p-4">
              <p className="font-heading text-3xl text-iron-orange">PROVEN</p>
              <p className="text-xs text-iron-gray uppercase mt-1">Results</p>
            </div>
          </div>

          {/* CTA Button */}
          <Link
            href="/auth"
            className="block w-full bg-iron-orange text-iron-black font-heading text-2xl py-4 uppercase tracking-widest hover:bg-orange-600 transition-colors"
          >
            Sign In
          </Link>

          {/* Tagline */}
          <p className="text-iron-gray text-sm">
            Transform your body. Build discipline. Achieve greatness.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-iron-gray py-4">
        <div className="max-w-md mx-auto px-4 text-center">
          <p className="text-iron-gray text-xs">
            © 2024 Iron Discipline. No excuses.
          </p>
        </div>
      </footer>
    </div>
  );
}