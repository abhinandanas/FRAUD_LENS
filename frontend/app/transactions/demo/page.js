import AppShell from "../../../components/layout/AppShell";
import TransactionDemo from "../../../components/transactions/TransactionDemo";

export const metadata = {
  title: "Payment Demo • UPI Sentinel",
  description: "Real-time UPI transaction simulation and anomaly engine payload test.",
};

export default function PaymentDemoPage() {
  return (
    <AppShell>
      <div className="space-y-1 pb-2">
        <p className="font-mono-system text-[10px] font-bold tracking-[0.2em] text-[#7A8272] uppercase">
          SIMULATION ENVIRONMENT
        </p>
        <h1 className="font-editorial text-4xl font-bold text-[#2C3228] tracking-tight">
          UPI Payment Demo Surface
        </h1>
        <p className="text-xs text-[#6B7265] max-w-xl">
          Simulate realistic end-user payments to test anomaly score triggers in real time.
        </p>
      </div>

      <TransactionDemo />
    </AppShell>
  );
}
