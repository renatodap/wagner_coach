"use client";

import { motion } from "framer-motion";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/Button";
import { Check, Trophy, Zap, Target, Calendar, ChevronRight } from "lucide-react";
import Image from "next/image";

export default function Home() {
  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="min-h-screen relative flex items-center justify-center pt-16 overflow-hidden">
        {/* Background texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-wagner-black via-wagner-black/95 to-wagner-black" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-heading text-5xl md:text-7xl text-wagner-white uppercase tracking-wider leading-tight">
                FORGE YOUR
                <span className="text-wagner-orange block">ELITE PHYSIQUE</span>
              </h1>

              <p className="mt-6 text-xl text-wagner-gray max-w-xl">
                Wagner&apos;s brutal training system. No excuses. No shortcuts.
                Pure discipline that transforms average into elite.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a href="/dashboard-demo">
                  <Button variant="brutal" size="xl">
                    START NOW
                  </Button>
                </a>
                <Button variant="outline" size="xl" onClick={() => document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' })}>
                  SEE THE RESULTS
                </Button>
              </div>

              <div className="mt-12 grid grid-cols-3 gap-4">
                <div>
                  <p className="font-mono text-3xl text-wagner-orange">150+</p>
                  <p className="text-wagner-gray text-sm uppercase">Elite Athletes</p>
                </div>
                <div>
                  <p className="font-mono text-3xl text-wagner-orange">98%</p>
                  <p className="text-wagner-gray text-sm uppercase">Success Rate</p>
                </div>
                <div>
                  <p className="font-mono text-3xl text-wagner-orange">30</p>
                  <p className="text-wagner-gray text-sm uppercase">Days to Transform</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              <div className="relative h-[600px] overflow-hidden border-2 border-wagner-orange">
                <div className="absolute inset-0 bg-gradient-to-t from-wagner-black via-transparent to-transparent z-10" />
                <Image
                  src="/wagner/wagner-hero.png"
                  alt="Wagner - Elite Fitness Coach"
                  fill
                  className="object-cover object-center"
                  priority
                  placeholder="blur"
                  blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-wagner-orange p-4">
                <p className="font-heading text-wagner-black text-xl">NO PAIN NO GAIN</p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Program Section */}
      <section id="program" className="py-20 bg-wagner-black border-t-2 border-wagner-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-4xl md:text-6xl text-wagner-white uppercase tracking-wider">
              THE <span className="text-wagner-orange">BRUTAL</span> METHOD
            </h2>
            <p className="mt-4 text-wagner-gray text-xl max-w-2xl mx-auto">
              Four pillars of transformation. No compromise. Total domination.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Target className="w-8 h-8" />,
                title: "PRECISION TRAINING",
                description: "Every rep calculated. Every set purposeful. No wasted motion."
              },
              {
                icon: <Zap className="w-8 h-8" />,
                title: "EXPLOSIVE POWER",
                description: "Build strength that intimidates. Power that dominates."
              },
              {
                icon: <Calendar className="w-8 h-8" />,
                title: "IRON DISCIPLINE",
                description: "Daily accountability. Weekly progress. Monthly transformation."
              },
              {
                icon: <Trophy className="w-8 h-8" />,
                title: "ELITE RESULTS",
                description: "Join the 1%. Become unstoppable. Achieve the impossible."
              }
            ].map((pillar, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-wagner-black border-2 border-wagner-gray hover:border-wagner-orange transition-colors p-6"
              >
                <div className="text-wagner-orange mb-4">{pillar.icon}</div>
                <h3 className="font-heading text-xl text-wagner-white uppercase tracking-wider mb-2">
                  {pillar.title}
                </h3>
                <p className="text-wagner-gray text-sm">
                  {pillar.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-wagner-black/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-wagner-black border-4 border-wagner-orange p-8 md:p-12"
          >
            <div className="text-center mb-8">
              <h2 className="font-heading text-3xl md:text-5xl text-wagner-white uppercase tracking-wider">
                ONE PRICE. TOTAL ACCESS.
              </h2>
              <p className="mt-4 text-wagner-gray">
                No tiers. No upsells. Everything you need to become elite.
              </p>
            </div>

            <div className="flex justify-center items-baseline gap-2 mb-8">
              <span className="font-heading text-7xl md:text-8xl text-wagner-orange">
                $49
              </span>
              <span className="font-mono text-wagner-gray text-xl">
                /MONTH
              </span>
            </div>

            <ul className="space-y-4 mb-8 max-w-md mx-auto">
              {[
                "Custom AI workouts tailored to your goals",
                "24/7 Wagner AI coaching support",
                "Nutrition tracking & meal plans",
                "Form check with computer vision",
                "Weekly progress analysis",
                "Elite community access",
                "No contracts. Cancel anytime."
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <Check className="w-5 h-5 text-wagner-orange flex-shrink-0" />
                  <span className="text-wagner-white">{feature}</span>
                </li>
              ))}
            </ul>

            <a href="/dashboard-demo" className="block max-w-md mx-auto">
              <Button variant="brutal" size="xl" className="w-full">
                START YOUR TRANSFORMATION
              </Button>
            </a>

            <p className="text-center text-wagner-gray text-sm mt-6">
              Limited spots available. Application required.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section id="results" className="py-20 bg-wagner-black border-t-2 border-wagner-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-4xl md:text-6xl text-wagner-white uppercase tracking-wider">
              PROVEN <span className="text-wagner-orange">RESULTS</span>
            </h2>
            <p className="mt-4 text-wagner-gray text-xl max-w-2xl mx-auto">
              Real transformations. Real athletes. Real power.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "MARCUS R.",
                achievement: "Lost 30lbs, Gained Muscle",
                quote: "Wagner&apos;s system is brutal but it works. Best shape of my life at 40.",
                stats: { before: "210 lbs", after: "180 lbs", time: "12 weeks" }
              },
              {
                name: "ALEX T.",
                achievement: "Deadlift: 225 → 405 lbs",
                quote: "The discipline Wagner teaches goes beyond the gym. Life-changing.",
                stats: { before: "225 lbs", after: "405 lbs", time: "16 weeks" }
              },
              {
                name: "SARAH K.",
                achievement: "First Bodybuilding Show",
                quote: "From beginner to stage-ready. Wagner made the impossible possible.",
                stats: { before: "Beginner", after: "Competitor", time: "20 weeks" }
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-wagner-black border-2 border-wagner-gray p-6"
              >
                <div className="mb-4">
                  <h3 className="font-heading text-xl text-wagner-orange uppercase tracking-wider">
                    {testimonial.name}
                  </h3>
                  <p className="text-wagner-gray text-sm mt-1">
                    {testimonial.achievement}
                  </p>
                </div>

                <p className="text-wagner-white mb-6 italic">
                  &quot;{testimonial.quote}&quot;
                </p>

                <div className="grid grid-cols-3 gap-2 pt-4 border-t border-wagner-gray/30">
                  <div>
                    <p className="font-mono text-xs text-wagner-gray">BEFORE</p>
                    <p className="font-mono text-sm text-wagner-white">{testimonial.stats.before}</p>
                  </div>
                  <div>
                    <p className="font-mono text-xs text-wagner-gray">AFTER</p>
                    <p className="font-mono text-sm text-wagner-orange">{testimonial.stats.after}</p>
                  </div>
                  <div>
                    <p className="font-mono text-xs text-wagner-gray">TIME</p>
                    <p className="font-mono text-sm text-wagner-white">{testimonial.stats.time}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-wagner-black to-wagner-black/90">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="font-heading text-4xl md:text-6xl text-wagner-white uppercase tracking-wider mb-6">
              READY TO BECOME
              <span className="text-wagner-orange block">UNSTOPPABLE?</span>
            </h2>

            <p className="text-wagner-gray text-xl mb-8 max-w-2xl mx-auto">
              Limited spots available. Application process ensures you&apos;re ready for the transformation.
            </p>

            <a href="/dashboard-demo">
              <Button variant="brutal" size="xl">
                APPLY NOW <ChevronRight className="inline ml-2" />
              </Button>
            </a>

            <p className="text-wagner-gray text-sm mt-6">
              Next cohort starts Monday. Don&apos;t wait.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-wagner-black border-t-2 border-wagner-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-heading text-wagner-orange tracking-wider">
              IRON DISCIPLINE
            </p>
            <p className="text-wagner-gray text-sm">
              © 2024 Wagner Elite Fitness. Forge yourself.
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}