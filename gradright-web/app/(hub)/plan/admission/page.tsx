import { AdmissionPredictorClient } from "@/components/student/plan/AdmissionPredictorClient";

export const metadata = {
  title: "Admission Predictor",
  description: "Check admission chances for your target universities.",
};

export default function AdmissionPredictorPage() {
  return <AdmissionPredictorClient />;
}
