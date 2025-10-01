"use client";

import { Github, Twitter, FileText, MessageCircle } from "lucide-react";

export default function Footer() {
  const socialLinks = [
    { icon: Github, label: "GitHub", href: "#" },
    { icon: Twitter, label: "Twitter/X", href: "#" },
    { icon: MessageCircle, label: "Discord", href: "#" },
    { icon: FileText, label: "Docs", href: "#" },
  ];

  const footerLinks = [
    {
      title: "Product",
      links: [
        { label: "Features", href: "#features" },
        { label: "How It Works", href: "#how-it-works" },
        { label: "Roadmap", href: "#" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "Documentation", href: "#" },
        { label: "API Reference", href: "#" },
        { label: "Whitepaper", href: "#" },
      ],
    },
    {
      title: "Community",
      links: [
        { label: "Discord", href: "#" },
        { label: "Twitter", href: "#" },
        { label: "GitHub", href: "#" },
      ],
    },
  ];

  return (
    <footer className="bg-card/30 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                <div className="w-4 h-4 rounded bg-primary" />
              </div>
              <span className="text-xl font-bold">
                Mero<span className="text-primary">Pools</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Private DeFi trading powered by Calimero + VeChain
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  className="w-9 h-9 rounded-lg bg-muted hover:bg-primary/20 flex items-center justify-center transition-colors group"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {footerLinks.map((section) => (
            <div key={section.title}>
              <h3 className="font-semibold mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 MeroPools. All rights reserved.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            Powered by
            <span className="text-primary font-semibold">Calimero</span>+
            <span className="text-chart-2 font-semibold">VeChain</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
