"use client"

import { Card } from "@/components/ui/card"
import { Wallet, Lock, Zap } from "lucide-react"
import { motion } from "framer-motion"

const steps = [
  {
    icon: Wallet,
    title: "Deposit Tokens",
    description: "Securely deposit your tokens into a private Calimero context. Your funds are protected by advanced encryption.",
    step: "01",
  },
  {
    icon: Lock,
    title: "Create Private Orders",
    description: "Set your price, spread, and time limit. Your order details remain completely private until execution.",
    step: "02",
  },
  {
    icon: Zap,
    title: "Match & Settle",
    description: "Orders are matched via private nodes and settled instantly on VeChain's fast, eco-friendly blockchain.",
    step: "03",
  },
]

export default function HowItWorks() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 relative">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            How <span className="text-primary">MeroPools</span> Works
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Three simple steps to private, secure DeFi trading
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.step}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <Card className="relative p-8 bg-card border-border hover:border-primary/50 transition-all duration-300 group h-full">
                {/* Step Number */}
                <div className="absolute top-6 right-6 text-6xl font-bold text-primary/10 group-hover:text-primary/20 transition-colors">
                  {step.step}
                </div>

                {/* Icon */}
                <div className="mb-6 relative">
                  <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <step.icon className="w-8 h-8 text-primary" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>

                {/* Connector Arrow (hidden on last item on desktop) */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <div className="w-8 h-0.5 bg-gradient-to-r from-primary/50 to-transparent" />
                  </div>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}