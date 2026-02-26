import { Bike } from "lucide-react";

export function PrimaMotorLogo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-10 h-10 bg-amber-600 rounded-lg flex items-center justify-center text-white shadow-lg -rotate-3">
        <Bike className="h-6 w-6" />
      </div>
      <div className="text-left">
        <h1 className="text-3xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
          PRIMA
        </h1>
        <p className="text-[0.65rem] uppercase tracking-widest font-bold text-amber-600 -mt-1">
          MOTOR
        </p>
      </div>
    </div>
  );
}
