import type { Metadata } from "next";
import { Controller } from "@/components/controller/Controller";

export const metadata: Metadata = {
  title: "Eldad's Island · Phone controller",
  robots: { index: false },
};

export default function ControllerPage() {
  return <Controller />;
}
