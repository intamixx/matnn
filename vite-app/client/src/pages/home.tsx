import { CheckboxForm } from "@/components/CheckboxForm";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h1 className="text-2xl font-medium text-gray-800 mb-6">Matnn (Music Audio Tagger Neural Net)</h1>
        <CheckboxForm />
      </div>
    </div>
  );
}
