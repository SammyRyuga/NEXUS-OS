"use client";

import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

const links = [
  {
    label: "GITHUB",
    value: "SOURCE / CODE",
    href: "https://github.com/sammyryuga",
  },
  {
    label: "LINKEDIN",
    value: "PROFILE / CONNECT",
    href: "https://www.linkedin.com/in/samanyu-pattanayak-8757551a9/",
  },
  {
    label: "EMAIL",
    value: "DIRECT / CONTACT",
    href: "mailto:samanyupattanayak@gmail.com",
  },
];

export default function About() {
  const sectionRef = useRef(null);

  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 85%", "end 35%"],
  });

  const leftX = useTransform(
    scrollYProgress,
    [0, 0.55, 1],
    [-80, 0, 0]
  );

  const rightX = useTransform(
    scrollYProgress,
    [0, 0.55, 1],
    [80, 0, 0]
  );

  const leftOpacity = useTransform(
    scrollYProgress,
    [0, 0.4, 0.7],
    [0, 0.75, 1]
  );

  const rightOpacity = useTransform(
    scrollYProgress,
    [0, 0.45, 0.75],
    [0, 0.75, 1]
  );

  const lineScale = useTransform(
    scrollYProgress,
    [0, 0.65, 1],
    [0, 1, 1]
  );

  return (
    <section
      ref={sectionRef}
      className="relative overflow-hidden border-b border-neutral-900 bg-neutral-950"
    >
      <div className="mx-auto max-w-7xl px-6 py-32 lg:px-10 lg:py-44">

        <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">

          {/* LEFT — ABOUT */}
          <motion.div
            style={{
              x: leftX,
              opacity: leftOpacity,
            }}
          >
            <div className="font-mono text-[8px] uppercase tracking-[0.24em] text-cyan-500/70">
              04 / ABOUT
            </div>

            <h2 className="mt-5 text-5xl font-medium tracking-[-0.06em] text-white sm:text-7xl">
              Samanyu
              <br />
              Pattanayak.
            </h2>

            <div className="mt-10 max-w-xl space-y-5">
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-sm leading-7 text-neutral-500"
              >
                A computer science student interested in systems, software
                engineering, operating systems, and security-oriented
                computing.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.28 }}
                className="text-sm leading-7 text-neutral-600"
              >
                I like building things that sit close to the machine — systems
                that observe, reason about runtime behaviour, and give the
                operator meaningful control.
              </motion.p>
            </div>

            {/* SMALL SYSTEM SIGNAL */}
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              whileInView={{ width: 70, opacity: 1 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-10 h-px bg-cyan-400/50"
            />
          </motion.div>

          {/* RIGHT — EXTERNAL LINKS */}
          <motion.div
            style={{
              x: rightX,
              opacity: rightOpacity,
            }}
            className="border border-neutral-900 bg-black"
          >
            <div className="flex items-center justify-between border-b border-neutral-900 px-5 py-4">
              <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-neutral-700">
                EXTERNAL LINKS
              </span>

              <motion.span
                animate={{
                  opacity: [0.35, 0.8, 0.35],
                }}
                transition={{
                  duration: 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="font-mono text-[7px] uppercase tracking-[0.2em] text-cyan-500/60"
              >
                CONNECT
              </motion.span>
            </div>

            <div className="divide-y divide-neutral-900">
              {links.map((link, index) => (
                <motion.a
                  key={link.label}
                  href={link.href}
                  target={
                    link.href.startsWith("http")
                      ? "_blank"
                      : undefined
                  }
                  rel={
                    link.href.startsWith("http")
                      ? "noopener noreferrer"
                      : undefined
                  }
                  initial={{
                    opacity: 0,
                    x: 20,
                  }}
                  whileInView={{
                    opacity: 1,
                    x: 0,
                  }}
                  viewport={{
                    once: true,
                    amount: 0.35,
                  }}
                  transition={{
                    duration: 0.5,
                    delay: 0.2 + index * 0.12,
                    ease: "easeOut",
                  }}
                  className="group relative flex items-center justify-between overflow-hidden px-5 py-7 transition-colors duration-300 hover:bg-neutral-900/30"
                >
                  {/* HOVER SIGNAL */}
                  <motion.div
                    initial={{ x: "-100%" }}
                    whileHover={{ x: "0%" }}
                    transition={{
                      duration: 0.35,
                      ease: "easeOut",
                    }}
                    className="absolute inset-y-0 left-0 w-full bg-gradient-to-r from-cyan-400/[0.035] to-transparent"
                  />

                  <div className="relative z-10">
                    <div className="font-mono text-[8px] tracking-[0.2em] text-neutral-400 transition-colors duration-300 group-hover:text-white">
                      {link.label}
                    </div>

                    <div className="mt-2 font-mono text-[7px] tracking-[0.16em] text-neutral-700 transition-colors duration-300 group-hover:text-neutral-500">
                      {link.value}
                    </div>
                  </div>

                  <span className="relative z-10 text-neutral-700 transition-all duration-300 group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-cyan-400">
                    ↗
                  </span>
                </motion.a>
              ))}
            </div>
          </motion.div>
        </div>

        {/* FOOTER SYSTEM LINE */}
        <div className="mt-20 border-t border-neutral-900 pt-6">
          <div className="flex items-center justify-between">

            <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-neutral-800">
              BUILDING SYSTEMS
            </span>

            <div className="flex items-center gap-3">
              <motion.div
                style={{ scaleX: lineScale }}
                className="h-px w-12 origin-right bg-cyan-400/40"
              />

              <span className="font-mono text-[7px] uppercase tracking-[0.2em] text-neutral-800">
                NEXUS / 2026
              </span>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
}