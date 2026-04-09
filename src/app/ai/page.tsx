import { PageTransition } from "@/components/layout/page-transition";
import { AIAssistant } from "@/components/hmi/ai-assistant";

export function AIPage() {
  return (
    <PageTransition>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          height: "calc(100vh - 108px)",
        }}
      >
        <AIAssistant />
      </div>
    </PageTransition>
  );
}
