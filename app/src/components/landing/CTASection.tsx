"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Wallet, BookOpen, ArrowRight } from "lucide-react";

export default function CTASection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-chart-2/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#a9ff1f10_0%,transparent_70%)]" />

      <div className="max-w-4xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">
            Start Trading{" "}
            <span className="text-primary neon-text">Privately</span> Today
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Join the future of DeFi trading. Experience institutional-grade
            privacy with the transparency of blockchain.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button
              size="lg"
              className="neon-glow bg-primary text-primary-foreground hover:bg-primary/90 text-base px-8 py-6 group"
            >
              <Wallet className="mr-2 w-5 h-5" />
              Connect Wallet
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary/30 hover:bg-primary/10 text-base px-8 py-6"
            >
              <BookOpen className="mr-2 w-5 h-5" />
              View Documentation
            </Button>
          </div>
        </motion.div>

        {/* Trust Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16 pt-12 border-t border-border/50"
        ></motion.div>
      </div>
    </section>
  );
}
