"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";
import RotatingText from "@/components/landing/LandingText";
import Threads from "@/components/landing/BackgroundThread";
import { Button } from "@/components/ui/button";

export function LandingHero() {
  const t = useTranslations("landing");

  const heroTexts = [t("heroText0"), t("heroText1"), t("heroText2")];

  return (
    <>
      <div className="pointer-events-none fixed inset-0 -z-10">
        <Threads
          amplitude={1.2}
          distance={0.4}
          enableMouseInteraction={false}
        />
      </div>

      <div className="flex flex-col items-center gap-6 text-center">
        <p className="text-sm font-semibold tracking-[0.24em] text-primary uppercase">
          {t("brandName")}
        </p>

        <RotatingText
          texts={heroTexts}
          rotationInterval={[3000, 3000, 3000]}
          staggerDuration={0.03}
          staggerFrom="first"
          splitBy="characters"
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "-120%", opacity: 0 }}
          mainClassName="text-5xl font-bold tracking-tight justify-center md:text-7xl lg:text-8xl"
          splitLevelClassName="overflow-hidden"
          elementLevelClassName="text-foreground"
        />

        <p className="text-lg text-muted-foreground">{t("tagline")}</p>

        <motion.div
          className="mt-4 flex items-center gap-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 1.5 }}
        >
          <Button
            size="lg"
            variant="outline"
            className="cursor-pointer rounded-xl px-5"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            {t("login")}
          </Button>
          <Button
            size="lg"
            className="cursor-pointer rounded-xl px-5"
            nativeButton={false}
            render={<Link href="/sign-up" />}
          >
            {t("signUp")}
          </Button>
        </motion.div>
      </div>
    </>
  );
}
