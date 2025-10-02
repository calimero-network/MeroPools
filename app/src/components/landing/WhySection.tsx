import { Card } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Eye, Rocket } from "lucide-react";

export default function WhySection() {
  return (
    <section className="py-24 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl sm:text-5xl font-bold mb-4">
            Why <span className="text-primary">Calimero + VeChain</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            The perfect combination of privacy and performance
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Card className="p-8 bg-card border-border hover:border-primary/50 transition-all duration-300 h-full">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <Eye className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  Calimero Private Contexts
                </h3>
              </div>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">
                      Confidential Computing:
                    </strong>{" "}
                    Your trade data never leaves the secure private context
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">
                      Private Data Storage:
                    </strong>{" "}
                    All sensitive information encrypted and isolated
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">Zero Knowledge:</strong>{" "}
                    Trade without revealing your strategy or position
                  </span>
                </li>
              </ul>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <Card className="p-8 bg-card border-border hover:border-primary/50 transition-all duration-300 h-full">
              <div className="mb-6">
                <div className="w-16 h-16 rounded-xl bg-chart-2/10 flex items-center justify-center mb-4">
                  <Rocket className="w-8 h-8 text-chart-2" />
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  VeChain Settlement Layer
                </h3>
              </div>
              <ul className="space-y-4 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">
                      Real Settlement:
                    </strong>{" "}
                    Actual on-chain finality for every trade
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">Lightning Fast:</strong>{" "}
                    Sub-2-second block times for instant execution
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-chart-2 mt-2 flex-shrink-0" />
                  <span>
                    <strong className="text-foreground">
                      Enterprise Grade:
                    </strong>{" "}
                    Trusted by global enterprises for mission-critical
                    operations
                  </span>
                </li>
              </ul>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
