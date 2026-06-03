import { AppLayout } from "@/components/AppLayout";
import { AgentRegistrationForm } from "@/components/AgentRegistrationForm";

export default function RegisterAgent() {
  return (
    <AppLayout>
      <div style={{ display: "contents" }}>
        <AgentRegistrationForm autoOpen={true} />
      </div>
    </AppLayout>
  );
}
