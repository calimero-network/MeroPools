"use client";

import { Card } from "@/components/ui/card";
import { Shield, Zap, FileCheck, History, GitMerge } from "lucide-react";
import { motion } from "framer-motion";

const features = [
  {
    icon: Shield,
    title: "Privacy-Preserving Trading",
    description:
      "Powered by Calimero's private contexts, your trading activity remains completely confidential.",
  },
  {
    icon: Zap,
    title: "VeChain Settlement",
    description:
      "Secure, fast, and eco-friendly blockchain layer ensures reliable trade execution.",
  },
  {
    icon: FileCheck,
    title: "Escrow-based Orders",
    description:
      "Trustless execution with smart contract-based escrow ensures safety for all parties.",
  },
  {
    icon: History,
    title: "Order History & Tracking",
    description:
      "Private records only visible to you. Track all your trades with complete transparency.",
  },
  {
    icon: GitMerge,
    title: "HPABM Order Matching",
    description:
      "Simple batching algorithm ensures efficient matching for optimal trade execution.",
  },
];

export default function KeyFeatures() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8 bg-card/30">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Key <span className="text-primary">Features</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need for secure, private DeFi trading
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* First 3 features */}
          {features.slice(0, 3).map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 group h-full">
                <div className="mb-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors group-hover:scale-110 transform duration-300">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </Card>
            </motion.div>
          ))}

          {/* Last 2 features centered */}
          <div className="sm:col-span-2 lg:col-span-3 flex justify-center">
            <div className="grid sm:grid-cols-2 gap-6 max-w-2xl w-full">
              {features.slice(3).map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: (index + 3) * 0.1 }}
                >
                  <Card className="p-6 bg-card border-border hover:border-primary/50 transition-all duration-300 group h-full">
                    <div className="mb-4">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors group-hover:scale-110 transform duration-300">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
