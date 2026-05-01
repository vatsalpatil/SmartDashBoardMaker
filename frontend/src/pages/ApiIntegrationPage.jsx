import React from "react";
import { useSearchParams } from "react-router-dom";
import ApiDataEnginePanel from "../components/api/ApiDataEnginePanel";
import { PageContainer } from "../components/ui";
import { PlugZap } from "lucide-react";

export default function ApiIntegrationPage() {
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");

  return (
    <PageContainer wide>
      <div className="flex flex-col gap-10 animate-fade-in w-full pb-20">
        {/* Page Header */}
        <div className="flex items-center justify-between flex-wrap gap-6 pt-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-accent-muted flex items-center justify-center shrink-0 shadow-lg shadow-accent/10">
              <PlugZap size={28} className="text-accent" />
            </div>
            <div>
              <h1 className="text-[32px] font-black text-text-primary tracking-tight leading-tight">
                API Data Engine
              </h1>
              <p className="text-[15px] text-text-tertiary mt-1 font-medium italic">
                Turn any REST endpoint into a powerful analytics table
              </p>
            </div>
          </div>
        </div>

        {/* Modular Data Engine Panel */}
        <div className="bg-bg-surface rounded-[32px] border border-border-muted p-8 shadow-2xl relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-emerald/5 rounded-full blur-[100px] pointer-events-none" />
          
          <ApiDataEnginePanel initialDatasetId={editId} />
        </div>
      </div>
    </PageContainer>
  );
}
